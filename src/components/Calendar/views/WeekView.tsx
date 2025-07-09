// src/components/calendar/views/WeekView.tsx
import React, { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { CalendarEvent, EVENT_COLORS } from '@/types/calendar';
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameDay,
  isToday,
  setHours,
  setMinutes,
  isWithinInterval,
  differenceInMinutes
} from 'date-fns';
import { motion } from 'framer-motion';

interface WeekViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onDateClick: (date: Date) => void;
  onTimeSlotClick?: (date: Date, time: string) => void;
  selectedDate?: Date;
  onEventClick?: (event: CalendarEvent) => void;
  settings?: {
    use24HourFormat: boolean;
  };
}

export const WeekView: React.FC<WeekViewProps> = ({
  currentDate,
  events,
  onDateClick,
  onTimeSlotClick,
  selectedDate,
  onEventClick,
  settings = { use24HourFormat: true }
}) => {
  const weekStart = startOfWeek(currentDate);
  const weekEnd = endOfWeek(currentDate);
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to 8 AM on mount
  useEffect(() => {
    if (scrollContainerRef.current) {
      const hourHeight = 60; // Height of each hour row
      scrollContainerRef.current.scrollTop = 8 * hourHeight;
    }
  }, []);

  const formatHour = (hour: number) => {
    if (settings.use24HourFormat) {
      return `${hour.toString().padStart(2, '0')}:00`;
    }
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour} ${period}`;
  };

  const getEventsForDayAndTime = (day: Date, hour: number): CalendarEvent[] => {
    const dateStr = format(day, 'yyyy-MM-dd');
    return events.filter(event => {
      if (event.date !== dateStr) return false;
      const [eventHour] = event.startTime.split(':').map(Number);
      const [eventEndHour] = event.endTime.split(':').map(Number);
      return hour >= eventHour && hour < eventEndHour;
    });
  };

  const calculateEventPosition = (event: CalendarEvent) => {
    const [startHour, startMinute] = event.startTime.split(':').map(Number);
    const [endHour, endMinute] = event.endTime.split(':').map(Number);
    
    const top = (startHour * 60 + startMinute) * (60 / 60); // 60px per hour
    const height = ((endHour * 60 + endMinute) - (startHour * 60 + startMinute)) * (60 / 60);
    
    return { top, height };
  };

  // Current time indicator
  const now = new Date();
  const currentTimePosition = (now.getHours() * 60 + now.getMinutes()) * (60 / 60);

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Header with day names and dates */}
      <div className="flex border-b dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-900 z-10">
        <div className="w-20 border-r dark:border-gray-700" />
        {weekDays.map((day) => {
          const isTodayDate = isToday(day);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          
          return (
            <div
              key={day.toISOString()}
              className={cn(
                "flex-1 text-center py-3 border-r dark:border-gray-700 last:border-r-0",
                "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800",
                isTodayDate && "bg-blue-50 dark:bg-blue-900/20"
              )}
              onClick={() => onDateClick(day)}
            >
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {format(day, 'EEE')}
              </div>
              <div
                className={cn(
                  "text-2xl font-medium inline-flex items-center justify-center w-10 h-10 rounded-full",
                  isTodayDate && "bg-blue-600 text-white",
                  isSelected && !isTodayDate && "bg-gray-200 dark:bg-gray-700",
                  !isTodayDate && !isSelected && "text-gray-900 dark:text-gray-100"
                )}
              >
                {format(day, 'd')}
              </div>
            </div>
          );
        })}
      </div>

      {/* Time grid */}
      <div className="flex-1 overflow-auto" ref={scrollContainerRef}>
        <div className="relative">
          {/* Hours */}
          {hours.map((hour) => (
            <div key={hour} className="flex border-b dark:border-gray-700 h-[60px]">
              {/* Hour label */}
              <div className="w-20 border-r dark:border-gray-700 px-2 py-2 text-xs text-gray-600 dark:text-gray-400">
                {formatHour(hour)}
              </div>
              
              {/* Day columns */}
              {weekDays.map((day) => {
                const dayEvents = getEventsForDayAndTime(day, hour);
                
                return (
                  <div
                    key={`${day.toISOString()}-${hour}`}
                    className="flex-1 border-r dark:border-gray-700 last:border-r-0 relative hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                    onClick={() => onTimeSlotClick?.(day, `${hour.toString().padStart(2, '0')}:00`)}
                  >
                    {/* Events will be positioned absolutely */}
                  </div>
                );
              })}
            </div>
          ))}

          {/* Events overlay */}
          {weekDays.map((day, dayIndex) => {
            const dayEvents = events.filter(event => 
              event.date === format(day, 'yyyy-MM-dd')
            );

            return dayEvents.map((event) => {
              const { top, height } = calculateEventPosition(event);
              const eventColor = EVENT_COLORS.find(c => c.value === event.color) || EVENT_COLORS[0];
              
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.02 }}
                  className="absolute cursor-pointer z-20"
                  style={{
                    top: `${top}px`,
                    height: `${height}px`,
                    left: `${80 + (dayIndex * (100 / 7))}%`,
                    width: `${100 / 7}%`,
                    transform: `translateX(-${100 - (100 / 7)}%)`,
                    padding: '0 4px'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEventClick?.(event);
                  }}
                >
                  <div
                    className="h-full rounded px-2 py-1 overflow-hidden"
                    style={{
                      backgroundColor: eventColor.color,
                      color: 'white'
                    }}
                  >
                    <div className="text-xs font-semibold truncate">
                      {event.title}
                    </div>
                    <div className="text-xs opacity-90">
                      {event.startTime} - {event.endTime}
                    </div>
                  </div>
                </motion.div>
              );
            });
          })}

          {/* Current time indicator */}
          {isToday(weekStart) && (
            <div
              className="absolute left-0 right-0 z-30 pointer-events-none"
              style={{ top: `${currentTimePosition}px` }}
            >
              <div className="relative">
                <div className="absolute left-20 right-0 h-0.5 bg-red-500">
                  <div className="absolute -left-2 -top-1 w-2 h-2 bg-red-500 rounded-full" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};