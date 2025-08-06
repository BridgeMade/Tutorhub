import React, { useState, useEffect } from 'react';
import { MessagesList, ChatView, Conversation, Message } from './index';
import { messageService, ConversationWithDetails, MessageRecord } from '../../services/messageService';
import { userService } from '../../services/userService';
import { supabase } from '../../lib/supabase';

interface MobileMessagingProps {
  currentUserId: string;
  userRole: 'student' | 'tutor' | 'admin';
  userName: string;
}

export const MobileMessaging: React.FC<MobileMessagingProps> = ({
  currentUserId,
  userRole,
  userName
}) => {
  const [view, setView] = useState<'list' | 'chat'>('list');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [messageSubscription, setMessageSubscription] = useState<any>(null);
  const [conversationSubscription, setConversationSubscription] = useState<any>(null);
  const [globalMessageSubscription, setGlobalMessageSubscription] = useState<any>(null);
  const [showFindUsersModal, setShowFindUsersModal] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Load real data from API based on user's tutoring relationships
  useEffect(() => {
    loadConversations();
    setupConversationSubscription();
    setupGlobalMessageSubscription();
    
    // Cleanup subscriptions on unmount
    return () => {
      if (messageSubscription) {
        messageSubscription.unsubscribe();
      }
      if (conversationSubscription) {
        conversationSubscription.unsubscribe();
      }
      if (globalMessageSubscription) {
        globalMessageSubscription.unsubscribe();
      }
    };
  }, [currentUserId, userRole]);

  // Separate useEffect for window focus handling that depends on view state
  useEffect(() => {
    const handleWindowFocus = () => {
      // Only refresh conversations if we're not in chat view to avoid disrupting active conversations
      if (view !== 'chat') {
        console.log('🔍 Window focused, refreshing conversations...');
        loadConversations();
      }
    };
    
    const handleVisibilityChange = () => {
      if (!document.hidden && view !== 'chat') {
        console.log('👁️ Tab visible, refreshing conversations...');
        loadConversations();
      }
    };
    
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [view]);

  // Setup real-time subscription for conversation updates
  const setupConversationSubscription = () => {
    const subscription = messageService.subscribeToConversations(
      currentUserId,
      userRole as 'student' | 'tutor',
      () => {
        console.log('🔄 Conversation updated, reloading...');
        loadConversations();
      }
    );
    setConversationSubscription(subscription);
  };

  // Setup global message subscription to catch messages from new conversations
  const setupGlobalMessageSubscription = () => {
    const subscription = messageService.subscribeToGlobalMessages(
      currentUserId,
      () => {
        console.log('🌐 Global message update, refreshing conversations...');
        // Single refresh - let real-time subscriptions handle the rest
        loadConversations();
      }
    );
    setGlobalMessageSubscription(subscription);
  };

  // Setup message subscription to refresh conversations when new messages arrive
  const setupMessageSubscription = (conversationId: string) => {
    console.log('🔔 Setting up message subscription for conversation:', conversationId);
    if (messageSubscription) {
      console.log('🔄 Unsubscribing from previous message subscription');
      messageSubscription.unsubscribe();
    }
    
    const subscription = messageService.subscribeToMessages(
      conversationId,
      async (newMessage) => {
        console.log('🆕 New message received for conversation:', conversationId, newMessage);
        console.log('🔍 Message sender:', newMessage.sender_id, 'Current user:', currentUserId);
        
        // Get the sender profile to determine correct name and role
        let senderName = 'Unknown User';
        let senderRole: 'student' | 'tutor' | 'admin' = 'student';
        
        try {
          const senderProfile = await userService.getUserProfile(newMessage.sender_id);
          senderName = senderProfile?.full_name || senderProfile?.email || 'Unknown User';
          
          // Get the actual role from the sender's profile for more accurate role determination
          if (senderProfile?.role) {
            senderRole = senderProfile.role as 'student' | 'tutor' | 'admin';
          } else {
            // Fallback: Determine sender role based on who they are relative to current user
            if (newMessage.sender_id === currentUserId) {
              senderRole = userRole;
            } else {
              senderRole = userRole === 'student' ? 'tutor' : 'student';
            }
          }
        } catch (error) {
          console.error('❌ Error getting sender profile:', error);
          // Fallback role determination
          senderRole = newMessage.sender_id === currentUserId ? userRole : (userRole === 'student' ? 'tutor' : 'student');
        }
        
        // Use current state instead of stale closure
        setSelectedConversation(currentSelectedConversation => {
          console.log('🔍 Current selected conversation (from state):', currentSelectedConversation?.id);
          
          // Add message to current conversation instantly if it's for this conversation
          if (currentSelectedConversation && currentSelectedConversation.id === conversationId) {
            console.log('✅ Message is for current conversation, processing...');
            
            // Process all new messages (both from self and others) to ensure delivery
            console.log('✅ Processing new message for chat view...');
            
            const formattedMessage: Message = {
              id: newMessage.id,
              senderId: newMessage.sender_id,
              senderName: senderName,
              senderRole: senderRole,
              content: newMessage.content,
              timestamp: newMessage.created_at,
              messageType: newMessage.message_type,
              readAt: newMessage.read_at,
              edited: !!newMessage.edited_at
            };
            
            console.log('📨 About to add formatted message to chat view:', formattedMessage);
            console.log('🔍 Message is from other user:', newMessage.sender_id !== currentUserId);
            
            // Force state update with functional update to ensure it happens
            setMessages(prevMessages => {
              console.log('🔍 Previous messages count:', prevMessages.length);
              const messageExists = prevMessages.some(msg => msg.id === newMessage.id);
              if (messageExists) {
                console.log('⚠️ Message already exists, skipping');
                return prevMessages;
              }
              
              // Only add messages from other users in real-time (own messages are added when sending)
              if (newMessage.sender_id !== currentUserId) {
                console.log('✅ Adding message from other user to chat, new count will be:', prevMessages.length + 1);
                const updatedMessages = [...prevMessages, formattedMessage];
                console.log('🎯 Updated messages array:', updatedMessages);
                return updatedMessages;
              } else {
                console.log('⚠️ Skipping own message to avoid duplicate (already added when sending)');
                return prevMessages;
              }
            });
          } else {
            console.log('⚠️ Message not for current conversation or no conversation selected');
            console.log('🔍 Conversation ID match:', currentSelectedConversation?.id === conversationId);
            console.log('🔍 Selected conversation exists:', !!currentSelectedConversation);
          }
          
          // Return the same conversation (no change to selectedConversation state)
          return currentSelectedConversation;
        });
        
        // Update conversation list with new last message (minimal refresh)
        setConversations(prev =>
          prev.map(conv =>
            conv.id === conversationId
              ? {
                  ...conv,
                  lastMessage: newMessage.message_type === 'text' 
                    ? newMessage.content 
                    : newMessage.message_type === 'image' 
                    ? '📷 Image' 
                    : '📄 File',
                  lastMessageTime: newMessage.created_at,
                  unreadCount: newMessage.sender_id !== currentUserId ? conv.unreadCount + 1 : conv.unreadCount
                }
              : conv
          )
        );
      }
    );
    setMessageSubscription(subscription);
    console.log('✅ Message subscription active for conversation:', conversationId);
  };

  const loadConversations = async () => {
    setIsLoading(true);
    
    try {
      // Get conversations based on user's tutoring relationships
      const conversationData = await messageService.getConversations(currentUserId, userRole);
      
      // The ConversationWithDetails interface now matches Conversation interface
      setConversations(conversationData);
      console.log('✅ Loaded conversations:', conversationData);
    } catch (error) {
      console.error('❌ Error loading conversations:', error);
      setConversations([]);
    }
    
    setIsLoading(false);
  };

  const loadMessages = async (conversationId: string) => {
    setIsLoading(true);
    
    try {
      // Get messages from the messageService
      const messageData = await messageService.getMessages(conversationId, currentUserId);
      
      // Convert to the format expected by ChatView component
      const formattedMessages: Message[] = [];
      
      for (const msg of messageData) {
        // Get sender information
        const senderProfile = await userService.getUserProfile(msg.sender_id);
        
        const formattedMessage: Message = {
          id: msg.id,
          senderId: msg.sender_id,
          senderName: senderProfile?.full_name || 'Unknown User',
          senderRole: msg.sender_id === currentUserId ? userRole : 
                     (userRole === 'student' ? 'tutor' : 'student'),
          content: msg.content,
          timestamp: msg.created_at,
          messageType: msg.message_type,
          readAt: msg.read_at,
          edited: false
        };
        
        formattedMessages.push(formattedMessage);
      }
      
      setMessages(formattedMessages);
      console.log('✅ Loaded messages:', formattedMessages);
    } catch (error) {
      console.error('❌ Error loading messages:', error);
      setMessages([]);
    }
    
    setIsLoading(false);
  };

  const handleConversationSelect = (conversation: Conversation) => {
    console.log('📋 Selecting conversation:', conversation.id, conversation.participantName);
    
    // Cleanup previous subscription first
    if (messageSubscription) {
      console.log('🧹 Cleaning up previous message subscription');
      messageSubscription.unsubscribe();
      setMessageSubscription(null);
    }
    
    setSelectedConversation(conversation);
    setView('chat');
    loadMessages(conversation.id);
    
    // Setup real-time subscription for this conversation AFTER setting the selected conversation
    // Use setTimeout to ensure the state has been updated
    setTimeout(() => {
      console.log('🔔 Setting up message subscription after conversation selection');
      setupMessageSubscription(conversation.id);
    }, 50); // Reduced delay for faster real-time response
    
    // Mark conversation as read
    setConversations(prev => 
      prev.map(conv => 
        conv.id === conversation.id 
          ? { ...conv, unreadCount: 0 }
          : conv
      )
    );
  };

  const handleSendMessage = async (content: string, type: 'text' | 'image' | 'file') => {
    if (!selectedConversation) return;

    try {
      // Send message through messageService
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
          senderRole: userRole,
          content,
          timestamp: sentMessage.created_at,
          messageType: type
        };

        setMessages(prev => [...prev, newMessage]);
        
        // Update conversation's last message
        setConversations(prev =>
          prev.map(conv =>
            conv.id === selectedConversation.id
              ? {
                  ...conv,
                  lastMessage: type === 'text' ? content : `${type === 'image' ? '📷 Image' : '📄 File'}`,
                  lastMessageTime: newMessage.timestamp
                }
              : conv
          )
        );

        console.log('✅ Message sent successfully:', newMessage);
        
        // Real-time subscriptions will handle conversation updates automatically
      }
    } catch (error) {
      console.error('❌ Error sending message:', error);
      // Could show an error toast here
    }
  };

  const handleBack = () => {
    console.log('⬅️ Navigating back to conversation list');
    
    // Cleanup message subscription when leaving chat
    if (messageSubscription) {
      console.log('🧹 Cleaning up message subscription on back navigation');
      messageSubscription.unsubscribe();
      setMessageSubscription(null);
    }
    
    setView('list');
    setSelectedConversation(null);
    setMessages([]);
    
    // Refresh conversations to ensure latest data
    console.log('🔄 Refreshing conversations after back navigation');
    loadConversations();
  };

  const handleTyping = (isTyping: boolean) => {
    // In a real app, this would send typing status to other users
    console.log('User typing:', isTyping);
  };

  // Handle Find Tutors/Students button
  const handleFindUsers = async () => {
    setShowFindUsersModal(true);
    setIsLoading(true);
    
    try {
      // Get all users with the opposite role
      const targetRole = userRole === 'student' ? 'tutor' : 'student';
      
      const { data: users, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('role', targetRole)
        .neq('id', currentUserId);

      if (error) {
        console.error('Error fetching users:', error);
        setAvailableUsers([]);
      } else {
        setAvailableUsers(users || []);
      }
    } catch (error) {
      console.error('Error in handleFindUsers:', error);
      setAvailableUsers([]);
    }
    
    setIsLoading(false);
  };

  // Handle New Chat button
  const handleNewChat = () => {
    setShowNewChatModal(true);
    // For now, just show existing conversations
    // In the future, this could show a contact picker
  };

  // Start conversation with a user
  const handleStartConversation = async (targetUserId: string, targetUserName: string) => {
    try {
      setIsLoading(true);
      
      // Determine student and tutor IDs
      const studentId = userRole === 'student' ? currentUserId : targetUserId;
      const tutorId = userRole === 'tutor' ? currentUserId : targetUserId;
      
      // Create conversation using the database function
      const { data: conversationId, error } = await supabase
        .rpc('create_conversation_if_not_exists', {
          p_student_id: studentId,
          p_tutor_id: tutorId,
          p_subject: 'General'
        });

      if (error) {
        console.error('Error creating conversation:', error);
        return;
      }

      // Create initial system message
      await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: currentUserId,
          content: `Hi ${targetUserName}! I'd like to start a conversation.`,
          message_type: 'text'
        });

      // Close modals
      setShowFindUsersModal(false);
      setShowNewChatModal(false);
      
      // Create the conversation object manually to immediately navigate to it
      const newConversation: Conversation = {
        id: conversationId,
        participantId: targetUserId,
        participantName: targetUserName,
        participantRole: userRole === 'student' ? 'tutor' : 'student',
        subject: 'General',
        lastMessage: `Hi ${targetUserName}! I'd like to start a conversation.`,
        lastMessageTime: new Date().toISOString(),
        unreadCount: 0,
        avatar: messageService.generateAvatar(targetUserName),
        isOnline: false
      };

      // Navigate to the new conversation immediately
      setSelectedConversation(newConversation);
      setView('chat');
      
      // Load messages for the new conversation
      await loadMessages(conversationId);
      
      // Setup real-time subscription for the new conversation
      setupMessageSubscription(conversationId);
      
      // Reload conversations in background to update the list
      loadConversations();
      
    } catch (error) {
      console.error('Error starting conversation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (view === 'chat' && selectedConversation) {
    return (
      <div className="fixed inset-0 bg-white z-50">
        <ChatView
          conversation={selectedConversation}
          messages={messages}
          currentUserId={currentUserId}
          onSendMessage={handleSendMessage}
          onBack={handleBack}
          onTyping={handleTyping}
          isLoading={isLoading}
          typingUsers={typingUsers}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-400 to-emerald-500 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Messages</h1>
        <p className="text-green-100">
          {userRole === 'student' 
            ? 'Chat with your tutors and get help'
            : userRole === 'tutor'
            ? 'Communicate with your students'
            : 'Manage user communications'
          }
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={handleFindUsers}
          className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col items-center space-y-2 hover:shadow-md transition-shadow active:scale-95"
        >
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          </div>
          <span className="text-sm font-medium text-gray-700">
            {userRole === 'student' ? 'Find Tutors' : 'Find Students'}
          </span>
        </button>
        <button 
          onClick={handleNewChat}
          className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col items-center space-y-2 hover:shadow-md transition-shadow active:scale-95"
        >
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2v-6a2 2 0 012-2h8z" />
            </svg>
          </div>
          <span className="text-sm font-medium text-gray-700">New Chat</span>
        </button>
      </div>

      {/* Messages List */}
      <MessagesList
        conversations={conversations}
        onConversationSelect={handleConversationSelect}
        currentUserId={currentUserId}
        userRole={userRole}
      />

      {/* Quick Stats (for tutors) */}
      {userRole === 'tutor' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{conversations.length}</p>
                <p className="text-sm text-gray-600">Active Chats</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {conversations.reduce((total, conv) => total + conv.unreadCount, 0)}
                </p>
                <p className="text-sm text-gray-600">Unread</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Find Users Modal */}
      {showFindUsersModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-96 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {userRole === 'student' ? 'Find Tutors' : 'Find Students'}
                </h3>
                <button
                  onClick={() => setShowFindUsersModal(false)}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Search Input */}
              <div className="mt-4">
                <input
                  type="text"
                  placeholder={`Search ${userRole === 'student' ? 'tutors' : 'students'}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>
            
            <div className="max-h-64 overflow-y-auto">
              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                </div>
              ) : availableUsers.filter(user => 
                user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.email?.toLowerCase().includes(searchQuery.toLowerCase())
              ).length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-500">No {userRole === 'student' ? 'tutors' : 'students'} found</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {availableUsers
                    .filter(user => 
                      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      user.email?.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((user) => (
                      <div key={user.id} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                              {messageService.generateAvatar(user.full_name || user.email || 'User')}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {user.full_name || 'Unknown User'}
                            </p>
                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                          </div>
                          <button
                            onClick={() => handleStartConversation(user.id, user.full_name || user.email)}
                            className="bg-gradient-to-r from-orange-400 to-pink-500 text-white px-3 py-1 rounded-full text-xs hover:shadow-md transition-shadow"
                          >
                            Chat
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">New Chat</h3>
                <button
                  onClick={() => setShowNewChatModal(false)}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2v-6a2 2 0 012-2h8z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Start a New Chat</h4>
              <p className="text-gray-600 mb-6">
                Use "Find {userRole === 'student' ? 'Tutors' : 'Students'}" to discover new people to chat with, or select an existing conversation from your list.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setShowNewChatModal(false);
                    handleFindUsers();
                  }}
                  className="w-full bg-gradient-to-r from-orange-400 to-pink-500 text-white py-2 px-4 rounded-lg font-medium hover:shadow-md transition-shadow"
                >
                  Find {userRole === 'student' ? 'Tutors' : 'Students'}
                </button>
                <button
                  onClick={() => setShowNewChatModal(false)}
                  className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};