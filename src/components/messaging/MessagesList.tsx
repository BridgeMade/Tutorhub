import React from 'react';

export interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantRole: 'student' | 'tutor' | 'admin';
  subject?: string;
  grade?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  avatar: string;
  isOnline?: boolean;
}

interface MessagesListProps {
  conversations: Conversation[];
  onConversationSelect: (conversation: Conversation) => void;
  currentUserId: string;
  userRole: 'student' | 'tutor' | 'admin';
}

export const MessagesList: React.FC<MessagesListProps> = ({
  conversations,
  onConversationSelect,
  currentUserId,
  userRole
}) => {
  const formatTime = (timeString: string) => {
    const now = new Date();
    const messageTime = new Date(timeString);
    const diffInHours = Math.abs(now.getTime() - messageTime.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return messageTime.toLocaleTimeString('en-ZA', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    } else if (diffInHours < 168) { // 7 days
      return messageTime.toLocaleDateString('en-ZA', { weekday: 'short' });
    } else {
      return messageTime.toLocaleDateString('en-ZA', { 
        day: '2-digit', 
        month: '2-digit' 
      });
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'student':
        return 'text-blue-600';
      case 'tutor':
        return 'text-green-600';
      case 'admin':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };

  if (conversations.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No conversations yet</h3>
        <p className="text-gray-600 mb-4">
          {userRole === 'student' 
            ? 'Start a conversation with your tutors to get help with your studies.'
            : userRole === 'tutor'
            ? 'Your students will appear here when they message you.'
            : 'Conversations between users will appear here.'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900">
          {userRole === 'student' ? 'Your Tutors' : 
           userRole === 'tutor' ? 'Your Students' : 
           'Conversations'}
        </h2>
      </div>
      
      <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
        {conversations.map((conversation) => (
          <div 
            key={conversation.id} 
            className="p-4 hover:bg-gray-50 transition-colors cursor-pointer active:bg-gray-100"
            onClick={() => onConversationSelect(conversation)}
          >
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {conversation.avatar}
                  </span>
                </div>
                {/* Online indicator */}
                {conversation.isOnline && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                )}
                {/* Unread indicator */}
                {conversation.unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">
                      {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className={`text-sm font-medium ${
                    conversation.unreadCount > 0 ? 'text-gray-900' : 'text-gray-700'
                  }`}>
                    {conversation.participantName}
                  </p>
                  <span className="text-xs text-gray-500">
                    {formatTime(conversation.lastMessageTime)}
                  </span>
                </div>
                
                {/* Role and subject info */}
                <div className="flex items-center space-x-2 mb-1">
                  <span className={`text-xs font-medium ${getRoleColor(conversation.participantRole)} capitalize`}>
                    {conversation.participantRole}
                  </span>
                  {conversation.subject && (
                    <>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500">{conversation.subject}</span>
                    </>
                  )}
                  {conversation.grade && (
                    <>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500">{conversation.grade}</span>
                    </>
                  )}
                </div>
                
                <p className={`text-sm ${
                  conversation.unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-600'
                } truncate`}>
                  {conversation.lastMessage}
                </p>
              </div>
              
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};