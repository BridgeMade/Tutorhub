import React from 'react';

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'student' | 'tutor' | 'admin';
  content: string;
  timestamp: string;
  messageType: 'text' | 'image' | 'file' | 'system';
  readAt?: string;
  edited?: boolean;
  editedAt?: string;
}

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar?: boolean;
  showTimestamp?: boolean;
  onImageClick?: (imageUrl: string) => void;
  onFileDownload?: (fileUrl: string, fileName: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
  showAvatar = true,
  showTimestamp = true,
  onImageClick,
  onFileDownload
}) => {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-ZA', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-ZA', { 
        weekday: 'long',
        day: 'numeric',
        month: 'short'
      });
    }
  };

  const getSenderColor = (role: string) => {
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

  // System message rendering
  if (message.messageType === 'system') {
    return (
      <div className="flex justify-center my-4">
        <div className="bg-gray-100 rounded-full px-4 py-2">
          <p className="text-xs text-gray-600 text-center">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex ${isOwn ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2 max-w-xs sm:max-w-md`}>
        {/* Avatar */}
        {showAvatar && !isOwn && (
          <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white font-semibold text-xs">
              {message.senderName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        
        <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
          {/* Sender name (only for received messages) */}
          {!isOwn && showAvatar && (
            <div className="mb-1">
              <span className={`text-xs font-medium ${getSenderColor(message.senderRole)}`}>
                {message.senderName}
              </span>
            </div>
          )}
          
          {/* Message bubble */}
          <div
            className={`relative px-4 py-2 rounded-2xl ${
              isOwn
                ? 'bg-gradient-to-r from-orange-400 to-pink-500 text-white'
                : 'bg-gray-100 text-gray-900'
            } ${
              message.messageType === 'image' ? 'p-1' : ''
            }`}
          >
            {/* Text message */}
            {message.messageType === 'text' && (
              <p className="text-sm leading-relaxed break-words">
                {message.content}
              </p>
            )}
            
            {/* Image message */}
            {message.messageType === 'image' && (
              <div 
                className="cursor-pointer rounded-xl overflow-hidden"
                onClick={() => onImageClick?.(message.content)}
              >
                <img 
                  src={message.content} 
                  alt="Shared image" 
                  className="max-w-full h-auto max-h-64 object-cover"
                />
              </div>
            )}
            
            {/* File message */}
            {message.messageType === 'file' && (
              <div 
                className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => {
                  const fileName = message.content.split('/').pop() || 'file';
                  onFileDownload?.(message.content, fileName);
                }}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  isOwn ? 'bg-white/20' : 'bg-gray-200'
                }`}>
                  <svg className={`w-6 h-6 ${isOwn ? 'text-white' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium truncate ${isOwn ? 'text-white' : 'text-gray-900'}`}>
                    {message.content.split('/').pop()}
                  </p>
                  <p className={`text-xs ${isOwn ? 'text-white/80' : 'text-gray-500'}`}>
                    Tap to download
                  </p>
                </div>
              </div>
            )}
            
            {/* Message tail */}
            <div
              className={`absolute bottom-0 ${
                isOwn ? 'right-0 -mr-1' : 'left-0 -ml-1'
              } w-3 h-3 ${
                isOwn 
                  ? 'bg-gradient-to-r from-orange-400 to-pink-500' 
                  : 'bg-gray-100'
              } transform rotate-45`}
            />
          </div>
          
          {/* Timestamp and read status */}
          {showTimestamp && (
            <div className={`flex items-center space-x-1 mt-1 ${
              isOwn ? 'flex-row-reverse space-x-reverse' : 'flex-row'
            }`}>
              <span className="text-xs text-gray-500">
                {formatTime(message.timestamp)}
              </span>
              
              {/* Edited indicator */}
              {message.edited && (
                <span className="text-xs text-gray-400">• edited</span>
              )}
              
              {/* Read status for own messages */}
              {isOwn && (
                <div className="flex items-center">
                  {message.readAt ? (
                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Own message avatar space */}
        {showAvatar && isOwn && (
          <div className="w-8 h-8 flex-shrink-0" /> // Spacer for alignment
        )}
      </div>
    </div>
  );
};