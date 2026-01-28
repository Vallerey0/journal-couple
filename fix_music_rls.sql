-- 1. Create table if not exists
CREATE TABLE IF NOT EXISTS journal_music (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  couple_id UUID REFERENCES couples(id) ON DELETE CASCADE NOT NULL,
  file_path TEXT NOT NULL,
  file_url TEXT NOT NULL,
  duration_seconds INTEGER DEFAULT 0,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT FALSE,
  file_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE journal_music ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
-- Helper to check if user owns the couple
-- (Assumes couples table has user_id or partner_id linking to auth.uid())
-- Based on existing code: couples has user_id

DROP POLICY IF EXISTS "Users can view their own couple music" ON journal_music;
DROP POLICY IF EXISTS "Users can insert their own couple music" ON journal_music;
DROP POLICY IF EXISTS "Users can update their own couple music" ON journal_music;
DROP POLICY IF EXISTS "Users can delete their own couple music" ON journal_music;

CREATE POLICY "Users can view their own couple music"
ON journal_music FOR SELECT
USING (
  couple_id IN (
    SELECT id FROM couples WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own couple music"
ON journal_music FOR INSERT
WITH CHECK (
  couple_id IN (
    SELECT id FROM couples WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own couple music"
ON journal_music FOR UPDATE
USING (
  couple_id IN (
    SELECT id FROM couples WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own couple music"
ON journal_music FOR DELETE
USING (
  couple_id IN (
    SELECT id FROM couples WHERE user_id = auth.uid()
  )
);
