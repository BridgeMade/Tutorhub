-- Fix lesson_plans RLS: mobile app stores auth UID directly in lessons.tutor_id/student_id,
-- so skip the tutors/students join and match directly against auth.uid().

DROP POLICY IF EXISTS "Tutors can manage their lesson plans" ON lesson_plans;
DROP POLICY IF EXISTS "Students can read their lesson plans" ON lesson_plans;

-- Tutors: lessons.tutor_id = auth.uid() (mobile stores profile UUID directly)
CREATE POLICY "Tutors can manage their lesson plans"
  ON lesson_plans
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM lessons l
      WHERE l.id = lesson_plans.lesson_id
        AND l.tutor_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM lessons l
      WHERE l.id = lesson_plans.lesson_id
        AND l.tutor_id = auth.uid()
    )
  );

-- Students: lessons.student_id = auth.uid() (same pattern)
CREATE POLICY "Students can read their lesson plans"
  ON lesson_plans
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM lessons l
      WHERE l.id = lesson_plans.lesson_id
        AND l.student_id = auth.uid()
    )
  );

-- Parents: can read plans for lessons belonging to their linked children
CREATE POLICY "Parents can read their children lesson plans"
  ON lesson_plans
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM lessons l
      JOIN parent_child_relationships pcr ON pcr.student_id = l.student_id
      WHERE l.id = lesson_plans.lesson_id
        AND pcr.parent_id = auth.uid()
    )
  );
