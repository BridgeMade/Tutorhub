-- Comprehensive Notification System Database Schema
-- Run this in your Supabase SQL editor

-- 1. Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Notification content
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN (
        'reschedule_request', 'reschedule_approved', 'reschedule_declined',
        'counter_proposal', 'counter_proposal_response', 'admin_escalation',
        'session_reminder', 'session_cancelled', 'session_confirmed',
        'message_received', 'assignment_created', 'payment_reminder'
    )),
    
    -- Priority and urgency
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    
    -- Related entities
    related_lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL,
    related_request_id UUID REFERENCES session_reschedule_requests(id) ON DELETE SET NULL,
    related_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    
    -- Status tracking
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- Delivery tracking
    in_app_sent BOOLEAN DEFAULT false,
    in_app_sent_at TIMESTAMP WITH TIME ZONE,
    email_sent BOOLEAN DEFAULT false,
    email_sent_at TIMESTAMP WITH TIME ZONE,
    email_address VARCHAR(255),
    
    -- Action buttons (JSON array of action objects)
    action_buttons JSONB,
    
    -- Expiry and auto-cleanup
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    metadata JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- In-app notification preferences
    in_app_enabled BOOLEAN DEFAULT true,
    in_app_sound BOOLEAN DEFAULT true,
    
    -- Email notification preferences
    email_enabled BOOLEAN DEFAULT true,
    email_address VARCHAR(255),
    
    -- Per-category preferences
    reschedule_notifications BOOLEAN DEFAULT true,
    message_notifications BOOLEAN DEFAULT true,
    reminder_notifications BOOLEAN DEFAULT true,
    admin_notifications BOOLEAN DEFAULT true,
    
    -- Timing preferences
    email_digest_frequency VARCHAR(20) DEFAULT 'instant' CHECK (email_digest_frequency IN ('instant', 'hourly', 'daily', 'weekly')),
    quiet_hours_start TIME DEFAULT '22:00',
    quiet_hours_end TIME DEFAULT '07:00',
    timezone VARCHAR(50) DEFAULT 'Africa/Johannesburg',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- 3. Create notification templates table
CREATE TABLE IF NOT EXISTS notification_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_key VARCHAR(100) NOT NULL UNIQUE,
    notification_type VARCHAR(50) NOT NULL,
    
    -- Templates for different channels
    title_template TEXT NOT NULL,
    message_template TEXT NOT NULL,
    email_subject_template TEXT,
    email_body_template TEXT,
    
    -- Template variables (JSON array of variable names)
    variables JSONB,
    
    -- Settings
    default_priority VARCHAR(20) DEFAULT 'medium',
    requires_action BOOLEAN DEFAULT false,
    auto_expire_hours INTEGER DEFAULT 168, -- 7 days
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(recipient_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority);
CREATE INDEX IF NOT EXISTS idx_notifications_expires_at ON notifications(expires_at) WHERE expires_at IS NOT NULL;

-- 5. Create function to mark notifications as read
CREATE OR REPLACE FUNCTION mark_notification_as_read(notification_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE notifications 
    SET 
        is_read = true,
        read_at = NOW(),
        updated_at = NOW()
    WHERE id = notification_id 
    AND recipient_id = user_id 
    AND is_read = false;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create function to mark all notifications as read for a user
CREATE OR REPLACE FUNCTION mark_all_notifications_as_read(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE notifications 
    SET 
        is_read = true,
        read_at = NOW(),
        updated_at = NOW()
    WHERE recipient_id = user_id 
    AND is_read = false;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create function to clean up expired notifications
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM notifications 
    WHERE expires_at IS NOT NULL 
    AND expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create function to get notification count for user
CREATE OR REPLACE FUNCTION get_notification_count(user_id UUID)
RETURNS TABLE (
    total_count BIGINT,
    unread_count BIGINT,
    urgent_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_count,
        COUNT(*) FILTER (WHERE is_read = false) as unread_count,
        COUNT(*) FILTER (WHERE is_read = false AND priority = 'urgent') as urgent_count
    FROM notifications 
    WHERE recipient_id = user_id
    AND (expires_at IS NULL OR expires_at > NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Insert default notification templates
INSERT INTO notification_templates (template_key, notification_type, title_template, message_template, email_subject_template, email_body_template, variables, default_priority, requires_action) VALUES

-- Reschedule request templates
('reschedule_request_created', 'reschedule_request', 
'Reschedule Request for {{subject}} Session',
'{{requester_name}} has requested to {{request_type}} your {{subject}} session scheduled for {{original_date}}. Reason: {{reason}}',
'Session Reschedule Request - {{subject}}',
'Hello {{recipient_name}},<br><br>{{requester_name}} has requested to {{request_type}} your {{subject}} session.<br><br><strong>Original Time:</strong> {{original_date}}<br><strong>Proposed Time:</strong> {{proposed_date}}<br><strong>Reason:</strong> {{reason}}<br><br>Please respond within 4 hours.',
'["requester_name", "recipient_name", "subject", "request_type", "original_date", "proposed_date", "reason"]',
'high', true),

('reschedule_request_approved', 'reschedule_approved',
'Session Reschedule Approved',
'Your reschedule request for {{subject}} session has been approved. New time: {{new_date}}',
'Session Reschedule Approved - {{subject}}',
'Hello {{recipient_name}},<br><br>Your reschedule request has been approved.<br><br><strong>Session:</strong> {{subject}}<br><strong>New Time:</strong> {{new_date}}<br><br>Please update your calendar accordingly.',
'["recipient_name", "subject", "new_date"]',
'medium', false),

('reschedule_request_declined', 'reschedule_declined',
'Session Reschedule Declined',
'Your reschedule request for {{subject}} session has been declined. Reason: {{decline_reason}}',
'Session Reschedule Declined - {{subject}}',
'Hello {{recipient_name}},<br><br>Your reschedule request has been declined.<br><br><strong>Session:</strong> {{subject}}<br><strong>Original Time:</strong> {{original_date}}<br><strong>Reason:</strong> {{decline_reason}}',
'["recipient_name", "subject", "original_date", "decline_reason"]',
'medium', false),

-- Counter proposal templates
('counter_proposal_created', 'counter_proposal',
'Counter Proposal for {{subject}} Session',
'{{proposer_name}} has suggested an alternative time for your reschedule request: {{proposed_date}}',
'Counter Proposal - {{subject}} Session',
'Hello {{recipient_name}},<br><br>{{proposer_name}} has suggested an alternative time for your session reschedule.<br><br><strong>Session:</strong> {{subject}}<br><strong>Alternative Time:</strong> {{proposed_date}}<br><strong>Their Message:</strong> {{reason}}<br><br>Please respond within 4 hours.',
'["recipient_name", "proposer_name", "subject", "proposed_date", "reason"]',
'high', true),

-- Admin escalation templates
('admin_escalation_timeout', 'admin_escalation',
'Admin Intervention Required',
'A reschedule request for {{subject}} session has timed out and requires admin approval.',
'Admin Intervention Required - Session Management',
'Hello Admin,<br><br>A reschedule request has exceeded the 4-hour response deadline and requires your intervention.<br><br><strong>Session:</strong> {{subject}}<br><strong>Participants:</strong> {{student_name}} & {{tutor_name}}<br><strong>Request Type:</strong> {{request_type}}<br><br>Please review and make a decision.',
'["subject", "student_name", "tutor_name", "request_type"]',
'urgent', true),

-- Session reminder templates
('session_reminder_24h', 'session_reminder',
'Session Reminder - Tomorrow',
'Reminder: You have a {{subject}} session tomorrow at {{session_time}} with {{other_party}}',
'Session Reminder - {{subject}} Tomorrow',
'Hello {{recipient_name}},<br><br>This is a reminder that you have a session tomorrow.<br><br><strong>Subject:</strong> {{subject}}<br><strong>Time:</strong> {{session_time}}<br><strong>With:</strong> {{other_party}}<br><br>Please be prepared and join on time.',
'["recipient_name", "subject", "session_time", "other_party"]',
'medium', false),

('session_reminder_2h', 'session_reminder',
'Session Starting Soon',
'Your {{subject}} session starts in 2 hours at {{session_time}} with {{other_party}}',
'Session Starting Soon - {{subject}}',
'Hello {{recipient_name}},<br><br>Your session starts in 2 hours.<br><br><strong>Subject:</strong> {{subject}}<br><strong>Time:</strong> {{session_time}}<br><strong>With:</strong> {{other_party}}<br><br>Please be ready to join.',
'["recipient_name", "subject", "session_time", "other_party"]',
'high', false);

-- 10. Create default notification preferences for existing users
INSERT INTO notification_preferences (user_id, email_address)
SELECT 
    id,
    email
FROM auth.users
WHERE NOT EXISTS (
    SELECT 1 FROM notification_preferences WHERE user_id = auth.users.id
);

-- 11. Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;

-- 12. Create RLS policies for notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (recipient_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (recipient_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage all notifications" ON notifications;
CREATE POLICY "Admins can manage all notifications" ON notifications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- 13. Create RLS policies for notification preferences
DROP POLICY IF EXISTS "Users can manage their own preferences" ON notification_preferences;
CREATE POLICY "Users can manage their own preferences" ON notification_preferences
    FOR ALL USING (user_id = auth.uid());

-- 14. Create RLS policies for notification templates (read-only for users)
DROP POLICY IF EXISTS "Users can view notification templates" ON notification_templates;
CREATE POLICY "Users can view notification templates" ON notification_templates
    FOR SELECT USING (true);

-- 15. Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON notification_preferences TO authenticated;
GRANT SELECT ON notification_templates TO authenticated;
GRANT EXECUTE ON FUNCTION mark_notification_as_read(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_all_notifications_as_read(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_notification_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_notifications() TO authenticated;

-- 16. Create triggers for automatic updates
CREATE OR REPLACE FUNCTION update_notification_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications;
CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_notification_updated_at();

DROP TRIGGER IF EXISTS update_notification_preferences_updated_at ON notification_preferences;
CREATE TRIGGER update_notification_preferences_updated_at
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_notification_updated_at();

-- Verify the schema was created successfully
SELECT 'Notification system schema created successfully!' as status;