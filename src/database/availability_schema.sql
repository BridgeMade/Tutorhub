-- Tutor Availability System Database Schema
-- Run this in your Supabase SQL editor

-- 1. Create tutor_availability table
CREATE TABLE IF NOT EXISTS tutor_availability (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tutor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    day_of_week VARCHAR(10) NOT NULL CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT true,
    is_recurring BOOLEAN DEFAULT true,
    session_type VARCHAR(20) DEFAULT 'individual' CHECK (session_type IN ('individual', 'group', 'online')),
    max_students INTEGER DEFAULT 1,
    hourly_rate DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tutor_availability_tutor_id ON tutor_availability(tutor_id);
CREATE INDEX IF NOT EXISTS idx_tutor_availability_day_time ON tutor_availability(day_of_week, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_tutor_availability_available ON tutor_availability(is_available) WHERE is_available = true;

-- 3. Add constraint to prevent overlapping time slots for same tutor/day
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'no_overlapping_slots'
    ) THEN
        -- Note: This is a simplified constraint. In production, you might need a more complex exclusion constraint
        ALTER TABLE tutor_availability 
        ADD CONSTRAINT no_overlapping_slots 
        UNIQUE(tutor_id, day_of_week, start_time, end_time);
    END IF;
END $$;

-- 4. Create function to check time slot overlaps
CREATE OR REPLACE FUNCTION check_time_slot_overlap()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if the new/updated slot overlaps with existing slots for the same tutor and day
    IF EXISTS (
        SELECT 1 FROM tutor_availability 
        WHERE tutor_id = NEW.tutor_id 
        AND day_of_week = NEW.day_of_week 
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
        AND (
            (NEW.start_time >= start_time AND NEW.start_time < end_time) OR
            (NEW.end_time > start_time AND NEW.end_time <= end_time) OR
            (NEW.start_time <= start_time AND NEW.end_time >= end_time)
        )
    ) THEN
        RAISE EXCEPTION 'Time slot overlaps with existing availability for this tutor on %', NEW.day_of_week;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Create trigger for overlap checking
DROP TRIGGER IF EXISTS trigger_check_time_slot_overlap ON tutor_availability;
CREATE TRIGGER trigger_check_time_slot_overlap
    BEFORE INSERT OR UPDATE ON tutor_availability
    FOR EACH ROW
    EXECUTE FUNCTION check_time_slot_overlap();

-- 6. Add update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_tutor_availability_updated_at ON tutor_availability;
CREATE TRIGGER update_tutor_availability_updated_at
    BEFORE UPDATE ON tutor_availability
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 7. Enable RLS (Row Level Security)
ALTER TABLE tutor_availability ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies
DROP POLICY IF EXISTS "Tutors can manage their own availability" ON tutor_availability;
CREATE POLICY "Tutors can manage their own availability" ON tutor_availability
    FOR ALL USING (auth.uid() = tutor_id);

DROP POLICY IF EXISTS "Students can view tutor availability" ON tutor_availability;
CREATE POLICY "Students can view tutor availability" ON tutor_availability
    FOR SELECT USING (is_available = true);

DROP POLICY IF EXISTS "Admins can manage all availability" ON tutor_availability;
CREATE POLICY "Admins can manage all availability" ON tutor_availability
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- 9. Create function to get available time slots for booking
CREATE OR REPLACE FUNCTION get_available_slots_for_date(
    p_tutor_id UUID,
    p_date DATE
) RETURNS TABLE (
    slot_id UUID,
    day_name VARCHAR(10),
    start_time TIME,
    end_time TIME,
    session_type VARCHAR(20),
    hourly_rate DECIMAL(10,2),
    max_students INTEGER
) AS $$
DECLARE
    day_name VARCHAR(10);
BEGIN
    -- Get day name for the given date
    day_name := to_char(p_date, 'Day');
    day_name := trim(day_name);
    
    -- Return available slots for this tutor on this day
    RETURN QUERY
    SELECT 
        ta.id,
        ta.day_of_week,
        ta.start_time,
        ta.end_time,
        ta.session_type,
        ta.hourly_rate,
        ta.max_students
    FROM tutor_availability ta
    WHERE ta.tutor_id = p_tutor_id
    AND ta.day_of_week = day_name
    AND ta.is_available = true
    ORDER BY ta.start_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Create function to check booking conflicts
CREATE OR REPLACE FUNCTION check_lesson_conflicts(
    p_tutor_id UUID,
    p_scheduled_at TIMESTAMP WITH TIME ZONE,
    p_duration_minutes INTEGER,
    p_exclude_lesson_id UUID DEFAULT NULL
) RETURNS TABLE (
    lesson_id UUID,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    student_name TEXT
) AS $$
DECLARE
    session_start TIMESTAMP WITH TIME ZONE := p_scheduled_at;
    session_end TIMESTAMP WITH TIME ZONE := p_scheduled_at + (p_duration_minutes || ' minutes')::INTERVAL;
BEGIN
    RETURN QUERY
    SELECT 
        l.id,
        l.scheduled_at,
        l.duration_minutes,
        p.full_name
    FROM lessons l
    JOIN profiles p ON l.student_id = p.id
    WHERE l.tutor_id = p_tutor_id
    AND l.status IN ('scheduled', 'confirmed')
    AND (p_exclude_lesson_id IS NULL OR l.id != p_exclude_lesson_id)
    AND (
        -- Check for any time overlap
        (l.scheduled_at < session_end AND (l.scheduled_at + (l.duration_minutes || ' minutes')::INTERVAL) > session_start)
    )
    ORDER BY l.scheduled_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON tutor_availability TO authenticated;
GRANT EXECUTE ON FUNCTION get_available_slots_for_date(UUID, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION check_lesson_conflicts(UUID, TIMESTAMP WITH TIME ZONE, INTEGER, UUID) TO authenticated;

-- 12. Add sample data for testing (optional - remove in production)
-- This creates some sample availability for testing
/*
INSERT INTO tutor_availability (tutor_id, day_of_week, start_time, end_time, session_type, hourly_rate) VALUES
-- Replace with actual tutor UUID from your database
('your-tutor-uuid-here', 'Monday', '09:00', '17:00', 'individual', 150.00),
('your-tutor-uuid-here', 'Tuesday', '09:00', '17:00', 'individual', 150.00),
('your-tutor-uuid-here', 'Wednesday', '09:00', '17:00', 'individual', 150.00),
('your-tutor-uuid-here', 'Thursday', '09:00', '17:00', 'individual', 150.00),
('your-tutor-uuid-here', 'Friday', '09:00', '17:00', 'individual', 150.00);
*/

-- Verify the schema was created successfully
SELECT 'Tutor availability schema created successfully!' as status;