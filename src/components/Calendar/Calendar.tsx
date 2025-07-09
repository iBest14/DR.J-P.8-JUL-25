// src/components/calendar/Calendar.tsx
import React, { useState, useEffect } from 'react';
import { CalendarHeader } from './CalendarHeader';
import { YearView } from './views/YearView';
import { MonthView } from './views/MonthView';
import { WeekView } from './views/WeekView';
import { DayView } from './views/DayView';
import { CalendarEvent, CalendarView, CalendarSettings } from '@/types/calendar';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PaymentPromiseSync } from './PaymentPromiseSync';
import { AddEventDialog } from './dialogs/AddEventDialog';
import { EventDetailDialog } from './dialogs/EventDetailDialog';
import { CalendarDndProvider } from './providers/CalendarDndProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface CalendarProps {
  clients?: any[]; // Your client type
  className?: string;
}

export const Calendar: React.FC<CalendarProps> = ({ 
  clients = [],
  className 
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>('year');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [showEventDetail, setShowEventDetail] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Settings state
  const [settings, setSettings] = useState<CalendarSettings>({
    use24HourFormat: true,
    useDotBadge: false,
    darkMode: false,
    defaultView: 'year',
    agendaGroupBy: 'date'
  });

  // Load events from Firebase
  useEffect(() => {
    const eventsQuery = query(
      collection(db, 'calendarEvents'),
      orderBy('date', 'asc')
    );

    const unsubscribe = onSnapshot(eventsQuery, (snapshot) => {
      const eventsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as CalendarEvent));
      
      setEvents(eventsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Apply dark mode
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.darkMode]);

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    
    // If in year view, switch to month view
    if (view === 'year') {
      setCurrentDate(date);
      setView('month');
    }
  };

  const handleTimeSlotClick = (date: Date, time: string) => {
    setSelectedDate(date);
    setShowAddEvent(true);
    // The AddEventDialog will use the defaultDate and defaultTime
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowEventDetail(true);
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowEventDetail(false);
    setShowAddEvent(true);
  };

  const handleViewChange = (newView: CalendarView) => {
    setView(newView);
  };

  const handleAddEvent = () => {
    setSelectedEvent(null);
    setShowAddEvent(true);
  };

  const toggleSetting = (key: keyof CalendarSettings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const renderView = () => {
    const viewProps = {
      currentDate,
      events,
      onDateClick: handleDateClick,
      onTimeSlotClick: handleTimeSlotClick,
      onEventClick: handleEventClick,
      selectedDate,
      settings
    };

    switch (view) {
      case 'year':
        return <YearView {...viewProps} useDotBadge={settings.useDotBadge} />;
      case 'month':
        return <MonthView {...viewProps} />;
      case 'week':
        return <WeekView {...viewProps} />;
      case 'day':
        return <DayView {...viewProps} />;
      default:
        return <YearView {...viewProps} useDotBadge={settings.useDotBadge} />;
    }
  };

  if (loading) {
    return <CalendarSkeleton />;
  }

  return (
    <CalendarDndProvider onEventUpdate={() => {}}>
      <div className={cn("h-full flex flex-col bg-background calendar-container", className)}>
        {/* Payment Promise Sync Component */}
        {clients.length > 0 && (
          <div className="px-6 pt-4">
            <PaymentPromiseSync clients={clients} />
          </div>
        )}

        {/* Calendar Header */}
        <CalendarHeader
          currentDate={currentDate}
          view={view}
          onViewChange={handleViewChange}
          onDateChange={setCurrentDate}
          onAddEvent={handleAddEvent}
          use24HourFormat={settings.use24HourFormat}
          onToggle24Hour={() => toggleSetting('use24HourFormat')}
          useDotBadge={settings.useDotBadge}
          onToggleDotBadge={() => toggleSetting('useDotBadge')}
          darkMode={settings.darkMode}
          onToggleDarkMode={() => toggleSetting('darkMode')}
        />

        {/* Calendar View */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Add/Edit Event Dialog */}
        <AddEventDialog
          open={showAddEvent}
          onClose={() => {
            setShowAddEvent(false);
            setSelectedEvent(null);
          }}
          event={selectedEvent}
          defaultDate={selectedDate}
        />

        {/* Event Detail Dialog */}
        <EventDetailDialog
          open={showEventDetail}
          onClose={() => {
            setShowEventDetail(false);
            setSelectedEvent(null);
          }}
          event={selectedEvent}
          onEdit={handleEditEvent}
        />
      </div>
    </CalendarDndProvider>
  );
};

// Loading skeleton
const CalendarSkeleton: React.FC = () => {
  return (
    <div className="h-full flex flex-col bg-background p-6">
      <Skeleton className="h-12 w-full mb-4" />
      <div className="grid grid-cols-3 gap-4 flex-1">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="h-64" />
        ))}
      </div>
    </div>
  );
};