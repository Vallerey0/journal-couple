-- 1. Buat tabel jika belum ada
CREATE TABLE IF NOT EXISTS couple_story_phases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  couple_id UUID REFERENCES couples(id) ON DELETE CASCADE NOT NULL,
  phase_key TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  occurred_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(couple_id, phase_key)
);

-- 2. Tambahkan kolom 'content' jika belum ada (penyebab error Anda)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'couple_story_phases' AND column_name = 'content') THEN
        ALTER TABLE couple_story_phases ADD COLUMN content TEXT;
    END IF;
END $$;

-- 3. Pastikan RLS (Row Level Security) aktif agar aman
ALTER TABLE couple_story_phases ENABLE ROW LEVEL SECURITY;

-- 4. Tambahkan Policy agar user bisa INSERT/UPDATE data mereka sendiri
-- Hapus policy lama jika ada untuk menghindari duplikat error
DROP POLICY IF EXISTS "Users can view their own couple story" ON couple_story_phases;
DROP POLICY IF EXISTS "Users can insert their own couple story" ON couple_story_phases;
DROP POLICY IF EXISTS "Users can update their own couple story" ON couple_story_phases;

CREATE POLICY "Users can view their own couple story"
ON couple_story_phases FOR SELECT
USING (
  couple_id IN (
    SELECT id FROM couples WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own couple story"
ON couple_story_phases FOR INSERT
WITH CHECK (
  couple_id IN (
    SELECT id FROM couples WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own couple story"
ON couple_story_phases FOR UPDATE
USING (
  couple_id IN (
    SELECT id FROM couples WHERE user_id = auth.uid()
  )
);
