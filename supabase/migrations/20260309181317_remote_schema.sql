create extension if not exists "pg_cron" with schema "pg_catalog";

create extension if not exists "hypopg" with schema "extensions";

create extension if not exists "index_advisor" with schema "extensions";

drop extension if exists "pg_net";

create type "public"."payment_intent_status" as enum ('pending', 'paid', 'failed', 'expired');

create type "public"."payment_status" as enum ('paid', 'failed', 'expired');

create type "public"."subscription_status" as enum ('active', 'expired', 'canceled');


  create table "public"."couple_story_phases" (
    "id" uuid not null default gen_random_uuid(),
    "couple_id" uuid not null,
    "phase_key" text not null,
    "title" text,
    "story" text not null,
    "story_date" date,
    "is_visible" boolean not null default true,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."couple_story_phases" enable row level security;


  create table "public"."couples" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "male_name" text not null,
    "female_name" text not null,
    "male_nickname" text,
    "female_nickname" text,
    "male_birth_date" date,
    "female_birth_date" date,
    "male_hobby" text,
    "female_hobby" text,
    "male_city" text,
    "female_city" text,
    "relationship_start_date" date not null,
    "relationship_stage" text not null default 'dating'::text,
    "married_at" date,
    "anniversary_note" text,
    "notes" text,
    "show_age" boolean not null default true,
    "show_zodiac" boolean not null default true,
    "archived_at" timestamp with time zone,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "slug" text not null,
    "theme_code" text not null default 'aether'::text
      );


alter table "public"."couples" enable row level security;


  create table "public"."gallery_items" (
    "id" uuid not null default gen_random_uuid(),
    "couple_id" uuid not null,
    "image_path" text not null,
    "display_order" integer not null,
    "is_primary" boolean not null default false,
    "allow_flip" boolean not null default true,
    "journal_title" text,
    "journal_text" text,
    "memory_type" text,
    "taken_at" date,
    "is_visible" boolean not null default true,
    "is_locked" boolean not null default false,
    "is_favorite" boolean not null default false,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."gallery_items" enable row level security;


  create table "public"."journal_default_music" (
    "id" uuid not null default gen_random_uuid(),
    "code" text not null,
    "title" text not null,
    "description" text,
    "file_url" text not null,
    "duration_seconds" integer not null,
    "is_premium_only" boolean not null default false,
    "is_active" boolean not null default true,
    "sort_order" integer not null default 0,
    "created_at" timestamp with time zone not null default now(),
    "file_hash" text
      );


alter table "public"."journal_default_music" enable row level security;


  create table "public"."journal_music" (
    "id" uuid not null default gen_random_uuid(),
    "couple_id" uuid not null,
    "file_path" text not null,
    "file_url" text not null,
    "duration_seconds" integer not null,
    "created_at" timestamp with time zone not null default now(),
    "file_hash" text,
    "title" text not null default 'Untitled Music'::text
      );


alter table "public"."journal_music" enable row level security;


  create table "public"."journal_playlists" (
    "id" uuid not null default gen_random_uuid(),
    "couple_id" uuid not null,
    "source_type" text not null,
    "source_id" uuid not null,
    "order_index" integer not null default 0,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."journal_playlists" enable row level security;


  create table "public"."payment_intents" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "plan_id" uuid not null,
    "promotion_id" uuid,
    "coupon_code" text,
    "base_price_idr" integer not null,
    "discount_percent_applied" integer not null default 0,
    "final_price_idr" integer not null,
    "midtrans_order_id" text,
    "midtrans_token" text,
    "midtrans_redirect_url" text,
    "created_at" timestamp with time zone not null default now(),
    "status" public.payment_intent_status not null default 'pending'::public.payment_intent_status,
    "discount_idr" integer,
    "expires_at" timestamp with time zone,
    "processed_at" timestamp with time zone
      );


alter table "public"."payment_intents" enable row level security;


  create table "public"."payment_resync_logs" (
    "id" uuid not null default gen_random_uuid(),
    "intent_id" uuid not null,
    "order_id" text not null,
    "checked_at" timestamp with time zone not null default now(),
    "midtrans_status" text,
    "midtrans_response_code" text,
    "triggered_rpc" boolean not null default false,
    "admin_user_id" uuid,
    "error_message" text,
    "details" jsonb
      );


alter table "public"."payment_resync_logs" enable row level security;


  create table "public"."payments" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "plan_id" uuid not null,
    "promotion_id" uuid,
    "provider" text not null default 'midtrans'::text,
    "provider_order_id" text not null,
    "gross_amount" integer not null,
    "status" public.payment_status not null,
    "created_at" timestamp with time zone not null default now(),
    "paid_at" timestamp with time zone,
    "intent_id" uuid,
    "payment_type" text,
    "payment_channel" text
      );


alter table "public"."payments" enable row level security;


  create table "public"."profiles" (
    "id" uuid not null,
    "email" text,
    "role" text default 'user'::text,
    "full_name" text,
    "created_at" timestamp with time zone not null default now(),
    "phone" text,
    "active_until" timestamp with time zone,
    "trial_started_at" timestamp with time zone,
    "trial_ends_at" timestamp with time zone,
    "current_plan_id" uuid
      );


alter table "public"."profiles" enable row level security;


  create table "public"."promotion_plans" (
    "promotion_id" uuid not null,
    "plan_id" uuid not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."promotion_plans" enable row level security;


  create table "public"."promotion_redemptions" (
    "id" uuid not null default gen_random_uuid(),
    "promotion_id" uuid not null,
    "user_id" uuid not null,
    "plan_id" uuid not null,
    "redeemed_at" timestamp with time zone not null default now(),
    "payment_id" uuid
      );


alter table "public"."promotion_redemptions" enable row level security;


  create table "public"."promotions" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "code" text,
    "discount_percent" integer not null,
    "start_at" timestamp with time zone not null,
    "end_at" timestamp with time zone,
    "is_active" boolean not null default true,
    "new_customer_only" boolean not null default false,
    "max_redemptions" integer,
    "max_redemptions_per_user" integer not null default 1,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "archived_at" timestamp with time zone,
    "description" text
      );


alter table "public"."promotions" enable row level security;


  create table "public"."subscription_plans" (
    "id" uuid not null default gen_random_uuid(),
    "code" text not null,
    "name" text not null,
    "price_idr" integer not null,
    "duration_days" integer not null,
    "is_active" boolean not null default true,
    "sort_order" integer not null default 0,
    "description" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."subscription_plans" enable row level security;


  create table "public"."subscriptions" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "plan_id" uuid not null,
    "status" public.subscription_status not null default 'active'::public.subscription_status,
    "start_at" timestamp with time zone not null default now(),
    "end_at" timestamp with time zone not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."subscriptions" enable row level security;

CREATE UNIQUE INDEX couple_story_phases_pkey ON public.couple_story_phases USING btree (id);

CREATE UNIQUE INDEX couple_story_phases_unique ON public.couple_story_phases USING btree (couple_id, phase_key);

CREATE UNIQUE INDEX couples_pkey ON public.couples USING btree (id);

CREATE INDEX couples_slug_active_idx ON public.couples USING btree (slug) WHERE (archived_at IS NULL);

CREATE UNIQUE INDEX couples_slug_unique ON public.couples USING btree (slug);

CREATE UNIQUE INDEX gallery_items_pkey ON public.gallery_items USING btree (id);

CREATE UNIQUE INDEX gallery_one_primary_per_couple ON public.gallery_items USING btree (couple_id) WHERE (is_primary = true);

CREATE INDEX gallery_order_index ON public.gallery_items USING btree (couple_id, display_order);

CREATE INDEX idx_couple_story_phases_couple ON public.couple_story_phases USING btree (couple_id);

CREATE INDEX idx_couple_story_phases_phase ON public.couple_story_phases USING btree (phase_key);

CREATE INDEX idx_default_music_active ON public.journal_default_music USING btree (is_active, sort_order);

CREATE INDEX idx_journal_music_couple ON public.journal_music USING btree (couple_id);

CREATE INDEX idx_payment_intents_user ON public.payment_intents USING btree (user_id);

CREATE INDEX idx_payment_resync_logs_checked_at ON public.payment_resync_logs USING btree (checked_at DESC);

CREATE INDEX idx_payment_resync_logs_intent_id ON public.payment_resync_logs USING btree (intent_id);

CREATE INDEX idx_payments_created_at ON public.payments USING btree (created_at);

CREATE INDEX idx_payments_provider_order ON public.payments USING btree (provider_order_id);

CREATE INDEX idx_payments_user_created ON public.payments USING btree (user_id, created_at DESC);

CREATE INDEX idx_payments_user_status ON public.payments USING btree (user_id, status);

CREATE INDEX idx_promo_redemptions_promo ON public.promotion_redemptions USING btree (promotion_id);

CREATE INDEX idx_promo_redemptions_promo_user ON public.promotion_redemptions USING btree (promotion_id, user_id);

CREATE UNIQUE INDEX idx_promo_redemptions_unique_payment ON public.promotion_redemptions USING btree (promotion_id, payment_id);

CREATE INDEX idx_promo_redemptions_user ON public.promotion_redemptions USING btree (user_id);

CREATE INDEX idx_promotion_plans_plan ON public.promotion_plans USING btree (plan_id);

CREATE INDEX idx_promotions_active_dates ON public.promotions USING btree (is_active, start_at, end_at);

CREATE INDEX idx_promotions_archived_at ON public.promotions USING btree (archived_at);

CREATE INDEX idx_redemptions_paid ON public.promotion_redemptions USING btree (promotion_id) WHERE (payment_id IS NOT NULL);

CREATE INDEX idx_subscription_plans_active_sort ON public.subscription_plans USING btree (is_active, sort_order);

CREATE INDEX idx_subscriptions_end_at ON public.subscriptions USING btree (end_at);

CREATE INDEX idx_subscriptions_user_status ON public.subscriptions USING btree (user_id, status);

CREATE UNIQUE INDEX journal_default_music_code_key ON public.journal_default_music USING btree (code);

CREATE UNIQUE INDEX journal_default_music_file_hash_key ON public.journal_default_music USING btree (file_hash);

CREATE UNIQUE INDEX journal_default_music_pkey ON public.journal_default_music USING btree (id);

CREATE UNIQUE INDEX journal_music_file_hash_couple_key ON public.journal_music USING btree (couple_id, file_hash);

CREATE UNIQUE INDEX journal_music_pkey ON public.journal_music USING btree (id);

CREATE UNIQUE INDEX journal_playlists_pkey ON public.journal_playlists USING btree (id);

CREATE UNIQUE INDEX only_one_active_subscription ON public.subscriptions USING btree (user_id) WHERE (status = 'active'::public.subscription_status);

CREATE UNIQUE INDEX payment_intents_midtrans_order_id_key ON public.payment_intents USING btree (midtrans_order_id);

CREATE UNIQUE INDEX payment_intents_pkey ON public.payment_intents USING btree (id);

CREATE INDEX payment_intents_user_created_idx ON public.payment_intents USING btree (user_id, created_at DESC);

CREATE UNIQUE INDEX payment_resync_logs_pkey ON public.payment_resync_logs USING btree (id);

CREATE UNIQUE INDEX payments_intent_id_unique ON public.payments USING btree (intent_id) WHERE (intent_id IS NOT NULL);

CREATE UNIQUE INDEX payments_pkey ON public.payments USING btree (id);

CREATE UNIQUE INDEX payments_provider_order_id_key ON public.payments USING btree (provider_order_id);

CREATE INDEX payments_user_created_idx ON public.payments USING btree (user_id, created_at DESC);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

CREATE UNIQUE INDEX promo_redemptions_unique_user_plan ON public.promotion_redemptions USING btree (promotion_id, user_id, plan_id);

CREATE UNIQUE INDEX promotion_plans_pkey ON public.promotion_plans USING btree (promotion_id, plan_id);

CREATE INDEX promotion_plans_promo_idx ON public.promotion_plans USING btree (promotion_id);

CREATE UNIQUE INDEX promotion_redemptions_pkey ON public.promotion_redemptions USING btree (id);

CREATE UNIQUE INDEX promotions_code_key ON public.promotions USING btree (code);

CREATE UNIQUE INDEX promotions_pkey ON public.promotions USING btree (id);

CREATE UNIQUE INDEX subscription_plans_code_key ON public.subscription_plans USING btree (code);

CREATE UNIQUE INDEX subscription_plans_pkey ON public.subscription_plans USING btree (id);

CREATE UNIQUE INDEX subscriptions_pkey ON public.subscriptions USING btree (id);

CREATE INDEX subscriptions_user_endat_idx ON public.subscriptions USING btree (user_id, end_at DESC);

alter table "public"."couple_story_phases" add constraint "couple_story_phases_pkey" PRIMARY KEY using index "couple_story_phases_pkey";

alter table "public"."couples" add constraint "couples_pkey" PRIMARY KEY using index "couples_pkey";

alter table "public"."gallery_items" add constraint "gallery_items_pkey" PRIMARY KEY using index "gallery_items_pkey";

alter table "public"."journal_default_music" add constraint "journal_default_music_pkey" PRIMARY KEY using index "journal_default_music_pkey";

alter table "public"."journal_music" add constraint "journal_music_pkey" PRIMARY KEY using index "journal_music_pkey";

alter table "public"."journal_playlists" add constraint "journal_playlists_pkey" PRIMARY KEY using index "journal_playlists_pkey";

alter table "public"."payment_intents" add constraint "payment_intents_pkey" PRIMARY KEY using index "payment_intents_pkey";

alter table "public"."payment_resync_logs" add constraint "payment_resync_logs_pkey" PRIMARY KEY using index "payment_resync_logs_pkey";

alter table "public"."payments" add constraint "payments_pkey" PRIMARY KEY using index "payments_pkey";

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."promotion_plans" add constraint "promotion_plans_pkey" PRIMARY KEY using index "promotion_plans_pkey";

alter table "public"."promotion_redemptions" add constraint "promotion_redemptions_pkey" PRIMARY KEY using index "promotion_redemptions_pkey";

alter table "public"."promotions" add constraint "promotions_pkey" PRIMARY KEY using index "promotions_pkey";

alter table "public"."subscription_plans" add constraint "subscription_plans_pkey" PRIMARY KEY using index "subscription_plans_pkey";

alter table "public"."subscriptions" add constraint "subscriptions_pkey" PRIMARY KEY using index "subscriptions_pkey";

alter table "public"."couple_story_phases" add constraint "couple_story_phases_couple_fk" FOREIGN KEY (couple_id) REFERENCES public.couples(id) ON DELETE CASCADE not valid;

alter table "public"."couple_story_phases" validate constraint "couple_story_phases_couple_fk";

alter table "public"."couple_story_phases" add constraint "couple_story_phases_phase_key_check" CHECK ((phase_key = ANY (ARRAY['how_we_met'::text, 'getting_closer'::text, 'turning_point'::text, 'growing_together'::text, 'today'::text]))) not valid;

alter table "public"."couple_story_phases" validate constraint "couple_story_phases_phase_key_check";

alter table "public"."couple_story_phases" add constraint "couple_story_phases_unique" UNIQUE using index "couple_story_phases_unique";

alter table "public"."couples" add constraint "couples_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."couples" validate constraint "couples_user_id_fkey";

alter table "public"."couples" add constraint "married_date_only_when_married" CHECK ((((relationship_stage = 'married'::text) AND (married_at IS NOT NULL)) OR ((relationship_stage <> 'married'::text) AND (married_at IS NULL)))) not valid;

alter table "public"."couples" validate constraint "married_date_only_when_married";

alter table "public"."gallery_items" add constraint "gallery_items_couple_id_fkey" FOREIGN KEY (couple_id) REFERENCES public.couples(id) ON DELETE CASCADE not valid;

alter table "public"."gallery_items" validate constraint "gallery_items_couple_id_fkey";

alter table "public"."journal_default_music" add constraint "journal_default_music_code_key" UNIQUE using index "journal_default_music_code_key";

alter table "public"."journal_music" add constraint "journal_music_couple_id_fkey" FOREIGN KEY (couple_id) REFERENCES public.couples(id) ON DELETE CASCADE not valid;

alter table "public"."journal_music" validate constraint "journal_music_couple_id_fkey";

alter table "public"."journal_playlists" add constraint "journal_playlists_couple_id_fkey" FOREIGN KEY (couple_id) REFERENCES public.couples(id) ON DELETE CASCADE not valid;

alter table "public"."journal_playlists" validate constraint "journal_playlists_couple_id_fkey";

alter table "public"."journal_playlists" add constraint "journal_playlists_source_type_check" CHECK ((source_type = ANY (ARRAY['default'::text, 'user'::text]))) not valid;

alter table "public"."journal_playlists" validate constraint "journal_playlists_source_type_check";

alter table "public"."payment_intents" add constraint "payment_intents_midtrans_order_id_key" UNIQUE using index "payment_intents_midtrans_order_id_key";

alter table "public"."payment_intents" add constraint "payment_intents_plan_id_fkey" FOREIGN KEY (plan_id) REFERENCES public.subscription_plans(id) not valid;

alter table "public"."payment_intents" validate constraint "payment_intents_plan_id_fkey";

alter table "public"."payment_intents" add constraint "payment_intents_promotion_id_fkey" FOREIGN KEY (promotion_id) REFERENCES public.promotions(id) not valid;

alter table "public"."payment_intents" validate constraint "payment_intents_promotion_id_fkey";

alter table "public"."payment_intents" add constraint "payment_intents_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."payment_intents" validate constraint "payment_intents_user_id_fkey";

alter table "public"."payment_resync_logs" add constraint "payment_resync_logs_admin_user_id_fkey" FOREIGN KEY (admin_user_id) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."payment_resync_logs" validate constraint "payment_resync_logs_admin_user_id_fkey";

alter table "public"."payment_resync_logs" add constraint "payment_resync_logs_intent_id_fkey" FOREIGN KEY (intent_id) REFERENCES public.payment_intents(id) ON DELETE CASCADE not valid;

alter table "public"."payment_resync_logs" validate constraint "payment_resync_logs_intent_id_fkey";

alter table "public"."payments" add constraint "payments_gross_amount_check" CHECK ((gross_amount >= 0)) not valid;

alter table "public"."payments" validate constraint "payments_gross_amount_check";

alter table "public"."payments" add constraint "payments_intent_id_fkey" FOREIGN KEY (intent_id) REFERENCES public.payment_intents(id) ON DELETE SET NULL not valid;

alter table "public"."payments" validate constraint "payments_intent_id_fkey";

alter table "public"."payments" add constraint "payments_plan_id_fkey" FOREIGN KEY (plan_id) REFERENCES public.subscription_plans(id) not valid;

alter table "public"."payments" validate constraint "payments_plan_id_fkey";

alter table "public"."payments" add constraint "payments_promotion_id_fkey" FOREIGN KEY (promotion_id) REFERENCES public.promotions(id) ON DELETE SET NULL not valid;

alter table "public"."payments" validate constraint "payments_promotion_id_fkey";

alter table "public"."payments" add constraint "payments_provider_order_id_key" UNIQUE using index "payments_provider_order_id_key";

alter table "public"."payments" add constraint "payments_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."payments" validate constraint "payments_user_id_fkey";

alter table "public"."profiles" add constraint "profiles_current_plan_id_fkey" FOREIGN KEY (current_plan_id) REFERENCES public.subscription_plans(id) ON DELETE SET NULL not valid;

alter table "public"."profiles" validate constraint "profiles_current_plan_id_fkey";

alter table "public"."profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."profiles" validate constraint "profiles_id_fkey";

alter table "public"."profiles" add constraint "profiles_role_check" CHECK ((role = ANY (ARRAY['user'::text, 'admin'::text]))) not valid;

alter table "public"."profiles" validate constraint "profiles_role_check";

alter table "public"."promotion_plans" add constraint "promotion_plans_plan_id_fkey" FOREIGN KEY (plan_id) REFERENCES public.subscription_plans(id) ON DELETE CASCADE not valid;

alter table "public"."promotion_plans" validate constraint "promotion_plans_plan_id_fkey";

alter table "public"."promotion_plans" add constraint "promotion_plans_promotion_id_fkey" FOREIGN KEY (promotion_id) REFERENCES public.promotions(id) ON DELETE CASCADE not valid;

alter table "public"."promotion_plans" validate constraint "promotion_plans_promotion_id_fkey";

alter table "public"."promotion_redemptions" add constraint "promotion_redemptions_payment_id_fkey" FOREIGN KEY (payment_id) REFERENCES public.payments(id) ON DELETE CASCADE not valid;

alter table "public"."promotion_redemptions" validate constraint "promotion_redemptions_payment_id_fkey";

alter table "public"."promotion_redemptions" add constraint "promotion_redemptions_plan_id_fkey" FOREIGN KEY (plan_id) REFERENCES public.subscription_plans(id) ON DELETE RESTRICT not valid;

alter table "public"."promotion_redemptions" validate constraint "promotion_redemptions_plan_id_fkey";

alter table "public"."promotion_redemptions" add constraint "promotion_redemptions_promotion_id_fkey" FOREIGN KEY (promotion_id) REFERENCES public.promotions(id) ON DELETE CASCADE not valid;

alter table "public"."promotion_redemptions" validate constraint "promotion_redemptions_promotion_id_fkey";

alter table "public"."promotion_redemptions" add constraint "promotion_redemptions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."promotion_redemptions" validate constraint "promotion_redemptions_user_id_fkey";

alter table "public"."promotions" add constraint "promotions_check" CHECK ((end_at > start_at)) not valid;

alter table "public"."promotions" validate constraint "promotions_check";

alter table "public"."promotions" add constraint "promotions_code_key" UNIQUE using index "promotions_code_key";

alter table "public"."promotions" add constraint "promotions_discount_percent_check" CHECK (((discount_percent >= 1) AND (discount_percent <= 100))) not valid;

alter table "public"."promotions" validate constraint "promotions_discount_percent_check";

alter table "public"."promotions" add constraint "promotions_max_redemptions_check" CHECK (((max_redemptions IS NULL) OR (max_redemptions > 0))) not valid;

alter table "public"."promotions" validate constraint "promotions_max_redemptions_check";

alter table "public"."promotions" add constraint "promotions_max_redemptions_per_user_check" CHECK ((max_redemptions_per_user > 0)) not valid;

alter table "public"."promotions" validate constraint "promotions_max_redemptions_per_user_check";

alter table "public"."subscription_plans" add constraint "subscription_plans_code_key" UNIQUE using index "subscription_plans_code_key";

alter table "public"."subscription_plans" add constraint "subscription_plans_duration_days_check" CHECK ((duration_days > 0)) not valid;

alter table "public"."subscription_plans" validate constraint "subscription_plans_duration_days_check";

alter table "public"."subscription_plans" add constraint "subscription_plans_price_idr_check" CHECK ((price_idr >= 0)) not valid;

alter table "public"."subscription_plans" validate constraint "subscription_plans_price_idr_check";

alter table "public"."subscriptions" add constraint "subscriptions_plan_id_fkey" FOREIGN KEY (plan_id) REFERENCES public.subscription_plans(id) not valid;

alter table "public"."subscriptions" validate constraint "subscriptions_plan_id_fkey";

alter table "public"."subscriptions" add constraint "subscriptions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."subscriptions" validate constraint "subscriptions_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.block_profile_privileged_updates()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  -- Jika bukan service_role, larang ubah kolom privileged
  if auth.role() <> 'service_role' then
    if new.role is distinct from old.role
      or new.plan is distinct from old.plan
      or new.active_until is distinct from old.active_until
      or new.trial_started_at is distinct from old.trial_started_at
      or new.trial_ends_at is distinct from old.trial_ends_at
      or new.subscription_status is distinct from old.subscription_status
    then
      raise exception 'Not allowed to update privileged fields';
    end if;
  end if;

  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  insert into public.profiles (
    id,
    email,
    role,
    full_name,
    phone
  )
  values (
    new.id,
    new.email,
    'user',
    coalesce(new.raw_user_meta_data->>'full_name', null),
    coalesce(new.raw_user_meta_data->>'phone', null)
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = excluded.full_name,
    phone = excluded.phone;

  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_payment_success(p_intent_id uuid, p_provider_order_id text, p_payment_type text, p_payment_channel text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1
    from profiles
    where id = auth.uid()
      and role = 'admin'
  );
$function$
;

CREATE OR REPLACE FUNCTION public.rls_auto_enable()
 RETURNS event_trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.start_trial_if_needed(p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
  now_ts timestamptz := now();
  ends_ts timestamptz := now() + interval '7 days';
begin
  insert into public.profiles (id, plan, subscription_status, trial_started_at, trial_ends_at, active_until)
  values (p_user_id, 'trial', 'active', now_ts, ends_ts, ends_ts)
  on conflict (id) do update
  set
    plan = case when public.profiles.trial_started_at is null then 'trial' else public.profiles.plan end,
    subscription_status = case when public.profiles.trial_started_at is null then 'active' else public.profiles.subscription_status end,
    trial_started_at = coalesce(public.profiles.trial_started_at, now_ts),
    trial_ends_at = coalesce(public.profiles.trial_ends_at, ends_ts),
    active_until = case
      when public.profiles.trial_started_at is null
           and (public.profiles.active_until is null or public.profiles.active_until < now_ts)
      then ends_ts
      else public.profiles.active_until
    end;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.sync_profile_entitlement_from_subscription()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
  v_plan text;
  v_status text;
  v_active_until timestamptz;
begin
  -- tentukan plan & status untuk profiles
  if new.status = 'active' and new.current_period_end is not null then
    v_plan := new.plan_code;              -- contoh: 'monthly'/'yearly'/'pro'
    v_status := 'active';
    v_active_until := new.current_period_end;
  else
    -- kalau tidak active, jangan paksa hapus akses yang mungkin berasal dari trial
    -- kita cuma update status subscription, tapi active_until biarkan kalau lebih besar dari sekarang
    v_plan := coalesce((select plan from public.profiles where id = new.user_id), new.plan_code);
    v_status := coalesce(new.status, 'inactive');
    v_active_until := (select active_until from public.profiles where id = new.user_id);
  end if;

  update public.profiles
  set
    plan = coalesce(v_plan, plan),
    subscription_status = v_status,
    active_until = coalesce(v_active_until, active_until)
  where id = new.user_id;

  return new;
end;
$function$
;

grant delete on table "public"."couple_story_phases" to "anon";

grant insert on table "public"."couple_story_phases" to "anon";

grant references on table "public"."couple_story_phases" to "anon";

grant select on table "public"."couple_story_phases" to "anon";

grant trigger on table "public"."couple_story_phases" to "anon";

grant truncate on table "public"."couple_story_phases" to "anon";

grant update on table "public"."couple_story_phases" to "anon";

grant delete on table "public"."couple_story_phases" to "authenticated";

grant insert on table "public"."couple_story_phases" to "authenticated";

grant references on table "public"."couple_story_phases" to "authenticated";

grant select on table "public"."couple_story_phases" to "authenticated";

grant trigger on table "public"."couple_story_phases" to "authenticated";

grant truncate on table "public"."couple_story_phases" to "authenticated";

grant update on table "public"."couple_story_phases" to "authenticated";

grant delete on table "public"."couple_story_phases" to "service_role";

grant insert on table "public"."couple_story_phases" to "service_role";

grant references on table "public"."couple_story_phases" to "service_role";

grant select on table "public"."couple_story_phases" to "service_role";

grant trigger on table "public"."couple_story_phases" to "service_role";

grant truncate on table "public"."couple_story_phases" to "service_role";

grant update on table "public"."couple_story_phases" to "service_role";

grant delete on table "public"."couples" to "anon";

grant insert on table "public"."couples" to "anon";

grant references on table "public"."couples" to "anon";

grant select on table "public"."couples" to "anon";

grant trigger on table "public"."couples" to "anon";

grant truncate on table "public"."couples" to "anon";

grant update on table "public"."couples" to "anon";

grant delete on table "public"."couples" to "authenticated";

grant insert on table "public"."couples" to "authenticated";

grant references on table "public"."couples" to "authenticated";

grant select on table "public"."couples" to "authenticated";

grant trigger on table "public"."couples" to "authenticated";

grant truncate on table "public"."couples" to "authenticated";

grant update on table "public"."couples" to "authenticated";

grant delete on table "public"."couples" to "service_role";

grant insert on table "public"."couples" to "service_role";

grant references on table "public"."couples" to "service_role";

grant select on table "public"."couples" to "service_role";

grant trigger on table "public"."couples" to "service_role";

grant truncate on table "public"."couples" to "service_role";

grant update on table "public"."couples" to "service_role";

grant delete on table "public"."gallery_items" to "anon";

grant insert on table "public"."gallery_items" to "anon";

grant references on table "public"."gallery_items" to "anon";

grant select on table "public"."gallery_items" to "anon";

grant trigger on table "public"."gallery_items" to "anon";

grant truncate on table "public"."gallery_items" to "anon";

grant update on table "public"."gallery_items" to "anon";

grant delete on table "public"."gallery_items" to "authenticated";

grant insert on table "public"."gallery_items" to "authenticated";

grant references on table "public"."gallery_items" to "authenticated";

grant select on table "public"."gallery_items" to "authenticated";

grant trigger on table "public"."gallery_items" to "authenticated";

grant truncate on table "public"."gallery_items" to "authenticated";

grant update on table "public"."gallery_items" to "authenticated";

grant delete on table "public"."gallery_items" to "service_role";

grant insert on table "public"."gallery_items" to "service_role";

grant references on table "public"."gallery_items" to "service_role";

grant select on table "public"."gallery_items" to "service_role";

grant trigger on table "public"."gallery_items" to "service_role";

grant truncate on table "public"."gallery_items" to "service_role";

grant update on table "public"."gallery_items" to "service_role";

grant select on table "public"."journal_default_music" to "public";

grant delete on table "public"."journal_default_music" to "anon";

grant insert on table "public"."journal_default_music" to "anon";

grant references on table "public"."journal_default_music" to "anon";

grant select on table "public"."journal_default_music" to "anon";

grant trigger on table "public"."journal_default_music" to "anon";

grant truncate on table "public"."journal_default_music" to "anon";

grant update on table "public"."journal_default_music" to "anon";

grant delete on table "public"."journal_default_music" to "authenticated";

grant insert on table "public"."journal_default_music" to "authenticated";

grant references on table "public"."journal_default_music" to "authenticated";

grant select on table "public"."journal_default_music" to "authenticated";

grant trigger on table "public"."journal_default_music" to "authenticated";

grant truncate on table "public"."journal_default_music" to "authenticated";

grant update on table "public"."journal_default_music" to "authenticated";

grant delete on table "public"."journal_default_music" to "service_role";

grant insert on table "public"."journal_default_music" to "service_role";

grant references on table "public"."journal_default_music" to "service_role";

grant select on table "public"."journal_default_music" to "service_role";

grant trigger on table "public"."journal_default_music" to "service_role";

grant truncate on table "public"."journal_default_music" to "service_role";

grant update on table "public"."journal_default_music" to "service_role";

grant delete on table "public"."journal_music" to "anon";

grant insert on table "public"."journal_music" to "anon";

grant references on table "public"."journal_music" to "anon";

grant select on table "public"."journal_music" to "anon";

grant trigger on table "public"."journal_music" to "anon";

grant truncate on table "public"."journal_music" to "anon";

grant update on table "public"."journal_music" to "anon";

grant delete on table "public"."journal_music" to "authenticated";

grant insert on table "public"."journal_music" to "authenticated";

grant references on table "public"."journal_music" to "authenticated";

grant select on table "public"."journal_music" to "authenticated";

grant trigger on table "public"."journal_music" to "authenticated";

grant truncate on table "public"."journal_music" to "authenticated";

grant update on table "public"."journal_music" to "authenticated";

grant delete on table "public"."journal_music" to "service_role";

grant insert on table "public"."journal_music" to "service_role";

grant references on table "public"."journal_music" to "service_role";

grant select on table "public"."journal_music" to "service_role";

grant trigger on table "public"."journal_music" to "service_role";

grant truncate on table "public"."journal_music" to "service_role";

grant update on table "public"."journal_music" to "service_role";

grant delete on table "public"."journal_playlists" to "anon";

grant insert on table "public"."journal_playlists" to "anon";

grant references on table "public"."journal_playlists" to "anon";

grant select on table "public"."journal_playlists" to "anon";

grant trigger on table "public"."journal_playlists" to "anon";

grant truncate on table "public"."journal_playlists" to "anon";

grant update on table "public"."journal_playlists" to "anon";

grant delete on table "public"."journal_playlists" to "authenticated";

grant insert on table "public"."journal_playlists" to "authenticated";

grant references on table "public"."journal_playlists" to "authenticated";

grant select on table "public"."journal_playlists" to "authenticated";

grant trigger on table "public"."journal_playlists" to "authenticated";

grant truncate on table "public"."journal_playlists" to "authenticated";

grant update on table "public"."journal_playlists" to "authenticated";

grant delete on table "public"."journal_playlists" to "service_role";

grant insert on table "public"."journal_playlists" to "service_role";

grant references on table "public"."journal_playlists" to "service_role";

grant select on table "public"."journal_playlists" to "service_role";

grant trigger on table "public"."journal_playlists" to "service_role";

grant truncate on table "public"."journal_playlists" to "service_role";

grant update on table "public"."journal_playlists" to "service_role";

grant delete on table "public"."payment_intents" to "anon";

grant insert on table "public"."payment_intents" to "anon";

grant references on table "public"."payment_intents" to "anon";

grant select on table "public"."payment_intents" to "anon";

grant trigger on table "public"."payment_intents" to "anon";

grant truncate on table "public"."payment_intents" to "anon";

grant update on table "public"."payment_intents" to "anon";

grant delete on table "public"."payment_intents" to "authenticated";

grant insert on table "public"."payment_intents" to "authenticated";

grant references on table "public"."payment_intents" to "authenticated";

grant select on table "public"."payment_intents" to "authenticated";

grant trigger on table "public"."payment_intents" to "authenticated";

grant truncate on table "public"."payment_intents" to "authenticated";

grant update on table "public"."payment_intents" to "authenticated";

grant delete on table "public"."payment_intents" to "service_role";

grant insert on table "public"."payment_intents" to "service_role";

grant references on table "public"."payment_intents" to "service_role";

grant select on table "public"."payment_intents" to "service_role";

grant trigger on table "public"."payment_intents" to "service_role";

grant truncate on table "public"."payment_intents" to "service_role";

grant update on table "public"."payment_intents" to "service_role";

grant delete on table "public"."payment_resync_logs" to "anon";

grant insert on table "public"."payment_resync_logs" to "anon";

grant references on table "public"."payment_resync_logs" to "anon";

grant select on table "public"."payment_resync_logs" to "anon";

grant trigger on table "public"."payment_resync_logs" to "anon";

grant truncate on table "public"."payment_resync_logs" to "anon";

grant update on table "public"."payment_resync_logs" to "anon";

grant delete on table "public"."payment_resync_logs" to "authenticated";

grant insert on table "public"."payment_resync_logs" to "authenticated";

grant references on table "public"."payment_resync_logs" to "authenticated";

grant select on table "public"."payment_resync_logs" to "authenticated";

grant trigger on table "public"."payment_resync_logs" to "authenticated";

grant truncate on table "public"."payment_resync_logs" to "authenticated";

grant update on table "public"."payment_resync_logs" to "authenticated";

grant delete on table "public"."payment_resync_logs" to "service_role";

grant insert on table "public"."payment_resync_logs" to "service_role";

grant references on table "public"."payment_resync_logs" to "service_role";

grant select on table "public"."payment_resync_logs" to "service_role";

grant trigger on table "public"."payment_resync_logs" to "service_role";

grant truncate on table "public"."payment_resync_logs" to "service_role";

grant update on table "public"."payment_resync_logs" to "service_role";

grant delete on table "public"."payments" to "anon";

grant insert on table "public"."payments" to "anon";

grant references on table "public"."payments" to "anon";

grant select on table "public"."payments" to "anon";

grant trigger on table "public"."payments" to "anon";

grant truncate on table "public"."payments" to "anon";

grant update on table "public"."payments" to "anon";

grant delete on table "public"."payments" to "authenticated";

grant insert on table "public"."payments" to "authenticated";

grant references on table "public"."payments" to "authenticated";

grant select on table "public"."payments" to "authenticated";

grant trigger on table "public"."payments" to "authenticated";

grant truncate on table "public"."payments" to "authenticated";

grant update on table "public"."payments" to "authenticated";

grant delete on table "public"."payments" to "service_role";

grant insert on table "public"."payments" to "service_role";

grant references on table "public"."payments" to "service_role";

grant select on table "public"."payments" to "service_role";

grant trigger on table "public"."payments" to "service_role";

grant truncate on table "public"."payments" to "service_role";

grant update on table "public"."payments" to "service_role";

grant delete on table "public"."profiles" to "anon";

grant insert on table "public"."profiles" to "anon";

grant references on table "public"."profiles" to "anon";

grant select on table "public"."profiles" to "anon";

grant trigger on table "public"."profiles" to "anon";

grant truncate on table "public"."profiles" to "anon";

grant update on table "public"."profiles" to "anon";

grant delete on table "public"."profiles" to "authenticated";

grant insert on table "public"."profiles" to "authenticated";

grant references on table "public"."profiles" to "authenticated";

grant select on table "public"."profiles" to "authenticated";

grant trigger on table "public"."profiles" to "authenticated";

grant truncate on table "public"."profiles" to "authenticated";

grant update on table "public"."profiles" to "authenticated";

grant delete on table "public"."profiles" to "service_role";

grant insert on table "public"."profiles" to "service_role";

grant references on table "public"."profiles" to "service_role";

grant select on table "public"."profiles" to "service_role";

grant trigger on table "public"."profiles" to "service_role";

grant truncate on table "public"."profiles" to "service_role";

grant update on table "public"."profiles" to "service_role";

grant delete on table "public"."promotion_plans" to "anon";

grant insert on table "public"."promotion_plans" to "anon";

grant references on table "public"."promotion_plans" to "anon";

grant select on table "public"."promotion_plans" to "anon";

grant trigger on table "public"."promotion_plans" to "anon";

grant truncate on table "public"."promotion_plans" to "anon";

grant update on table "public"."promotion_plans" to "anon";

grant delete on table "public"."promotion_plans" to "authenticated";

grant insert on table "public"."promotion_plans" to "authenticated";

grant references on table "public"."promotion_plans" to "authenticated";

grant select on table "public"."promotion_plans" to "authenticated";

grant trigger on table "public"."promotion_plans" to "authenticated";

grant truncate on table "public"."promotion_plans" to "authenticated";

grant update on table "public"."promotion_plans" to "authenticated";

grant delete on table "public"."promotion_plans" to "service_role";

grant insert on table "public"."promotion_plans" to "service_role";

grant references on table "public"."promotion_plans" to "service_role";

grant select on table "public"."promotion_plans" to "service_role";

grant trigger on table "public"."promotion_plans" to "service_role";

grant truncate on table "public"."promotion_plans" to "service_role";

grant update on table "public"."promotion_plans" to "service_role";

grant delete on table "public"."promotion_redemptions" to "anon";

grant insert on table "public"."promotion_redemptions" to "anon";

grant references on table "public"."promotion_redemptions" to "anon";

grant select on table "public"."promotion_redemptions" to "anon";

grant trigger on table "public"."promotion_redemptions" to "anon";

grant truncate on table "public"."promotion_redemptions" to "anon";

grant update on table "public"."promotion_redemptions" to "anon";

grant delete on table "public"."promotion_redemptions" to "authenticated";

grant insert on table "public"."promotion_redemptions" to "authenticated";

grant references on table "public"."promotion_redemptions" to "authenticated";

grant select on table "public"."promotion_redemptions" to "authenticated";

grant trigger on table "public"."promotion_redemptions" to "authenticated";

grant truncate on table "public"."promotion_redemptions" to "authenticated";

grant update on table "public"."promotion_redemptions" to "authenticated";

grant delete on table "public"."promotion_redemptions" to "service_role";

grant insert on table "public"."promotion_redemptions" to "service_role";

grant references on table "public"."promotion_redemptions" to "service_role";

grant select on table "public"."promotion_redemptions" to "service_role";

grant trigger on table "public"."promotion_redemptions" to "service_role";

grant truncate on table "public"."promotion_redemptions" to "service_role";

grant update on table "public"."promotion_redemptions" to "service_role";

grant delete on table "public"."promotions" to "anon";

grant insert on table "public"."promotions" to "anon";

grant references on table "public"."promotions" to "anon";

grant select on table "public"."promotions" to "anon";

grant trigger on table "public"."promotions" to "anon";

grant truncate on table "public"."promotions" to "anon";

grant update on table "public"."promotions" to "anon";

grant delete on table "public"."promotions" to "authenticated";

grant insert on table "public"."promotions" to "authenticated";

grant references on table "public"."promotions" to "authenticated";

grant select on table "public"."promotions" to "authenticated";

grant trigger on table "public"."promotions" to "authenticated";

grant truncate on table "public"."promotions" to "authenticated";

grant update on table "public"."promotions" to "authenticated";

grant delete on table "public"."promotions" to "service_role";

grant insert on table "public"."promotions" to "service_role";

grant references on table "public"."promotions" to "service_role";

grant select on table "public"."promotions" to "service_role";

grant trigger on table "public"."promotions" to "service_role";

grant truncate on table "public"."promotions" to "service_role";

grant update on table "public"."promotions" to "service_role";

grant delete on table "public"."subscription_plans" to "anon";

grant insert on table "public"."subscription_plans" to "anon";

grant references on table "public"."subscription_plans" to "anon";

grant select on table "public"."subscription_plans" to "anon";

grant trigger on table "public"."subscription_plans" to "anon";

grant truncate on table "public"."subscription_plans" to "anon";

grant update on table "public"."subscription_plans" to "anon";

grant delete on table "public"."subscription_plans" to "authenticated";

grant insert on table "public"."subscription_plans" to "authenticated";

grant references on table "public"."subscription_plans" to "authenticated";

grant select on table "public"."subscription_plans" to "authenticated";

grant trigger on table "public"."subscription_plans" to "authenticated";

grant truncate on table "public"."subscription_plans" to "authenticated";

grant update on table "public"."subscription_plans" to "authenticated";

grant delete on table "public"."subscription_plans" to "service_role";

grant insert on table "public"."subscription_plans" to "service_role";

grant references on table "public"."subscription_plans" to "service_role";

grant select on table "public"."subscription_plans" to "service_role";

grant trigger on table "public"."subscription_plans" to "service_role";

grant truncate on table "public"."subscription_plans" to "service_role";

grant update on table "public"."subscription_plans" to "service_role";

grant delete on table "public"."subscriptions" to "anon";

grant insert on table "public"."subscriptions" to "anon";

grant references on table "public"."subscriptions" to "anon";

grant select on table "public"."subscriptions" to "anon";

grant trigger on table "public"."subscriptions" to "anon";

grant truncate on table "public"."subscriptions" to "anon";

grant update on table "public"."subscriptions" to "anon";

grant delete on table "public"."subscriptions" to "authenticated";

grant insert on table "public"."subscriptions" to "authenticated";

grant references on table "public"."subscriptions" to "authenticated";

grant select on table "public"."subscriptions" to "authenticated";

grant trigger on table "public"."subscriptions" to "authenticated";

grant truncate on table "public"."subscriptions" to "authenticated";

grant update on table "public"."subscriptions" to "authenticated";

grant delete on table "public"."subscriptions" to "service_role";

grant insert on table "public"."subscriptions" to "service_role";

grant references on table "public"."subscriptions" to "service_role";

grant select on table "public"."subscriptions" to "service_role";

grant trigger on table "public"."subscriptions" to "service_role";

grant truncate on table "public"."subscriptions" to "service_role";

grant update on table "public"."subscriptions" to "service_role";


  create policy "delete_own_story_phases"
  on "public"."couple_story_phases"
  as permissive
  for delete
  to public
using ((couple_id IN ( SELECT couples.id
   FROM public.couples
  WHERE ((couples.user_id = auth.uid()) AND (couples.archived_at IS NULL)))));



  create policy "insert_own_story_phases"
  on "public"."couple_story_phases"
  as permissive
  for insert
  to public
with check ((couple_id IN ( SELECT couples.id
   FROM public.couples
  WHERE ((couples.user_id = auth.uid()) AND (couples.archived_at IS NULL)))));



  create policy "public read visible couple_story_phases"
  on "public"."couple_story_phases"
  as permissive
  for select
  to public
using ((is_visible = true));



  create policy "select_own_story_phases"
  on "public"."couple_story_phases"
  as permissive
  for select
  to public
using ((couple_id IN ( SELECT couples.id
   FROM public.couples
  WHERE ((couples.user_id = auth.uid()) AND (couples.archived_at IS NULL)))));



  create policy "update_own_story_phases"
  on "public"."couple_story_phases"
  as permissive
  for update
  to public
using ((couple_id IN ( SELECT couples.id
   FROM public.couples
  WHERE ((couples.user_id = auth.uid()) AND (couples.archived_at IS NULL)))))
with check ((couple_id IN ( SELECT couples.id
   FROM public.couples
  WHERE ((couples.user_id = auth.uid()) AND (couples.archived_at IS NULL)))));



  create policy "Admin full access"
  on "public"."couples"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));



  create policy "User can create own couple"
  on "public"."couples"
  as permissive
  for insert
  to public
with check ((user_id = auth.uid()));



  create policy "User can delete own couple"
  on "public"."couples"
  as permissive
  for delete
  to public
using ((user_id = auth.uid()));



  create policy "User can read own couple"
  on "public"."couples"
  as permissive
  for select
  to public
using ((user_id = auth.uid()));



  create policy "User can update own couple"
  on "public"."couples"
  as permissive
  for update
  to public
using ((user_id = auth.uid()))
with check ((user_id = auth.uid()));



  create policy "couples_public_read"
  on "public"."couples"
  as permissive
  for select
  to public
using (((archived_at IS NULL) AND (slug IS NOT NULL)));



  create policy "Users can delete their gallery items"
  on "public"."gallery_items"
  as permissive
  for delete
  to public
using ((EXISTS ( SELECT 1
   FROM public.couples
  WHERE ((couples.id = gallery_items.couple_id) AND (couples.user_id = auth.uid())))));



  create policy "Users can insert gallery items for their couple"
  on "public"."gallery_items"
  as permissive
  for insert
  to public
with check ((EXISTS ( SELECT 1
   FROM public.couples
  WHERE ((couples.id = gallery_items.couple_id) AND (couples.user_id = auth.uid())))));



  create policy "Users can update their gallery items"
  on "public"."gallery_items"
  as permissive
  for update
  to public
using ((EXISTS ( SELECT 1
   FROM public.couples
  WHERE ((couples.id = gallery_items.couple_id) AND (couples.user_id = auth.uid())))));



  create policy "Users can view their gallery items"
  on "public"."gallery_items"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.couples
  WHERE ((couples.id = gallery_items.couple_id) AND (couples.user_id = auth.uid())))));



  create policy "public read visible gallery_items"
  on "public"."gallery_items"
  as permissive
  for select
  to public
using (((is_visible = true) AND (is_locked = false)));



  create policy "authenticated manage default music"
  on "public"."journal_default_music"
  as permissive
  for all
  to authenticated
using (true)
with check (true);



  create policy "authenticated read all default music"
  on "public"."journal_default_music"
  as permissive
  for select
  to authenticated
using (true);



  create policy "public read active default music"
  on "public"."journal_default_music"
  as permissive
  for select
  to public
using ((is_active = true));



  create policy "public read journal music"
  on "public"."journal_music"
  as permissive
  for select
  to public
using (true);



  create policy "user can delete own couple music"
  on "public"."journal_music"
  as permissive
  for delete
  to public
using ((EXISTS ( SELECT 1
   FROM public.couples c
  WHERE ((c.id = journal_music.couple_id) AND (c.user_id = auth.uid())))));



  create policy "user can insert own couple music"
  on "public"."journal_music"
  as permissive
  for insert
  to public
with check ((EXISTS ( SELECT 1
   FROM public.couples c
  WHERE ((c.id = journal_music.couple_id) AND (c.user_id = auth.uid())))));



  create policy "user can read own couple music"
  on "public"."journal_music"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.couples c
  WHERE ((c.id = journal_music.couple_id) AND (c.user_id = auth.uid())))));



  create policy "user can update own couple music"
  on "public"."journal_music"
  as permissive
  for update
  to public
using ((EXISTS ( SELECT 1
   FROM public.couples c
  WHERE ((c.id = journal_music.couple_id) AND (c.user_id = auth.uid())))));



  create policy "public read journal playlists"
  on "public"."journal_playlists"
  as permissive
  for select
  to public
using (true);



  create policy "public read journal_playlists"
  on "public"."journal_playlists"
  as permissive
  for select
  to public
using (true);



  create policy "user playlist access"
  on "public"."journal_playlists"
  as permissive
  for all
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.couples
  WHERE ((couples.id = journal_playlists.couple_id) AND (couples.user_id = auth.uid())))));



  create policy "insert own intents"
  on "public"."payment_intents"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "read own intents"
  on "public"."payment_intents"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "update own intents"
  on "public"."payment_intents"
  as permissive
  for update
  to public
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));



  create policy "admin only"
  on "public"."payment_resync_logs"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));



  create policy "payments_select_admin"
  on "public"."payments"
  as permissive
  for select
  to authenticated
using (public.is_admin());



  create policy "payments_select_own"
  on "public"."payments"
  as permissive
  for select
  to authenticated
using ((user_id = auth.uid()));



  create policy "Admin can view all profiles"
  on "public"."profiles"
  as permissive
  for select
  to authenticated
using ((((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = 'admin'::text));



  create policy "Profiles are updatable by owner"
  on "public"."profiles"
  as permissive
  for update
  to authenticated
using ((auth.uid() = id))
with check ((auth.uid() = id));



  create policy "profiles_insert_own"
  on "public"."profiles"
  as permissive
  for insert
  to authenticated
with check ((auth.uid() = id));



  create policy "profiles_select_own"
  on "public"."profiles"
  as permissive
  for select
  to authenticated
using ((id = auth.uid()));



  create policy "profiles_update_own"
  on "public"."profiles"
  as permissive
  for update
  to authenticated
using ((id = auth.uid()))
with check ((id = auth.uid()));



  create policy "promotion_plans_delete_admin"
  on "public"."promotion_plans"
  as permissive
  for delete
  to authenticated
using (public.is_admin());



  create policy "promotion_plans_insert_admin"
  on "public"."promotion_plans"
  as permissive
  for insert
  to authenticated
with check (public.is_admin());



  create policy "promotion_plans_select_all"
  on "public"."promotion_plans"
  as permissive
  for select
  to public
using (true);



  create policy "promotion_plans_update_admin"
  on "public"."promotion_plans"
  as permissive
  for update
  to authenticated
using (public.is_admin())
with check (public.is_admin());



  create policy "promo_redemptions_select_admin"
  on "public"."promotion_redemptions"
  as permissive
  for select
  to authenticated
using (public.is_admin());



  create policy "promo_redemptions_write_admin"
  on "public"."promotion_redemptions"
  as permissive
  for all
  to authenticated
using (public.is_admin())
with check (public.is_admin());



  create policy "promotions_delete_admin"
  on "public"."promotions"
  as permissive
  for delete
  to authenticated
using (public.is_admin());



  create policy "promotions_insert_admin"
  on "public"."promotions"
  as permissive
  for insert
  to authenticated
with check (public.is_admin());



  create policy "promotions_select_all"
  on "public"."promotions"
  as permissive
  for select
  to public
using (true);



  create policy "promotions_update_admin"
  on "public"."promotions"
  as permissive
  for update
  to authenticated
using (public.is_admin())
with check (public.is_admin());



  create policy "plans_delete_admin"
  on "public"."subscription_plans"
  as permissive
  for delete
  to authenticated
using (public.is_admin());



  create policy "plans_insert_admin"
  on "public"."subscription_plans"
  as permissive
  for insert
  to authenticated
with check (public.is_admin());



  create policy "plans_select_all"
  on "public"."subscription_plans"
  as permissive
  for select
  to public
using (true);



  create policy "plans_update_admin"
  on "public"."subscription_plans"
  as permissive
  for update
  to authenticated
using (public.is_admin())
with check (public.is_admin());



  create policy "subscriptions_select_own_or_admin"
  on "public"."subscriptions"
  as permissive
  for select
  to authenticated
using (((user_id = auth.uid()) OR public.is_admin()));



  create policy "subscriptions_write_admin_only"
  on "public"."subscriptions"
  as permissive
  for all
  to authenticated
using (public.is_admin())
with check (public.is_admin());


CREATE TRIGGER trigger_couple_story_phases_updated BEFORE UPDATE ON public.couple_story_phases FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_block_profile_privileged_updates BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.block_profile_privileged_updates();

CREATE TRIGGER trg_promotions_updated_at BEFORE UPDATE ON public.promotions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_subscription_plans_updated_at BEFORE UPDATE ON public.subscription_plans FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();


