-- tambah tanggal tunangan / lamaran
alter table public.couples
add column if not exists engaged_at date null;

-- tambah tanggal resepsi
alter table public.couples
add column if not exists reception_at date null;

-- hapus constraint lama (jika ada)
alter table public.couples
drop constraint if exists married_date_only_when_married;

-- constraint baru yang lebih fleksibel
alter table public.couples
add constraint relationship_stage_dates_check
check (
(
relationship_stage = 'dating'
and engaged_at is null
and married_at is null
and reception_at is null
)
or
(
relationship_stage = 'engaged'
and engaged_at is not null
and married_at is null
)
or
(
relationship_stage = 'married'
and married_at is not null
)
);
