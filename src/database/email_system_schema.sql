-- Email System Schema
-- Comprehensive email logging, templates, and delivery tracking

-- Email logs table for tracking all sent emails
CREATE TABLE IF NOT EXISTS email_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    to_email TEXT NOT NULL,
    cc_emails TEXT[], -- Array of CC email addresses
    bcc_emails TEXT[], -- Array of BCC email addresses
    from_email TEXT NOT NULL DEFAULT 'noreply@tutorhub.co.za',
    subject TEXT NOT NULL,
    template_type TEXT NOT NULL,
    template_data JSONB DEFAULT '{}',
    
    -- Delivery tracking
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced', 'spam', 'unsubscribed')),
    external_id TEXT, -- ID from email provider (Resend, SendGrid, etc.)
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    bounced_at TIMESTAMP WITH TIME ZONE,
    
    -- Error tracking
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    
    -- User association
    user_id UUID REFERENCES profiles(id),
    
    -- Email content (for debugging and resending)
    html_body TEXT,
    text_body TEXT,
    
    -- Metadata
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    tags JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email templates table for managing dynamic templates
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_key TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    
    -- Template content
    subject_template TEXT NOT NULL,
    html_template TEXT NOT NULL,
    text_template TEXT NOT NULL,
    
    -- Template variables and validation
    required_variables TEXT[] DEFAULT '{}',
    optional_variables TEXT[] DEFAULT '{}',
    
    -- Template settings
    is_active BOOLEAN DEFAULT true,
    category TEXT, -- e.g., 'booking', 'authentication', 'system'
    
    -- Versioning
    version INTEGER DEFAULT 1,
    parent_template_id UUID REFERENCES email_templates(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email preferences for users
CREATE TABLE IF NOT EXISTS email_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Global email settings
    email_notifications_enabled BOOLEAN DEFAULT true,
    marketing_emails_enabled BOOLEAN DEFAULT true,
    
    -- Specific notification types
    session_reminders BOOLEAN DEFAULT true,
    session_confirmations BOOLEAN DEFAULT true,
    reschedule_notifications BOOLEAN DEFAULT true,
    resource_assignments BOOLEAN DEFAULT true,
    system_announcements BOOLEAN DEFAULT true,
    weekly_summaries BOOLEAN DEFAULT false,
    
    -- Communication preferences
    reminder_hours_before INTEGER DEFAULT 24, -- Hours before session to send reminder
    digest_frequency TEXT DEFAULT 'weekly' CHECK (digest_frequency IN ('daily', 'weekly', 'monthly', 'never')),
    
    -- Unsubscribe tracking
    unsubscribed_at TIMESTAMP WITH TIME ZONE,
    unsubscribe_reason TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Email queue for scheduled and batch emails
CREATE TABLE IF NOT EXISTS email_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Email details
    to_email TEXT NOT NULL,
    cc_emails TEXT[],
    bcc_emails TEXT[],
    template_type TEXT NOT NULL,
    template_data JSONB DEFAULT '{}',
    
    -- Scheduling
    scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    
    -- Processing status
    status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'sent', 'failed', 'cancelled')),
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    last_attempt_at TIMESTAMP WITH TIME ZONE,
    
    -- Result tracking
    email_log_id UUID REFERENCES email_logs(id),
    error_message TEXT,
    
    -- User association
    user_id UUID REFERENCES profiles(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email analytics and metrics
CREATE TABLE IF NOT EXISTS email_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    
    -- Volume metrics
    emails_sent INTEGER DEFAULT 0,
    emails_delivered INTEGER DEFAULT 0,
    emails_opened INTEGER DEFAULT 0,
    emails_clicked INTEGER DEFAULT 0,
    emails_bounced INTEGER DEFAULT 0,
    emails_failed INTEGER DEFAULT 0,
    
    -- Rate calculations
    delivery_rate DECIMAL(5,2) DEFAULT 0.00,
    open_rate DECIMAL(5,2) DEFAULT 0.00,
    click_rate DECIMAL(5,2) DEFAULT 0.00,
    bounce_rate DECIMAL(5,2) DEFAULT 0.00,
    
    -- Template breakdown
    template_metrics JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_template_type ON email_logs(template_type);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_email_logs_to_email ON email_logs(to_email);

CREATE INDEX IF NOT EXISTS idx_email_templates_key ON email_templates(template_key);
CREATE INDEX IF NOT EXISTS idx_email_templates_active ON email_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_email_templates_category ON email_templates(category);

CREATE INDEX IF NOT EXISTS idx_email_preferences_user_id ON email_preferences(user_id);

CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_scheduled_at ON email_queue(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_email_queue_priority ON email_queue(priority);

CREATE INDEX IF NOT EXISTS idx_email_analytics_date ON email_analytics(date);

-- Trigger for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_email_logs_updated_at 
    BEFORE UPDATE ON email_logs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at 
    BEFORE UPDATE ON email_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_preferences_updated_at 
    BEFORE UPDATE ON email_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_queue_updated_at 
    BEFORE UPDATE ON email_queue 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_analytics ENABLE ROW LEVEL SECURITY;

-- Email logs policies
CREATE POLICY email_logs_admin_full ON email_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY email_logs_user_own ON email_logs
    FOR SELECT USING (user_id = auth.uid());

-- Email templates policies (admin only for modifications)
CREATE POLICY email_templates_admin_full ON email_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY email_templates_read_active ON email_templates
    FOR SELECT USING (is_active = true);

-- Email preferences policies
CREATE POLICY email_preferences_own ON email_preferences
    FOR ALL USING (user_id = auth.uid());

-- Email queue policies (admin only)
CREATE POLICY email_queue_admin_only ON email_queue
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Email analytics policies (admin only)
CREATE POLICY email_analytics_admin_only ON email_analytics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Function to get email delivery statistics
CREATE OR REPLACE FUNCTION get_email_stats(
    p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '7 days',
    p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_sent', COUNT(*) FILTER (WHERE status IN ('sent', 'delivered')),
        'total_delivered', COUNT(*) FILTER (WHERE status = 'delivered'),
        'total_opened', COUNT(*) FILTER (WHERE opened_at IS NOT NULL),
        'total_clicked', COUNT(*) FILTER (WHERE clicked_at IS NOT NULL),
        'total_bounced', COUNT(*) FILTER (WHERE status = 'bounced'),
        'total_failed', COUNT(*) FILTER (WHERE status = 'failed'),
        'delivery_rate', 
            CASE 
                WHEN COUNT(*) FILTER (WHERE status IN ('sent', 'delivered', 'bounced', 'failed')) > 0 
                THEN ROUND(
                    COUNT(*) FILTER (WHERE status IN ('sent', 'delivered'))::DECIMAL / 
                    COUNT(*) FILTER (WHERE status IN ('sent', 'delivered', 'bounced', 'failed')) * 100, 
                    2
                )
                ELSE 0 
            END,
        'open_rate',
            CASE 
                WHEN COUNT(*) FILTER (WHERE status IN ('sent', 'delivered')) > 0 
                THEN ROUND(
                    COUNT(*) FILTER (WHERE opened_at IS NOT NULL)::DECIMAL / 
                    COUNT(*) FILTER (WHERE status IN ('sent', 'delivered')) * 100, 
                    2
                )
                ELSE 0 
            END
    ) INTO result
    FROM email_logs
    WHERE created_at::DATE BETWEEN p_start_date AND p_end_date;
    
    RETURN COALESCE(result, '{"total_sent": 0, "total_delivered": 0, "delivery_rate": 0, "open_rate": 0}'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process email queue
CREATE OR REPLACE FUNCTION process_email_queue(p_batch_size INTEGER DEFAULT 10)
RETURNS INTEGER AS $$
DECLARE
    processed_count INTEGER := 0;
    queue_item RECORD;
BEGIN
    -- Get queued emails ready to be sent
    FOR queue_item IN
        SELECT * FROM email_queue
        WHERE status = 'queued'
        AND scheduled_at <= NOW()
        AND attempts < max_attempts
        ORDER BY priority DESC, scheduled_at ASC
        LIMIT p_batch_size
    LOOP
        -- Update status to processing
        UPDATE email_queue 
        SET status = 'processing', 
            attempts = attempts + 1,
            last_attempt_at = NOW()
        WHERE id = queue_item.id;
        
        processed_count := processed_count + 1;
    END LOOP;
    
    RETURN processed_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update email analytics daily
CREATE OR REPLACE FUNCTION update_email_analytics()
RETURNS VOID AS $$
DECLARE
    target_date DATE := CURRENT_DATE - INTERVAL '1 day';
    stats RECORD;
BEGIN
    -- Calculate metrics for the target date
    SELECT 
        COUNT(*) FILTER (WHERE status IN ('sent', 'delivered')) as emails_sent,
        COUNT(*) FILTER (WHERE status = 'delivered') as emails_delivered,
        COUNT(*) FILTER (WHERE opened_at IS NOT NULL) as emails_opened,
        COUNT(*) FILTER (WHERE clicked_at IS NOT NULL) as emails_clicked,
        COUNT(*) FILTER (WHERE status = 'bounced') as emails_bounced,
        COUNT(*) FILTER (WHERE status = 'failed') as emails_failed
    INTO stats
    FROM email_logs
    WHERE created_at::DATE = target_date;
    
    -- Insert or update analytics record
    INSERT INTO email_analytics (
        date, emails_sent, emails_delivered, emails_opened, 
        emails_clicked, emails_bounced, emails_failed,
        delivery_rate, open_rate, click_rate, bounce_rate
    ) VALUES (
        target_date,
        stats.emails_sent,
        stats.emails_delivered,
        stats.emails_opened,
        stats.emails_clicked,
        stats.emails_bounced,
        stats.emails_failed,
        CASE WHEN stats.emails_sent > 0 THEN 
            ROUND(stats.emails_delivered::DECIMAL / stats.emails_sent * 100, 2) 
            ELSE 0 END,
        CASE WHEN stats.emails_delivered > 0 THEN 
            ROUND(stats.emails_opened::DECIMAL / stats.emails_delivered * 100, 2) 
            ELSE 0 END,
        CASE WHEN stats.emails_opened > 0 THEN 
            ROUND(stats.emails_clicked::DECIMAL / stats.emails_opened * 100, 2) 
            ELSE 0 END,
        CASE WHEN stats.emails_sent > 0 THEN 
            ROUND(stats.emails_bounced::DECIMAL / stats.emails_sent * 100, 2) 
            ELSE 0 END
    )
    ON CONFLICT (date) DO UPDATE SET
        emails_sent = EXCLUDED.emails_sent,
        emails_delivered = EXCLUDED.emails_delivered,
        emails_opened = EXCLUDED.emails_opened,
        emails_clicked = EXCLUDED.emails_clicked,
        emails_bounced = EXCLUDED.emails_bounced,
        emails_failed = EXCLUDED.emails_failed,
        delivery_rate = EXCLUDED.delivery_rate,
        open_rate = EXCLUDED.open_rate,
        click_rate = EXCLUDED.click_rate,
        bounce_rate = EXCLUDED.bounce_rate;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default email preferences for new users
CREATE OR REPLACE FUNCTION create_default_email_preferences()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO email_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create email preferences for new users
CREATE TRIGGER create_email_preferences_for_new_user
    AFTER INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION create_default_email_preferences();

-- Insert built-in email templates
INSERT INTO email_templates (template_key, name, description, subject_template, html_template, text_template, category, required_variables) VALUES 
(
    'welcome_email',
    'Welcome Email',
    'Welcome email for new users',
    'Welcome to TutorHub! 🎉',
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><h1 style="color: #ea580c;">Welcome to TutorHub, {{userName}}!</h1><p>We''re excited to have you join our learning community as a {{userRole}}.</p><a href="{{loginUrl}}" style="background-color: #ea580c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Access Your Dashboard</a></div>',
    'Welcome to TutorHub, {{userName}}! Access your dashboard at {{loginUrl}}.',
    'authentication',
    ARRAY['userName', 'userRole', 'loginUrl']
),
(
    'session_booked',
    'Session Booked',
    'Confirmation email when a session is booked',
    'Session Booked: {{subject}} on {{sessionDate}}',
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><h1 style="color: #ea580c;">Session Booked Successfully! 📚</h1><div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px;"><h2>Session Details</h2><p><strong>Subject:</strong> {{subject}}</p><p><strong>Date:</strong> {{sessionDate}}</p></div></div>',
    'Session booked for {{subject}} on {{sessionDate}}.',
    'booking',
    ARRAY['subject', 'sessionDate', 'studentName', 'tutorName']
)
ON CONFLICT (template_key) DO NOTHING;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON email_logs TO authenticated;
GRANT SELECT ON email_templates TO authenticated;
GRANT SELECT, INSERT, UPDATE ON email_preferences TO authenticated;
GRANT SELECT ON email_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION get_email_stats(DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION update_email_analytics() TO authenticated;

-- Comments for documentation
COMMENT ON TABLE email_logs IS 'Tracks all emails sent through the system with delivery status';
COMMENT ON TABLE email_templates IS 'Stores reusable email templates with variable substitution';
COMMENT ON TABLE email_preferences IS 'User email notification preferences and settings';
COMMENT ON TABLE email_queue IS 'Queue for scheduled and batch email processing';
COMMENT ON TABLE email_analytics IS 'Daily email performance metrics and analytics';

SELECT 'Email System Schema installed successfully! ✅' as status;