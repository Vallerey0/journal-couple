-- Migration script to replace process_paid_payment with handle_payment_success

-- 0. Clean up promotion_redemptions table (Remove intent_id as requested)
-- We strictly only want redemptions linked to confirmed payments.
alter table if exists promotion_redemptions drop column if exists intent_id;

-- 1. Drop the old function if it exists
DROP FUNCTION IF EXISTS process_paid_payment(uuid, text, text, text);
DROP FUNCTION IF EXISTS process_paid_payment(uuid, text); -- In case of overload

-- 2. Create the new function
create or replace function handle_payment_success(
  p_intent_id uuid,
  p_provider_order_id text,
  p_payment_type text,
  p_payment_channel text
)
returns void
language plpgsql
security definer
as $$
declare
  v_intent record;
  v_payment_id uuid;
  v_now timestamptz := now();
  v_base timestamptz;
  v_end timestamptz;
  v_duration integer;
  v_updated_count int;
  v_coupon_promo_id uuid;
  v_promos_to_redeem uuid[];
  v_pid uuid;
  
  -- Variables for quota check
  v_max_redemptions int;
  v_max_per_user int;
  v_current_count int;
  v_user_count int;
begin

  ------------------------------------------------------------
  -- 1️⃣ Lock & Get Intent
  ------------------------------------------------------------
  select *
  into v_intent
  from payment_intents
  where id = p_intent_id
  for update;

  if not found then
    raise exception 'Intent not found';
  end if;

  if v_intent.status = 'paid' then
    -- Already paid, ignore
    return;
  end if;

  ------------------------------------------------------------
  -- 2️⃣ Insert Payment Record
  ------------------------------------------------------------
  -- Check if payment already exists (idempotency)
  select id into v_payment_id from payments where provider_order_id = p_provider_order_id;
  
  if v_payment_id is null then
    insert into payments (
      user_id,
      gross_amount,
      provider,
      provider_order_id,
      status,
      payment_type,
      payment_channel,
      intent_id,
      plan_id,
      promotion_id,
      paid_at
    )
    values (
      v_intent.user_id,
      v_intent.final_price_idr,
      'midtrans', -- Hardcoded or param
      p_provider_order_id,
      'paid',
      p_payment_type,
      p_payment_channel,
      p_intent_id,
      v_intent.plan_id,
      v_intent.promotion_id,
      v_now
    )
    returning id into v_payment_id;
  else
     select id into v_payment_id from payments where provider_order_id = p_provider_order_id;
  end if;
  
  if v_payment_id is null then
    raise exception 'Failed to resolve payment id';
  end if;

  ------------------------------------------------------------
  -- 3️⃣ Mark Intent Processed (Atomic Guard)
  ------------------------------------------------------------
  update payment_intents
  set status = 'paid',
      processed_at = v_now,
      midtrans_order_id = p_provider_order_id
  where id = p_intent_id
    and processed_at is null
    and status = 'pending';

  if not found then
    return;
  end if;

  ------------------------------------------------------------
  -- 4️⃣ Redeem Promotions (Always Fresh)
  ------------------------------------------------------------
  
  -- Collect all promos to redeem (Auto Promo + Coupon)
  v_promos_to_redeem := array[]::uuid[];
  
  -- 1. Auto Promo (from intent.promotion_id)
  if v_intent.promotion_id is not null then
    v_promos_to_redeem := array_append(v_promos_to_redeem, v_intent.promotion_id);
  end if;
  
  -- 2. Coupon Promo (from intent.coupon_code)
  if v_intent.coupon_code is not null then
    select id into v_coupon_promo_id from promotions where lower(code) = lower(v_intent.coupon_code) limit 1;
    if v_coupon_promo_id is not null then
       v_promos_to_redeem := array_append(v_promos_to_redeem, v_coupon_promo_id);
    end if;
  end if;

  -- Deduplicate promos
  if v_promos_to_redeem is not null and array_length(v_promos_to_redeem, 1) > 0 then
    select array_agg(distinct x) 
    into v_promos_to_redeem 
    from unnest(v_promos_to_redeem) x;
  end if;

  -- Iterate and Redeem each
  if coalesce(array_length(v_promos_to_redeem, 1), 0) > 0 then
    foreach v_pid in array v_promos_to_redeem
    loop
      begin
           -- Lock promotion row
           select max_redemptions, max_redemptions_per_user
           into v_max_redemptions, v_max_per_user
           from promotions
           where id = v_pid
             and is_active = true
             and start_at <= v_now
             and (end_at is null or end_at >= v_now)
           for update;

           if found then
              -- Check global quota
              if v_max_redemptions is not null then
                select count(1) into v_current_count 
                from promotion_redemptions 
                where promotion_id = v_pid
                and payment_id is not null;
                
                if v_current_count >= v_max_redemptions then
                   -- Quota full, skip this promo (don't fail payment)
                   continue; 
                end if;
              end if;

              -- Check user quota
              if v_max_per_user is not null and v_max_per_user > 0 then
                select count(1) into v_user_count 
                from promotion_redemptions 
                where promotion_id = v_pid and user_id = v_intent.user_id
                and payment_id is not null;
                
                if v_user_count >= v_max_per_user then
                   -- User limit, skip
                   continue;
                end if;
              end if;

              -- Insert redemption
              insert into promotion_redemptions (
                promotion_id,
                user_id,
                plan_id,
                payment_id,
                redeemed_at
              )
              values (
                v_pid,
                v_intent.user_id,
                v_intent.plan_id,
                v_payment_id,
                v_now
              )
              on conflict (promotion_id, payment_id) do nothing;
           end if;
        exception when others then
             -- Log error but ensure subscription is granted
             raise notice 'Promo redemption error: %', sqlerrm;
        end;
      end loop;
    end if;
    
  ------------------------------------------------------------
  -- 5️⃣ Get Plan Duration (Strict Check)
  ------------------------------------------------------------
  select duration_days
  into v_duration
  from subscription_plans
  where id = v_intent.plan_id
  for share;

  if v_duration is null or v_duration <= 0 then
    raise exception 'Invalid plan duration';
  end if;

  ------------------------------------------------------------
  -- 6️⃣ Lock Profile & Calculate Stacking
  ------------------------------------------------------------
  select
    case
      when active_until is not null and active_until > v_now
        then active_until
      else v_now
    end
  into v_base
  from profiles
  where id = v_intent.user_id
  for update;

  if v_base is null then
    raise exception 'Profile not found';
  end if;

  v_end := v_base + (v_duration * interval '1 day');

  ------------------------------------------------------------
  -- 7️⃣ Expire Existing Active Subscription
  ------------------------------------------------------------
  update subscriptions
  set status = 'expired',
      end_at = v_base
  where user_id = v_intent.user_id
    and status = 'active';

  ------------------------------------------------------------
  -- 8️⃣ Insert New Subscription
  ------------------------------------------------------------
  insert into subscriptions (
    user_id,
    plan_id,
    status,
    start_at,
    end_at
  )
  values (
    v_intent.user_id,
    v_intent.plan_id,
    'active',
    v_base,
    v_end
  );
  
  ------------------------------------------------------------
  -- 9️⃣ Update Profile Active Until
  ------------------------------------------------------------
  update profiles
  set active_until = v_end,
      current_plan_id = v_intent.plan_id
  where id = v_intent.user_id;

end;
$$;

-- 3. Create indexes (if not exist)
create index IF not exists idx_promo_redemptions_user on public.promotion_redemptions using btree (user_id);
create index IF not exists idx_promo_redemptions_promo on public.promotion_redemptions using btree (promotion_id);
create unique INDEX IF not exists promo_redemptions_unique_user_plan on public.promotion_redemptions using btree (promotion_id, user_id, plan_id);
create index IF not exists idx_promo_redemptions_promo_user on public.promotion_redemptions using btree (promotion_id, user_id);
create unique INDEX IF not exists idx_promo_redemptions_unique_payment on public.promotion_redemptions using btree (promotion_id, payment_id);
create index IF not exists idx_redemptions_paid on public.promotion_redemptions using btree (promotion_id) where (payment_id is not null);
