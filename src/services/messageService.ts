import { supabase } from '../lib/supabase';
import { userService } from './userService';
import { lessonService } from './lessonService';

export interface MessageRecord {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'image' | 'file' | 'system';
  file_url?: string;
  file_name?: string;
  file_size?: number;
  read_at?: string;
  edited_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ConversationRecord {
  id: string;
  student_id: string;
  tutor_id: string;
  subject?: string;
  last_message_at: string;
  created_at: string;
  updated_at: string;
}

export interface ConversationWithDetails extends ConversationRecord {
  participantId: string;
  participantName: string;
  participantRole: 'student' | 'tutor' | 'admin';
  subject?: string;
  grade?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  avatar: string;
  isOnline: boolean;
}

export const messageService = {
  // Get conversations for a user from the database
  async getConversations(userId: string, userRole: 'student' | 'tutor' | 'admin'): Promise<ConversationWithDetails[]> {
    try {
      console.log('🔍 Fetching conversations for user:', userId, userRole);
      
      // Always start by creating conversations from lessons first
      // This ensures all tutoring relationships are represented
      console.log('🔄 Force refreshing conversations from lessons...');
      const conversationsFromLessons = await this.createConversationsFromLessons(userId, userRole);
      
      // Then query actual conversations from database (simplified - no joins for now)
      const query = userRole === 'student' 
        ? supabase
            .from('conversations')  
            .select('*')
            .eq('student_id', userId)
        : supabase
            .from('conversations')
            .select('*') 
            .eq('tutor_id', userId);

      const { data: conversations, error } = await query.order('last_message_at', { ascending: false });

      if (error) {
        console.error('❌ Database error fetching conversations:', error);
        // Fallback to conversations from lessons if database error
        return conversationsFromLessons;
      }

      // If no conversations in database, return the ones we created from lessons
      if (!conversations || conversations.length === 0) {
        console.log('📭 No existing conversations, using lesson-based conversations');
        return conversationsFromLessons;
      }

      // Process conversations with participant details and unread counts
      const conversationsWithDetails: ConversationWithDetails[] = [];

      for (const conv of conversations) {
        const isStudent = userRole === 'student';
        const participantId = isStudent ? conv.tutor_id : conv.student_id;
        const participantRole = isStudent ? 'tutor' : 'student';
        
        // Get participant profile data
        const { data: participantProfile } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', participantId)
          .single();
          
        const participantName = participantProfile?.full_name || participantProfile?.email || 'Unknown User';

        // Get the last message
        const { data: lastMessage } = await supabase
          .from('messages')
          .select('content, message_type, created_at')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // Get unread count using database function
        const { data: unreadResult } = await supabase
          .rpc('get_unread_count', {
            p_conversation_id: conv.id,
            p_user_id: userId
          });

        const conversationDetail: ConversationWithDetails = {
          id: conv.id,
          student_id: conv.student_id,
          tutor_id: conv.tutor_id,
          subject: conv.subject,
          last_message_at: conv.last_message_at,
          created_at: conv.created_at,
          updated_at: conv.updated_at,
          participantId: participantId,
          participantName: participantName,
          participantRole: participantRole,
          avatar: this.generateAvatar(participantName),
          lastMessage: lastMessage?.message_type === 'text' 
            ? lastMessage.content 
            : lastMessage?.message_type === 'image' 
            ? '📷 Image' 
            : lastMessage?.message_type === 'file' 
            ? '📄 File' 
            : 'No messages yet',
          lastMessageTime: lastMessage?.created_at || conv.created_at,
          unreadCount: unreadResult || 0,
          isOnline: false, // TODO: Implement online presence
          grade: participantRole === 'student' ? 'Grade N/A' : undefined
        };

        conversationsWithDetails.push(conversationDetail);
      }

      console.log('✅ Loaded conversations from database:', conversationsWithDetails);
      return conversationsWithDetails;

    } catch (error) {
      console.error('❌ Error fetching conversations:', error);
      return [];
    }
  },

  // Create conversations based on existing assignments if none exist in database
  async createConversationsFromLessons(userId: string, userRole: 'student' | 'tutor' | 'admin'): Promise<ConversationWithDetails[]> {
    try {
      console.log('🔧 Creating conversations from existing assignments...');
      
      // Get user's assignments to find their tutoring relationships
      const assignments = await this.getUserAssignments(userId, userRole);
      
      if (assignments.length === 0) {
        console.log('📭 No assignments found, no conversations to create');
        return [];
      }
      
      // Extract unique tutor-student relationships from assignments
      const relationships = new Map();
      
      assignments.forEach((assignment: any) => {
        const key = `${assignment.student_id}-${assignment.tutor_id}`;
        if (!relationships.has(key)) {
          relationships.set(key, {
            student_id: assignment.student_id,
            tutor_id: assignment.tutor_id,
            subject: assignment.subject || 'General',
            tutor_name: assignment.tutor_name || 'Unknown Tutor',
            student_name: assignment.student_name || 'Unknown Student'
          });
        }
      });
      
      // Try to create conversations in database, but create fallback objects regardless
      const conversationsFromLessons: ConversationWithDetails[] = [];
      
      for (const relationship of Array.from(relationships.values())) {
        let conversationId = `temp-${relationship.student_id}-${relationship.tutor_id}`;
        
        try {
          // Try to create conversation in database
          const { data: dbConversationId, error } = await supabase
            .rpc('create_conversation_if_not_exists', {
              p_student_id: relationship.student_id,
              p_tutor_id: relationship.tutor_id,
              p_subject: relationship.subject
            });

          if (!error && dbConversationId) {
            conversationId = dbConversationId;
            console.log('✅ Created database conversation:', conversationId);
          } else {
            console.log('⚠️ Database conversation creation failed, using fallback ID');
          }
        } catch (dbError) {
          console.log('⚠️ Database not available, creating fallback conversation object');
        }

        // Create conversation object (works with or without database)
        const isStudent = userRole === 'student';
        const participantName = isStudent ? relationship.tutor_name : relationship.student_name;
        const participantId = isStudent ? relationship.tutor_id : relationship.student_id;
        const participantRole = isStudent ? 'tutor' : 'student';

        const conversationDetail: ConversationWithDetails = {
          id: conversationId,
          student_id: relationship.student_id,
          tutor_id: relationship.tutor_id,
          subject: relationship.subject,
          last_message_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          participantId: participantId,
          participantName: participantName,
          participantRole: participantRole,
          lastMessage: `Start chatting about ${relationship.subject}`,
          lastMessageTime: new Date().toISOString(),
          unreadCount: 0,
          avatar: this.generateAvatar(participantName),
          isOnline: false
        };

        conversationsFromLessons.push(conversationDetail);
      }
      
      console.log('✅ Created conversations from lessons:', conversationsFromLessons.length);
      return conversationsFromLessons;
      
    } catch (error) {
      console.error('❌ Error creating conversations from lessons:', error);
      return [];
    }
  },

  // Get messages for a specific conversation from database
  async getMessages(conversationId: string, currentUserId: string): Promise<MessageRecord[]> {
    try {
      console.log('🔍 Fetching messages for conversation:', conversationId);
      
      // Fetch messages from database
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true }); // Oldest first for chat display

      if (error) {
        console.error('❌ Database error fetching messages:', error);
        return [];
      }

      if (!messages || messages.length === 0) {
        console.log('📭 No messages found for conversation');
        return [];
      }

      // Mark messages as read for current user
      await this.markMessagesAsRead(conversationId, currentUserId);

      console.log('✅ Loaded messages from database:', messages);
      return messages;
      
    } catch (error) {
      console.error('❌ Error fetching messages:', error);
      return [];
    }
  },

  // Send a new message to database
  async sendMessage(conversationId: string, senderId: string, content: string, messageType: 'text' | 'image' | 'file' = 'text'): Promise<MessageRecord | null> {
    try {
      console.log('📤 Sending message...', { conversationId, senderId, content, messageType });
      
      // Insert message into database
      const { data: message, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: senderId,
          content,
          message_type: messageType
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Database error sending message:', error);
        return null;
      }

      console.log('✅ Message sent to database:', message);
      return message;
      
    } catch (error) {
      console.error('❌ Error sending message:', error);
      return null;
    }
  },

  // Mark messages as read using database function
  async markMessagesAsRead(conversationId: string, userId: string): Promise<boolean> {
    try {
      console.log('👁️ Marking messages as read for conversation:', conversationId, userId);
      
      const { data, error } = await supabase
        .rpc('mark_messages_as_read', {
          p_conversation_id: conversationId,
          p_user_id: userId
        });

      if (error) {
        console.error('❌ Error marking messages as read:', error);
        return false;
      }

      console.log('✅ Marked messages as read:', data);
      return true;
    } catch (error) {
      console.error('❌ Error marking messages as read:', error);
      return false;
    }
  },

  // Subscribe to real-time message updates
  subscribeToMessages(conversationId: string, onNewMessage: (message: MessageRecord) => void) {
    console.log('🔔 Subscribing to real-time messages for conversation:', conversationId);
    
    // Create unique channel name to avoid conflicts
    const channelName = `messages-${conversationId}-${Date.now()}`;
    
    const subscription = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          console.log('🆕 Supabase real-time message received:', payload.new);
          console.log('🔍 Payload event type:', payload.eventType);
          console.log('🔍 Message for conversation:', conversationId);
          console.log('🔍 Full payload:', payload);
          console.log('🔍 Payload new message data:', payload.new);
          
          // Ensure we have valid message data before calling callback
          if (payload.new && payload.new.id && payload.new.content) {
            console.log('✅ Valid message data, calling onNewMessage callback');
            
            // Add small delay to ensure database consistency
            setTimeout(() => {
              console.log('⏰ Executing onNewMessage callback with delay');
              onNewMessage(payload.new as MessageRecord);
            }, 50);
          } else {
            console.error('❌ Invalid message data received:', payload.new);
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Subscription status for conversation', conversationId, ':', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to messages for conversation:', conversationId);
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Channel error for conversation:', conversationId);
        } else if (status === 'TIMED_OUT') {
          console.error('⏰ Subscription timed out for conversation:', conversationId);
        } else if (status === 'CLOSED') {
          console.log('🔐 Subscription closed for conversation:', conversationId);
        }
      });

    return subscription;
  },

  // Subscribe to real-time conversation updates
  subscribeToConversations(userId: string, userRole: 'student' | 'tutor', onConversationUpdate: () => void) {
    console.log('🔔 Subscribing to real-time conversation updates for user:', userId);
    
    const subscription = supabase
      .channel(`conversations:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `student_id=eq.${userId}`
        },
        (payload) => {
          console.log('🔄 Student conversation updated:', payload);
          onConversationUpdate();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `tutor_id=eq.${userId}`
        },
        (payload) => {
          console.log('🔄 Tutor conversation updated:', payload);
          onConversationUpdate();
        }
      )
      .subscribe();

    return subscription;
  },

  // Subscribe to global message updates to refresh conversations for both sender and receiver
  subscribeToGlobalMessages(userId: string, onMessageUpdate: () => void) {
    console.log('🔔 Subscribing to global message updates for user:', userId);
    
    const subscription = supabase
      .channel(`global_messages:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        async (payload) => {
          const newMessage = payload.new as MessageRecord;
          console.log('🌐 Global message received:', newMessage);
          
          // Check if this message affects the current user's conversations
          const { data: conversation } = await supabase
            .from('conversations')
            .select('student_id, tutor_id')
            .eq('id', newMessage.conversation_id)
            .single();
            
          if (conversation && (conversation.student_id === userId || conversation.tutor_id === userId)) {
            console.log('📬 Message affects current user, refreshing conversations...');
            // Minimal delay for database consistency
            setTimeout(() => {
              onMessageUpdate();
            }, 100);
          }
        }
      )
      // Also listen for new conversations being created
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversations',
          filter: `student_id=eq.${userId}`
        },
        (payload) => {
          console.log('🆕 New conversation created for student:', payload);
          setTimeout(() => {
            onMessageUpdate();
          }, 100);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversations',
          filter: `tutor_id=eq.${userId}`
        },
        (payload) => {
          console.log('🆕 New conversation created for tutor:', payload);
          setTimeout(() => {
            onMessageUpdate();
          }, 100);
        }
      )
      .subscribe();

    return subscription;
  },

  // Get user assignments to determine messaging relationships
  async getUserAssignments(userId: string, userRole: 'student' | 'tutor' | 'admin') {
    try {
      console.log('🔍 Fetching assignments for messaging relationships:', userId, userRole);
      
      // Directly query the tutor_student_assignments table
      const query = userRole === 'student' 
        ? supabase
            .from('tutor_student_assignments')
            .select(`
              *,
              tutor:profiles!tutor_student_assignments_tutor_id_fkey(id, full_name, email),
              student:profiles!tutor_student_assignments_student_id_fkey(id, full_name, email),
              subject:subjects(id, name)
            `)
            .eq('student_id', userId)
            .eq('status', 'active')
        : supabase
            .from('tutor_student_assignments')
            .select(`
              *,
              tutor:profiles!tutor_student_assignments_tutor_id_fkey(id, full_name, email),
              student:profiles!tutor_student_assignments_student_id_fkey(id, full_name, email),
              subject:subjects(id, name)
            `)
            .eq('tutor_id', userId)
            .eq('status', 'active');

      const { data: assignments, error } = await query;
      
      if (error) {
        console.error('❌ Error fetching assignments:', error);
        return [];
      }
      
      if (!assignments || assignments.length === 0) {
        console.log('📭 No assignments found for user');
        return [];
      }
      
      // Transform assignments to the format we need
      const transformedAssignments = assignments.map((assignment: any) => ({
        id: assignment.id,
        student_id: assignment.student_id,
        tutor_id: assignment.tutor_id,
        subject: assignment.subject?.name || 'General',
        tutor_name: assignment.tutor?.full_name || 'Unknown Tutor',
        student_name: assignment.student?.full_name || 'Unknown Student',
        tutor_email: assignment.tutor?.email,
        student_email: assignment.student?.email,
        status: assignment.status
      }));
      
      console.log('✅ Found assignments for messaging:', transformedAssignments.length, transformedAssignments);
      return transformedAssignments;
      
    } catch (error) {
      console.error('❌ Error fetching assignments for messaging:', error);
      return [];
    }
  },

  // Utility functions
  generateAvatar(name: string): string {
    const words = name.split(' ');
    if (words.length >= 2) {
      return `${words[0][0]}${words[1][0]}`.toUpperCase();
    } else if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    return 'UN';
  },

  getDefaultMessage(participantRole: 'student' | 'tutor', subject?: string): string {
    if (participantRole === 'tutor') {
      return `Feel free to ask any questions about ${subject || 'your studies'}. I'm here to help!`;
    } else {
      return `Thank you for the ${subject || 'lesson'} session. I found it very helpful!`;
    }
  }
};