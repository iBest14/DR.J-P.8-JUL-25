// src/components/calendar/views/DayView.tsx
import React, { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { CalendarEvent, EVENT_COLORS } from '@/types/calendar';
import { format, isToday, isSameDay } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, User, MapPin } from 'lucide-react';

interface DayViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onTimeSlotClick?: (date: Date, time: string) => void;
  onEventClick?: (event: CalendarEvent) => void;
  settings?: {
    use24HourFormat: boolean;
  };
}

export const DayView: React.FC<DayViewProps> = ({
  currentDate,
  events,
  onTimeSlotClick,
  onEventClick,
  settings = { use24HourFormat: true }
}) => {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Scroll to current hour on mount
  useEffect(() => {
    if (scrollContainerRef.current && isToday(currentDate)) {
      const hourHeight = 60;
      const currentHour = new Date().getHours();
      scrollContainerRef.current.scrollTop = (currentHour - 2) * hourHeight;
    }
  }, [currentDate]);

  const formatHour = (hour: number) => {
    if (settings.use24HourFormat) {
      return `${hour.toString().padStart(2, '0')}:00`;
    }
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:00 ${period}`;
  };

  const getDayEvents = (): CalendarEvent[] => {
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    return events
      .filter(event => event.date === dateStr)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const calculateEventPosition = (event: CalendarEvent) => {
    const [startHour, startMinute] = event.startTime.split(':').map(Number);
    const [endHour, endMinute] = event.endTime.split(':').map(Number);
    
    const top = (startHour * 60 + startMinute) * (60 / 60);
    const height = ((endHour * 60 + endMinute) - (startHour * 60 + startMinute)) * (60 / 60);
    
    return { top, height };
  };

  const dayEvents = getDayEvents();
  const currentTimePosition = (currentTime.getHours() * 60 + currentTime.getMinutes()) * (60 / 60);

  // "Happening now" section
  const happeningNow = dayEvents.filter(event => {
    const now = format(currentTime, 'HH:mm');
    return event.startTime <= now && event.endTime > now;
  });

  return (
    <div className="h-full flex bg-gray-50 dark:bg-gray-900">
      {/* Main timeline view */}
      <div className="flex-1 flex flex-col">
        {/* Day header */}
        <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-6 py-4">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            {format(currentDate, 'EEEE, MMMM d, yyyy')}
          </h2>
        </div>

        {/* Timeline */}
        <div className="flex-1 overflow-auto" ref={scrollContainerRef}>
          <div className="relative">
            {/* Hour rows */}
            {hours.map((hour) => (
              <div
                key={hour}
                className="flex border-b dark:border-gray-700 h-[60px] group"
              >
                {/* Hour label */}
                <div className="w-24 border-r dark:border-gray-700 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800">
                  {formatHour(hour)}
                </div>
                
                {/* Time slot */}
                <div
                  className="flex-1 bg-white dark:bg-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors relative"
                  onClick={() => onTimeSlotClick?.(currentDate, `${hour.toString().padStart(2, '0')}:00`)}
                >
                  {/* 30-minute marker */}
                  <div className="absolute inset-x-0 top-1/2 border-t dark:border-gray-700/50 border-dashed" />
                </div>
              </div>
            ))}

            {/* Events */}
            <AnimatePresence>
              {dayEvents.map((event) => {
                const { top, height } = calculateEventPosition(event);
                const eventColor = EVENT_COLORS.find(c => c.value === event.color) || EVENT_COLORS[0];
                
                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="absolute left-24 right-4 cursor-pointer z-20"
                    style={{ top: `${top}px`, height: `${height}px` }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick?.(event);
                    }}
                  >
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="h-full rounded-lg shadow-sm border p-3 overflow-hidden"
                      style={{
                        backgroundColor: eventColor.bgColor,
                        borderColor: eventColor.borderColor,
                        borderLeftWidth: '4px'
                      }}
                    >
                      <div className="font-semibold text-sm" style={{ color: eventColor.color }}>
                        {event.title}
                      </div>
                      <div className="text-xs mt-1 opacity-75" style={{ color: eventColor.color }}>
                        {event.startTime} - {event.endTime}
                      </div>
                      {event.description && (
                        <div className="text-xs mt-2 line-clamp-2" style={{ color: eventColor.color }}>
                          {event.description}
                        </div>
                      )}
                    </motion.div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Current time indicator */}
            {isToday(currentDate) && (
              <motion.div
                className="absolute left-0 right-0 z-30 pointer-events-none"
                style={{ top: `${currentTimePosition}px` }}
                animate={{ top: `${currentTimePosition}px` }}
                transition={{ duration: 60 }}
              >
                <div className="relative">
                  <div className="absolute left-24 right-4 h-0.5 bg-red-500">
                    <div className="absolute -left-2 -top-1 w-2 h-2 bg-red-500 rounded-full" />
                    <div className="absolute -left-20 -top-3 text-xs text-red-500 font-medium">
                      {format(currentTime, settings.use24HourFormat ? 'HH:mm' : 'h:mm a')}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar - Happening now */}
      {isToday(currentDate) && happeningNow.length > 0 && (
        <div className="w-80 border-l dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Happening now
            </h3>
          </div>
          
          <div className="space-y-3">
            {happeningNow.map((event) => {
              const eventColor = EVENT_COLORS.find(c => c.value === event.color) || EVENT_COLORS[0];
              
              return (
                <motion.div
                  key={event.id}
                  whileHover={{ scale: 1.02 }}
                  className="p-3 rounded-lg border cursor-pointer"
                  style={{
                    backgroundColor: eventColor.bgColor,
                    borderColor: eventColor.borderColor
                  }}
                  onClick={() => onEventClick?.(event)}
                >
                  <div className="font-medium" style={{ color: eventColor.color }}>
                    {event.title}
                  </div>
                  <div className="text-sm mt-1 flex items-center gap-2" style={{ color: eventColor.color }}>
                    <Clock className="w-4 h-4" />
                    {event.startTime} - {event.endTime}
                  </div>
                  {event.description && (
                    <div className="text-sm mt-2 opacity-75" style={{ color: eventColor.color }}>
                      {event.description}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Quick info */}
          <div className="mt-6 pt-6 border-t dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center justify-between mb-2">
                <span>Total events today:</span>
                <span className="font-medium">{dayEvents.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Next event:</span>
                <span className="font-medium">
                  {dayEvents.find(e => e.startTime > format(currentTime, 'HH:mm'))?.title || 'None'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};