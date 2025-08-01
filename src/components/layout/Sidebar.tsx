import React from 'react';
import { useAuthContext } from '../../contexts/AuthContext';
import { NotificationCenter } from '../notifications/NotificationCenter';

interface SidebarProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  userRole: 'student' | 'tutor' | 'admin';
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab = 'dashboard', onTabChange, userRole }) => {
  const { user, signOut } = useAuthContext();

  const navigationItems = {
    student: [
      { id: 'dashboard', label: 'Dashboard', icon: 'home' },
      { id: 'sessions', label: 'Sessions', icon: 'book' },
      { id: 'resources', label: 'Resources', icon: 'folder' },
      { id: 'progress', label: 'Progress', icon: 'chart' },
      { id: 'performance', label: 'Performance', icon: 'analytics' },
      { id: 'planner', label: 'Study Planner', icon: 'calendar' },
      { id: 'profile', label: 'Settings', icon: 'settings' }
    ],
    tutor: [
      { id: 'dashboard', label: 'Overview', icon: 'home' },
      { id: 'students', label: 'Students', icon: 'users' },
      { id: 'schedule', label: 'Schedule', icon: 'calendar' },
      { id: 'earnings', label: 'Earnings', icon: 'dollar' },
      { id: 'performance', label: 'Performance', icon: 'chart' },
      { id: 'resources', label: 'Resources', icon: 'book' },
      { id: 'settings', label: 'Settings', icon: 'settings' }
    ],
    admin: [
      { id: 'dashboard', label: 'Dashboard', icon: 'home' },
      { id: 'users', label: 'Users', icon: 'users' },
      { id: 'payments', label: 'Payments', icon: 'credit-card' },
      { id: 'analytics', label: 'Analytics', icon: 'chart' },
      { id: 'settings', label: 'Settings', icon: 'settings' }
    ]
  };

  const navItems = navigationItems[userRole] || navigationItems.student;

  const handleTabClick = (tabId: string) => {
    if (onTabChange) {
      onTabChange(tabId);
    }
  };

  const renderIcon = (iconName: string, isActive: boolean) => {
    const iconClass = `w-5 h-5 ${isActive ? 'text-orange-600' : 'text-gray-500'}`;
    
    switch (iconName) {
      case 'home':
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
          </svg>
        );
      case 'book':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
          </svg>
        );
      case 'users':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
          </svg>
        );
      case 'chart':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
          </svg>
        );
      case 'settings':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
        );
      case 'calendar':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
        );
      case 'dollar':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
          </svg>
        );
      case 'credit-card':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
          </svg>
        );
      case 'folder':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
          </svg>
        );
      case 'analytics':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
          </svg>
        );
      case 'logout':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
          </svg>
        );
      default:
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        );
    }
  };

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 shadow-sm z-40">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-pink-400 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-lg">
                {user?.user_metadata?.full_name?.charAt(0) || 'U'}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">
                {user?.user_metadata?.full_name || 'User'}
              </h3>
              <p className="text-xs text-gray-500 capitalize">{userRole}</p>
            </div>
          </div>
          
          {/* Notification Center */}
          <NotificationCenter />
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-6">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleTabClick(item.id)}
            className={`w-full flex items-center space-x-3 px-6 py-3 text-left transition-all duration-200 ${
              activeTab === item.id
                ? 'bg-gradient-to-r from-orange-50 to-pink-50 border-r-3 border-orange-400 text-orange-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            {renderIcon(item.icon, activeTab === item.id)}
            <span className={`font-medium ${
              activeTab === item.id ? 'text-orange-700' : 'text-gray-700'
            }`}>
              {item.label}
            </span>
          </button>
        ))}
      </nav>

      {/* Logout Button */}
      <div className="absolute bottom-6 left-0 right-0 px-6">
        <button
          onClick={() => signOut()}
          className="w-full flex items-center space-x-3 px-6 py-3 text-left transition-all duration-200 text-gray-600 hover:bg-red-50 hover:text-red-700 rounded-lg group"
        >
          {renderIcon('logout', false)}
          <span className="font-medium text-gray-700 group-hover:text-red-700">
            Sign Out
          </span>
        </button>
      </div>

    </div>
  );
};