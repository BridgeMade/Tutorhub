import React from 'react';
import { Tutor, TutoringSession, DashboardStats } from '../../types';
import { ComprehensiveTutorDashboard } from './comprehensive/ComprehensiveTutorDashboard';

interface TutorDashboardContentProps {
  tutor: Tutor;
  upcomingSessions: TutoringSession[];
  stats: DashboardStats;
  activeTab?: string;
}

export const TutorDashboardContent: React.FC<TutorDashboardContentProps> = ({
  tutor,
  upcomingSessions,
  stats,
  activeTab
}) => {
  return (
    <ComprehensiveTutorDashboard
      tutor={tutor}
      upcomingSessions={upcomingSessions}
      stats={stats}
      activeTab={activeTab}
    />
  );
};