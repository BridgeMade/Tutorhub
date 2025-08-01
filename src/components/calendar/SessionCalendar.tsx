import React from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { TutoringSession } from '../../types';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
  'en-US': require('date-fns/locale/en-US'),
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface SessionCalendarProps {
  sessions: TutoringSession[];
  onSelectSession?: (session: TutoringSession) => void;
  onSelectSlot?: (slotInfo: any) => void;
}

export const SessionCalendar: React.FC<SessionCalendarProps> = ({
  sessions,
  onSelectSession,
  onSelectSlot
}) => {
  const events = sessions.map(session => ({
    id: session.id,
    title: `${session.subject} - ${session.status}`,
    start: new Date(session.scheduledAt),
    end: new Date(new Date(session.scheduledAt).getTime() + session.duration * 60000),
    resource: session,
  }));

  const eventStyleGetter = (event: any) => {
    const session = event.resource as TutoringSession;
    let backgroundColor = '#3174ad';
    
    switch (session.status) {
      case 'scheduled':
        backgroundColor = '#3b82f6';
        break;
      case 'confirmed':
        backgroundColor = '#10b981';
        break;
      case 'completed':
        backgroundColor = '#6b7280';
        break;
      case 'cancelled':
        backgroundColor = '#ef4444';
        break;
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block',
      },
    };
  };

  const handleSelectEvent = (event: any) => {
    if (onSelectSession) {
      onSelectSession(event.resource);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Session Calendar</h2>
      <div className="h-96">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          onSelectEvent={handleSelectEvent}
          onSelectSlot={onSelectSlot}
          selectable
          eventPropGetter={eventStyleGetter}
          views={['month', 'week', 'day']}
          defaultView="week"
          step={30}
          timeslots={2}
        />
      </div>
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
          <span>Scheduled</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
          <span>In Progress</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-gray-500 rounded mr-2"></div>
          <span>Completed</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-red-500 rounded mr-2"></div>
          <span>Cancelled</span>
        </div>
      </div>
    </div>
  );
};