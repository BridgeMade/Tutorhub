import React, { useState, useEffect } from 'react';
import { MessagesList, ChatView } from '../messaging';
import { messageService, ConversationWithDetails, MessageRecord } from '../../services/messageService';
import { userService } from '../../services/userService';
import { supabase } from '../../lib/supabase';

interface AdminMessagingProps {
  currentUserId: string;
  userName: string;
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'student' | 'tutor' | 'admin';
  content: string;
  timestamp: string;
  messageType: 'text' | 'image' | 'file' | 'system';
  readAt?: string;
  edited?: boolean;
}

interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantRole: 'student' | 'tutor' | 'admin';
  subject?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  avatar: string;
  isOnline: boolean;
}

export const AdminMessaging: React.FC<AdminMessagingProps> = ({
  currentUserId,
  userName
}) => {
  const [view, setView] = useState<'overview' | 'conversation'>('overview');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'student' | 'tutor'>('all');
  const [messageSubscription, setMessageSubscription] = useState<any>(null);
  const [globalMessageSubscription, setGlobalMessageSubscription] = useState<any>(null);

  useEffect(() => {
    loadAllConversations();
    setupGlobalMessageSubscription();
    
    return () => {
      if (messageSubscription) {
        messageSubscription.unsubscribe();
      }
      if (globalMessageSubscription) {
        globalMessageSubscription.unsubscribe();
      }
    };
  }, [currentUserId]);

  const loadAllConversations = async () => {
    setIsLoading(true);
    
    try {
      console.log('🔍 Admin loading all conversations...');
      
      // Get all conversations from database (admin has access to all)
      const { data: allConversations, error } = await supabase
        .from('conversations')
        .select('*')
        .order('last_message_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching conversations:', error);
        setConversations([]);
        return;
      }

      if (!allConversations || allConversations.length === 0) {
        console.log('📭 No conversations found');
        setConversations([]);
        return;
      }

      // Process conversations with participant details
      const processedConversations: Conversation[] = [];

      for (const conv of allConversations) {
        // Get student and tutor profile data
        const [studentProfile, tutorProfile] = await Promise.all([
          userService.getUserProfile(conv.student_id),
          userService.getUserProfile(conv.tutor_id)
        ]);

        const studentName = studentProfile?.full_name || studentProfile?.email || 'Unknown Student';
        const tutorName = tutorProfile?.full_name || tutorProfile?.email || 'Unknown Tutor';

        // Get the last message
        const { data: lastMessage } = await supabase
          .from('messages')
          .select('content, message_type, created_at, sender_id')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // Get total unread count (admin sees all unread messages)
        const { data: unreadResult } = await supabase
          .from('messages')
          .select('id')
          .eq('conversation_id', conv.id)
          .is('read_at', null);

        // Create two conversation entries - one from student perspective, one from tutor perspective
        const conversations = [
          {
            id: conv.id,
            participantId: conv.tutor_id,
            participantName: tutorName,
            participantRole: 'tutor' as const,
            subject: conv.subject || 'General',
            lastMessage: lastMessage?.message_type === 'text' 
              ? lastMessage.content 
              : lastMessage?.message_type === 'image' 
              ? '📷 Image' 
              : lastMessage?.message_type === 'file' 
              ? '📄 File' 
              : 'No messages yet',
            lastMessageTime: lastMessage?.created_at || conv.created_at,
            unreadCount: unreadResult?.length || 0,
            avatar: messageService.generateAvatar(tutorName),
            isOnline: false,
            studentName: studentName, // Add for admin context
            tutorName: tutorName
          },
          {
            id: conv.id,
            participantId: conv.student_id,
            participantName: studentName,
            participantRole: 'student' as const,
            subject: conv.subject || 'General',
            lastMessage: lastMessage?.message_type === 'text' 
              ? lastMessage.content 
              : lastMessage?.message_type === 'image' 
              ? '📷 Image' 
              : lastMessage?.message_type === 'file' 
              ? '📄 File' 
              : 'No messages yet',
            lastMessageTime: lastMessage?.created_at || conv.created_at,
            unreadCount: unreadResult?.length || 0,
            avatar: messageService.generateAvatar(studentName),
            isOnline: false,
            studentName: studentName,
            tutorName: tutorName
          }
        ];

        processedConversations.push(...conversations);
      }

      // Remove duplicates and sort by last message time
      const uniqueConversations = processedConversations
        .filter((conv, index, self) => 
          index === self.findIndex(c => c.id === conv.id && c.participantId === conv.participantId)
        )
        .sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());

      setConversations(uniqueConversations);
      console.log('✅ Admin loaded all conversations:', uniqueConversations.length);
    } catch (error) {
      console.error('❌ Error loading admin conversations:', error);
      setConversations([]);
    }
    
    setIsLoading(false);
  };

  const setupGlobalMessageSubscription = () => {
    const subscription = supabase
      .channel(`admin_global_messages:${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          console.log('🌐 Admin: Global message received:', payload.new);
          // Refresh conversations when any new message arrives
          setTimeout(() => {
            loadAllConversations();
          }, 100);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversations'
        },
        (payload) => {
          console.log('🆕 Admin: New conversation created:', payload.new);
          setTimeout(() => {
            loadAllConversations();
          }, 100);
        }
      )
      .subscribe();

    setGlobalMessageSubscription(subscription);
  };

  const setupMessageSubscription = (conversationId: string) => {
    console.log('🔔 Admin setting up message subscription for conversation:', conversationId);
    
    if (messageSubscription) {
      messageSubscription.unsubscribe();
    }
    
    const subscription = messageService.subscribeToMessages(
      conversationId,
      async (newMessage) => {
        console.log('🆕 Admin: New message received for conversation:', conversationId, newMessage);
        
        // Get sender profile
        const senderProfile = await userService.getUserProfile(newMessage.sender_id);
        const senderName = senderProfile?.full_name || senderProfile?.email || 'Unknown User';
        const senderRole = senderProfile?.role || 'student';
        
        // Add message to chat view
        const formattedMessage: Message = {
          id: newMessage.id,
          senderId: newMessage.sender_id,
          senderName: senderName,
          senderRole: senderRole as 'student' | 'tutor' | 'admin',
          content: newMessage.content,
          timestamp: newMessage.created_at,
          messageType: newMessage.message_type,
          readAt: newMessage.read_at,
          edited: !!newMessage.edited_at
        };
        
        setMessages(prevMessages => {
          const messageExists = prevMessages.some(msg => msg.id === newMessage.id);
          if (messageExists) return prevMessages;
          return [...prevMessages, formattedMessage];
        });
      }
    );
    
    setMessageSubscription(subscription);
  };

  const loadMessages = async (conversationId: string) => {
    setIsLoading(true);
    
    try {
      const messageData = await messageService.getMessages(conversationId, currentUserId);
      
      const formattedMessages: Message[] = [];
      
      for (const msg of messageData) {
        const senderProfile = await userService.getUserProfile(msg.sender_id);
        
        const formattedMessage: Message = {
          id: msg.id,
          senderId: msg.sender_id,
          senderName: senderProfile?.full_name || senderProfile?.email || 'Unknown User',
          senderRole: senderProfile?.role || 'student',
          content: msg.content,
          timestamp: msg.created_at,
          messageType: msg.message_type,
          readAt: msg.read_at,
          edited: false
        };
        
        formattedMessages.push(formattedMessage);
      }
      
      setMessages(formattedMessages);
      console.log('✅ Admin loaded messages:', formattedMessages.length);
    } catch (error) {
      console.error('❌ Error loading messages:', error);
      setMessages([]);
    }
    
    setIsLoading(false);
  };

  const handleConversationSelect = (conversation: Conversation) => {
    console.log('📋 Admin selecting conversation:', conversation.id);
    
    if (messageSubscription) {
      messageSubscription.unsubscribe();
      setMessageSubscription(null);
    }
    
    setSelectedConversation(conversation);
    setView('conversation');
    loadMessages(conversation.id);
    
    setTimeout(() => {
      setupMessageSubscription(conversation.id);
    }, 100);
  };

  const handleSendMessage = async (content: string, type: 'text' | 'image' | 'file') => {
    if (!selectedConversation) return;

    try {
      const sentMessage = await messageService.sendMessage(
        selectedConversation.id,
        currentUserId,
        content,
        type
      );

      if (sentMessage) {
        const newMessage: Message = {
          id: sentMessage.id,
          senderId: currentUserId,
          senderName: userName,
          senderRole: 'admin',
          content,
          timestamp: sentMessage.created_at,
          messageType: type
        };

        setMessages(prev => [...prev, newMessage]);
        console.log('✅ Admin message sent successfully:', newMessage);
      }
    } catch (error) {
      console.error('❌ Error sending admin message:', error);
    }
  };

  const handleBack = () => {
    if (messageSubscription) {
      messageSubscription.unsubscribe();
      setMessageSubscription(null);
    }
    
    setView('overview');
    setSelectedConversation(null);
    setMessages([]);
    loadAllConversations();
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.participantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (conv as any).studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (conv as any).tutorName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = filterRole === 'all' || conv.participantRole === filterRole;
    
    return matchesSearch && matchesRole;
  });

  if (view === 'conversation' && selectedConversation) {
    return (
      <div className="h-full">
        <ChatView
          conversation={selectedConversation}
          messages={messages}
          currentUserId={currentUserId}
          onSendMessage={handleSendMessage}
          onBack={handleBack}
          isLoading={isLoading}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Admin Messaging Center</h1>
        <p className="text-purple-100">
          Monitor and manage all platform conversations
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search conversations, users, or messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
          
          <div className="flex items-center space-x-4">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as 'all' | 'student' | 'tutor')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="all">All Users</option>
              <option value="student">Students</option>
              <option value="tutor">Tutors</option>
            </select>
            
            <button
              onClick={loadAllConversations}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{Math.floor(conversations.length / 2)}</p>
              <p className="text-sm text-gray-600">Total Conversations</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {conversations.reduce((total, conv) => total + conv.unreadCount, 0)}
              </p>
              <p className="text-sm text-gray-600">Unread Messages</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {conversations.filter(conv => conv.participantRole === 'student').length}
              </p>
              <p className="text-sm text-gray-600">Student Conversations</p>
            </div>
          </div>
        </div>
      </div>

      {/* Conversations List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">All Conversations</h2>
          <p className="text-sm text-gray-600 mt-1">
            Showing {filteredConversations.length} conversations
          </p>
        </div>
        
        <div className="divide-y divide-gray-100">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-gray-500">No conversations found</p>
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <div
                key={`${conversation.id}-${conversation.participantId}`}
                className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => handleConversationSelect(conversation)}
              >
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {conversation.avatar}
                      </span>
                    </div>
                    {conversation.unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-semibold">
                          {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {conversation.participantName}
                      </h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        conversation.participantRole === 'student' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {conversation.participantRole}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2 mt-1">
                      <p className="text-sm text-gray-600 truncate flex-1">
                        {conversation.lastMessage}
                      </p>
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        {new Date(conversation.lastMessageTime).toLocaleDateString()}
                      </span>
                    </div>
                    
                    {(conversation as any).studentName && (conversation as any).tutorName && (
                      <p className="text-xs text-gray-500 mt-1">
                        {(conversation as any).studentName} ↔ {(conversation as any).tutorName}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};