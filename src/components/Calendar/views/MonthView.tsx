// src/components/calendar/views/MonthView.tsx
import React from 'react';
import { cn } from '@/lib/utils';
import { CalendarEvent, EVENT_COLORS } from '@/types/calendar';
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isToday,
  startOfWeek,
  endOfWeek,
  addDays
} from 'date-fns';
import { motion } from 'framer-motion';

interface MonthViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onDateClick: (date: Date) => void;
  selectedDate?: Date;
  onEventClick?: (event: CalendarEvent) => void;
  settings?: {
    use24HourFormat: boolean;
  };
}

export const MonthView: React.FC<MonthViewProps> = ({
  currentDate,
  events,
  onDateClick,
  selectedDate,
  onEventClick,
  settings = { use24HourFormat: true }
}) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  
  // Ensure we have 6 weeks (42 days)
  let days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  while (days.length < 42) {
    const lastDay = days[days.length - 1];
    days.push(addDays(lastDay, 1));
  }

  const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const getEventsForDay = (date: Date): CalendarEvent[] => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return events.filter(event => event.date === dateStr);
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Week Day Headers */}
      <div className="grid grid-cols-7 border-b dark:border-gray-700">
        {weekDays.map((day) => (
          <div
            key={day}
            className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border-r dark:border-gray-700 last:border-r-0"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 grid grid-cols-7 grid-rows-6">
        {days.map((day, index) => {
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isTodayDate = isToday(day);
          const dayEvents = getEventsForDay(day);

          return (
            <motion.div
              key={day.toISOString()}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.01 }}
              className={cn(
                "border-r border-b dark:border-gray-700",
                "min-h-[120px] p-2",
                "cursor-pointer transition-colors",
                "hover:bg-gray-50 dark:hover:bg-gray-800",
                !isCurrentMonth && "bg-gray-50 dark:bg-gray-800/50",
                "last:border-r-0",
                index >= 35 && "border-b-0" // Last row
              )}
              onClick={() => onDateClick(day)}
            >
              {/* Day Number */}
              <div className="flex items-start justify-between mb-1">
                <span
                  className={cn(
                    "inline-flex items-center justify-center w-7 h-7 text-sm",
                    "rounded-full transition-colors",
                    isTodayDate && "bg-blue-600 text-white font-semibold",
                    isSelected && !isTodayDate && "bg-gray-200 dark:bg-gray-700",
                    !isCurrentMonth && "text-gray-400 dark:text-gray-600",
                    isCurrentMonth && !isTodayDate && "text-gray-900 dark:text-gray-100"
                  )}
                >
                  {format(day, 'd')}
                </span>
              </div>

              {/* Events */}
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((event, eventIndex) => (
                  <EventItem
                    key={event.id}
                    event={event}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick?.(event);
                    }}
                    use24HourFormat={settings.use24HourFormat}
                  />
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 pl-1">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

interface EventItemProps {
  event: CalendarEvent;
  onClick: (e: React.MouseEvent) => void;
  use24HourFormat: boolean;
}

const EventItem: React.FC<EventItemProps> = ({ event, onClick, use24HourFormat }) => {
  const eventColor = EVENT_COLORS.find(c => c.value === event.color) || EVENT_COLORS[0];
  
  const formatTime = (time: string) => {
    if (use24HourFormat) return time;
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "px-2 py-1 rounded text-xs truncate cursor-pointer",
        "transition-all duration-150",
        "border-l-2"
      )}
      style={{
        backgroundColor: eventColor.bgColor,
        borderLeftColor: eventColor.color,
        color: eventColor.color
      }}
    >
      <span className="font-medium">{formatTime(event.startTime)}</span>
      <span className="ml-1">{event.title}</span>
    </motion.div>
  );
};