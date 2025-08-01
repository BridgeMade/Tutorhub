-- Enable real-time functionality for messaging tables
-- Run this in your Supabase SQL editor

-- Enable real-time for conversations table
ALTER publication supabase_realtime ADD TABLE conversations;

-- Enable real-time for messages table  
ALTER publication supabase_realtime ADD TABLE messages;

-- Enable real-time for message_reads table
ALTER publication supabase_realtime ADD TABLE message_reads;

-- Verify real-time is enabled
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename IN ('conversations', 'messages', 'message_reads');

-- Check RLS policies exist and are correct
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('conversations', 'messages', 'message_reads');