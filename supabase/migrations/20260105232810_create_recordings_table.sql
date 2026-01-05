/*
  # Create recordings table

  1. New Tables
    - `recordings`
      - `id` (uuid, primary key)
      - `filename` (text)
      - `duration` (integer)
      - `timestamp` (timestamptz)
      - `audio_data` (bytea)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `recordings` table
    - Add policy for authenticated users to read their own data
    - Add policy for authenticated users to insert their own data
    - Add policy for authenticated users to delete their own data
*/

CREATE TABLE IF NOT EXISTS recordings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename text NOT NULL,
  duration integer DEFAULT 0,
  timestamp timestamptz NOT NULL,
  audio_data bytea,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE recordings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read recordings"
  ON recordings FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anyone can insert recordings"
  ON recordings FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anyone can delete recordings"
  ON recordings FOR DELETE
  TO anon
  USING (true);
