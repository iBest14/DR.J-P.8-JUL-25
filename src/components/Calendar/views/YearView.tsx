// src/components/calendar/views/YearView.tsx
import React from 'react';
import { cn } from '@/lib/utils';
import { CalendarEvent } from '@/types/calendar';
import { 
  startOfYear, 
  endOfYear, 
  eachMonthOfInterval,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isToday,
  getDay,
  startOfWeek,
  endOfWeek
} from 'date-fns';

interface YearViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onDateClick: (date: Date) => void;
  selectedDate?: Date;
  useDotBadge?: boolean;
}

export const YearView: React.FC<YearViewProps> = ({
  currentDate,
  events,
  onDateClick,
  selectedDate,
  useDotBadge = false
}) => {
  const year = currentDate.getFullYear();
  const months = eachMonthOfInterval({
    start: startOfYear(currentDate),
    end: endOfYear(currentDate)
  });

  const getEventsForDay = (date: Date): CalendarEvent[] => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return events.filter(event => event.date === dateStr);
  };

  return (
    <div className="p-6 h-full overflow-auto bg-gray-50 dark:bg-gray-900">
      <div className="grid grid-cols-3 gap-6 max-w-7xl mx-auto">
        {months.map((month) => (
          <MonthCalendar
            key={month.toISOString()}
            month={month}
            events={events}
            onDateClick={onDateClick}
            selectedDate={selectedDate}
            getEventsForDay={getEventsForDay}
            useDotBadge={useDotBadge}
          />
        ))}
      </div>
    </div>
  );
};

interface MonthCalendarProps {
  month: Date;
  events: CalendarEvent[];
  onDateClick: (date: Date) => void;
  selectedDate?: Date;
  getEventsForDay: (date: Date) => CalendarEvent[];
  useDotBadge?: boolean;
}

const MonthCalendar: React.FC<MonthCalendarProps> = ({
  month,
  onDateClick,
  selectedDate,
  getEventsForDay,
  useDotBadge
}) => {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  
  // Always show 6 weeks for consistent height
  const totalDays = 42;
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  
  // Ensure we always have 42 days
  while (days.length < totalDays) {
    const lastDay = days[days.length - 1];
    const nextDay = new Date(lastDay);
    nextDay.setDate(lastDay.getDate() + 1);
    days.push(nextDay);
  }

  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      {/* Month Header */}
      <h3 className="text-center font-semibold text-sm mb-3 text-gray-900 dark:text-gray-100">
        {format(month, 'MMMM')}
      </h3>

      {/* Week Days Header */}
      <div className="grid grid-cols-7 mb-1">
        {weekDays.map((day, index) => (
          <div
            key={index}
            className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-1"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7">
        {days.slice(0, totalDays).map((day, index) => {
          const isCurrentMonth = isSameMonth(day, month);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isTodayDate = isToday(day);
          const dayEvents = getEventsForDay(day);
          const hasEvents = dayEvents.length > 0;

          return (
            <div
              key={index}
              onClick={() => isCurrentMonth && onDateClick(day)}
              className={cn(
                "relative aspect-square flex items-center justify-center text-sm cursor-pointer transition-colors",
                "hover:bg-gray-100 dark:hover:bg-gray-700",
                !isCurrentMonth && "text-gray-400 dark:text-gray-600 cursor-default",
                isCurrentMonth && "text-gray-900 dark:text-gray-100"
              )}
            >
              <span
                className={cn(
                  "flex items-center justify-center w-7 h-7 rounded-full",
                  isTodayDate && isCurrentMonth && "bg-blue-600 text-white font-semibold",
                  isSelected && !isTodayDate && "bg-gray-200 dark:bg-gray-600"
                )}
              >
                {format(day, 'd')}
              </span>

              {/* Event Indicators */}
              {hasEvents && isCurrentMonth && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 flex gap-0.5 mb-0.5">
                  {useDotBadge ? (
                    dayEvents.slice(0, 3).map((event, i) => (
                      <div
                        key={i}
                        className="w-1 h-1 rounded-full"
                        style={{
                          backgroundColor: getEventColor(event.color)
                        }}
                      />
                    ))
                  ) : (
                    <div className="text-[10px] text-gray-500 dark:text-gray-400">
                      {dayEvents.length}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Helper function to get event color
const getEventColor = (color: string): string => {
  const colorMap: Record<string, string> = {
    red: '#dc2626',
    blue: '#2563eb',
    green: '#16a34a',
    yellow: '#ca8a04',
    purple: '#9333ea',
    pink: '#db2777',
    orange: '#ea580c',
    gray: '#6b7280',
  };
  return colorMap[color] || colorMap.gray;
};