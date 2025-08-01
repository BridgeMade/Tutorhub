-- TutorHub Messaging System Database Schema (Safe Version)
-- Run these commands in your Supabase SQL editor
-- This version handles existing objects gracefully

-- 1. Conversations table - represents chat threads between users
CREATE TABLE IF NOT EXISTS conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tutor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subject VARCHAR(100),
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_student_tutor' 
        AND conrelid = 'conversations'::regclass
    ) THEN
        ALTER TABLE conversations ADD CONSTRAINT unique_student_tutor UNIQUE(student_id, tutor_id);
    END IF;
END $$;

-- 2. Messages table - stores individual messages
CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
    file_url TEXT, -- For file/image messages
    file_name TEXT, -- Original filename for file messages
    file_size INTEGER, -- File size in bytes
    read_at TIMESTAMP WITH TIME ZONE,
    edited_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Message reads table - track read status per user
CREATE TABLE IF NOT EXISTS message_reads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_message_user_read' 
        AND conrelid = 'message_reads'::regclass
    ) THEN
        ALTER TABLE message_reads ADD CONSTRAINT unique_message_user_read UNIQUE(message_id, user_id);
    END IF;
END $$;

-- 4. Conversation participants table - for group conversations (future)
CREATE TABLE IF NOT EXISTS conversation_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'participant' CHECK (role IN ('participant', 'admin', 'moderator')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    left_at TIMESTAMP WITH TIME ZONE
);

-- Add unique constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_conversation_user' 
        AND conrelid = 'conversation_participants'::regclass
    ) THEN
        ALTER TABLE conversation_participants ADD CONSTRAINT unique_conversation_user UNIQUE(conversation_id, user_id);
    END IF;
END $$;

-- Indexes for performance (CREATE INDEX IF NOT EXISTS is safe)
CREATE INDEX IF NOT EXISTS idx_conversations_student_id ON conversations(student_id);
CREATE INDEX IF NOT EXISTS idx_conversations_tutor_id ON conversations(tutor_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON messages(conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_message_reads_message_id ON message_reads(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reads_user_id ON message_reads(user_id);

CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_id ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON conversation_participants(user_id);

-- Functions and Triggers

-- 1. Function to update conversation's last_message_at when new message is added
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations 
    SET 
        last_message_at = NEW.created_at,
        updated_at = NOW()
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Trigger to automatically update conversation timestamp
DROP TRIGGER IF EXISTS trigger_update_conversation_last_message ON messages;
CREATE TRIGGER trigger_update_conversation_last_message
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_last_message();

-- 3. Function to automatically create conversation if it doesn't exist
CREATE OR REPLACE FUNCTION create_conversation_if_not_exists(
    p_student_id UUID,
    p_tutor_id UUID,
    p_subject VARCHAR DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    conversation_id UUID;
BEGIN
    -- Try to find existing conversation
    SELECT id INTO conversation_id
    FROM conversations
    WHERE student_id = p_student_id AND tutor_id = p_tutor_id;
    
    -- If not found, create new one
    IF conversation_id IS NULL THEN
        INSERT INTO conversations (student_id, tutor_id, subject)
        VALUES (p_student_id, p_tutor_id, p_subject)
        RETURNING id INTO conversation_id;
    END IF;
    
    RETURN conversation_id;
END;
$$ LANGUAGE plpgsql;

-- 4. Function to get unread message count for a user in a conversation
CREATE OR REPLACE FUNCTION get_unread_count(
    p_conversation_id UUID,
    p_user_id UUID
)
RETURNS INTEGER AS $$
DECLARE
    unread_count INTEGER;
BEGIN
    SELECT COUNT(*)::INTEGER INTO unread_count
    FROM messages m
    LEFT JOIN message_reads mr ON m.id = mr.message_id AND mr.user_id = p_user_id
    WHERE m.conversation_id = p_conversation_id
    AND m.sender_id != p_user_id  -- Don't count own messages
    AND mr.id IS NULL;  -- No read record means unread
    
    RETURN COALESCE(unread_count, 0);
END;
$$ LANGUAGE plpgsql;

-- 5. Function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_as_read(
    p_conversation_id UUID,
    p_user_id UUID
)
RETURNS INTEGER AS $$
DECLARE
    marked_count INTEGER;
BEGIN
    -- Insert read records for unread messages
    INSERT INTO message_reads (message_id, user_id)
    SELECT m.id, p_user_id
    FROM messages m
    LEFT JOIN message_reads mr ON m.id = mr.message_id AND mr.user_id = p_user_id
    WHERE m.conversation_id = p_conversation_id
    AND m.sender_id != p_user_id  -- Don't mark own messages
    AND mr.id IS NULL  -- Only unread messages
    ON CONFLICT (message_id, user_id) DO NOTHING; -- Handle duplicates gracefully
    
    GET DIAGNOSTICS marked_count = ROW_COUNT;
    RETURN marked_count;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then recreate them
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations they participate in" ON conversations;
DROP POLICY IF EXISTS "Participants can update conversations" ON conversations;

DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can create messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON messages;

DROP POLICY IF EXISTS "Users can view their own read status" ON message_reads;
DROP POLICY IF EXISTS "Users can create their own read status" ON message_reads;

DROP POLICY IF EXISTS "Users can view participants in their conversations" ON conversation_participants;

-- Conversations policies
CREATE POLICY "Users can view conversations they participate in" ON conversations
    FOR SELECT USING (
        auth.uid() = student_id OR 
        auth.uid() = tutor_id
    );

CREATE POLICY "Users can create conversations they participate in" ON conversations
    FOR INSERT WITH CHECK (
        auth.uid() = student_id OR 
        auth.uid() = tutor_id
    );

CREATE POLICY "Participants can update conversations" ON conversations
    FOR UPDATE USING (
        auth.uid() = student_id OR 
        auth.uid() = tutor_id
    );

-- Messages policies
CREATE POLICY "Users can view messages in their conversations" ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversations c 
            WHERE c.id = conversation_id 
            AND (c.student_id = auth.uid() OR c.tutor_id = auth.uid())
        )
    );

CREATE POLICY "Users can create messages in their conversations" ON messages
    FOR INSERT WITH CHECK (
        sender_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM conversations c 
            WHERE c.id = conversation_id 
            AND (c.student_id = auth.uid() OR c.tutor_id = auth.uid())
        )
    );

CREATE POLICY "Users can update their own messages" ON messages
    FOR UPDATE USING (sender_id = auth.uid());

-- Message reads policies
CREATE POLICY "Users can view their own read status" ON message_reads
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own read status" ON message_reads
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Conversation participants policies (for future group messaging)
CREATE POLICY "Users can view participants in their conversations" ON conversation_participants
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM conversations c 
            WHERE c.id = conversation_id 
            AND (c.student_id = auth.uid() OR c.tutor_id = auth.uid())
        )
    );

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'TutorHub messaging system database schema installed successfully!';
    RAISE NOTICE 'Tables created: conversations, messages, message_reads, conversation_participants';
    RAISE NOTICE 'Functions created: create_conversation_if_not_exists, get_unread_count, mark_messages_as_read';
    RAISE NOTICE 'Ready for real-time messaging! 🎉';
END $$;