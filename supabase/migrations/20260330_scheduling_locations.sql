-- Migration: Scheduling & Work Locations
-- Adds multi-location support and leverages existing exceptions table for vacations

-- 1. Create educator_work_locations table
CREATE TABLE IF NOT EXISTS educator_work_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  educator_id UUID REFERENCES educator_profiles(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(100) NOT NULL,
  location_type VARCHAR(20) NOT NULL CHECK (location_type IN ('office', 'home', 'institution', 'online', 'other')),
  address TEXT,
  color VARCHAR(7) NOT NULL DEFAULT '#027e7e',
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_work_locations_educator ON educator_work_locations(educator_id);

-- RLS policies
ALTER TABLE educator_work_locations ENABLE ROW LEVEL SECURITY;

-- Public read for active locations (families need to see location info on booking page)
CREATE POLICY "work_locations_public_read"
  ON educator_work_locations FOR SELECT
  TO public
  USING (is_active = true);

-- Educators can manage their own locations
CREATE POLICY "work_locations_own_insert"
  ON educator_work_locations FOR INSERT
  TO authenticated
  WITH CHECK (educator_id IN (SELECT id FROM educator_profiles WHERE user_id = auth.uid()));

CREATE POLICY "work_locations_own_update"
  ON educator_work_locations FOR UPDATE
  TO authenticated
  USING (educator_id IN (SELECT id FROM educator_profiles WHERE user_id = auth.uid()));

CREATE POLICY "work_locations_own_delete"
  ON educator_work_locations FOR DELETE
  TO authenticated
  USING (educator_id IN (SELECT id FROM educator_profiles WHERE user_id = auth.uid()));

-- 2. Add location columns to educator_availability
ALTER TABLE educator_availability
ADD COLUMN IF NOT EXISTS work_location_id UUID REFERENCES educator_work_locations(id) ON DELETE SET NULL;

ALTER TABLE educator_availability
ADD COLUMN IF NOT EXISTS ad_hoc_location_name VARCHAR(100);

ALTER TABLE educator_availability
ADD COLUMN IF NOT EXISTS ad_hoc_location_address TEXT;

CREATE INDEX IF NOT EXISTS idx_avail_work_location ON educator_availability(work_location_id);

-- 3. Ensure educator_availability_exceptions has proper RLS for vacation management
-- (Table already exists, just ensure educators can manage their own exceptions)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'educator_availability_exceptions' AND policyname = 'exceptions_own_insert'
  ) THEN
    CREATE POLICY "exceptions_own_insert"
      ON educator_availability_exceptions FOR INSERT
      TO authenticated
      WITH CHECK (educator_id IN (SELECT id FROM educator_profiles WHERE user_id = auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'educator_availability_exceptions' AND policyname = 'exceptions_own_delete'
  ) THEN
    CREATE POLICY "exceptions_own_delete"
      ON educator_availability_exceptions FOR DELETE
      TO authenticated
      USING (educator_id IN (SELECT id FROM educator_profiles WHERE user_id = auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'educator_availability_exceptions' AND policyname = 'exceptions_public_read'
  ) THEN
    CREATE POLICY "exceptions_public_read"
      ON educator_availability_exceptions FOR SELECT
      TO public
      USING (true);
  END IF;
END $$;
