-- Lesson plans: one plan per lesson, editable by the tutor
CREATE TABLE IF NOT EXISTS lesson_plans (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id            UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  topic                TEXT,
  subtopic             TEXT,
  student_preparation  TEXT,
  tutor_notes          TEXT,
  created_at           TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at           TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT lesson_plans_lesson_id_key UNIQUE (lesson_id)
);

-- Auto-update updated_at
CREATE TRIGGER set_lesson_plans_updated_at
  BEFORE UPDATE ON lesson_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_lesson_plans_lesson_id ON lesson_plans(lesson_id);

-- RLS
ALTER TABLE lesson_plans ENABLE ROW LEVEL SECURITY;

-- Tutors can read and write plans for their own lessons
CREATE POLICY "Tutors can manage their lesson plans"
  ON lesson_plans
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM lessons l
      JOIN tutors t ON t.id = l.tutor_id
      WHERE l.id = lesson_plans.lesson_id
        AND t.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM lessons l
      JOIN tutors t ON t.id = l.tutor_id
      WHERE l.id = lesson_plans.lesson_id
        AND t.user_id = auth.uid()
    )
  );

-- Students can read the plan for their own lessons
CREATE POLICY "Students can read their lesson plans"
  ON lesson_plans
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM lessons l
      JOIN students s ON s.id = l.student_id
      WHERE l.id = lesson_plans.lesson_id
        AND s.user_id = auth.uid()
    )
  );

-- Admin full access
CREATE POLICY "Admin full access to lesson plans"
  ON lesson_plans
  FOR ALL
  USING (auth.uid() = 'b7061c00-beac-4dbf-bec4-64a14ab81154'::uuid)
  WITH CHECK (auth.uid() = 'b7061c00-beac-4dbf-bec4-64a14ab81154'::uuid);
