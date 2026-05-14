-- Separate table for mobile app's JSONB weekly availability blob.
-- The existing tutor_availability table stores per-row day slots for the webapp.
-- This new table stores one row per tutor with the full weekly schedule as JSON.

CREATE TABLE IF NOT EXISTS tutor_availability_schedule (
  tutor_id        UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  availability_data JSONB NOT NULL DEFAULT '{}',
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER set_tutor_availability_schedule_updated_at
  BEFORE UPDATE ON tutor_availability_schedule
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE tutor_availability_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tutors manage own schedule"
  ON tutor_availability_schedule FOR ALL
  USING (auth.uid() = tutor_id)
  WITH CHECK (auth.uid() = tutor_id);

CREATE POLICY "Students can read tutor schedule"
  ON tutor_availability_schedule FOR SELECT
  USING (true);

CREATE POLICY "Admin full access to schedules"
  ON tutor_availability_schedule FOR ALL
  USING (auth.uid() = 'b7061c00-beac-4dbf-bec4-64a14ab81154'::uuid)
  WITH CHECK (auth.uid() = 'b7061c00-beac-4dbf-bec4-64a14ab81154'::uuid);
