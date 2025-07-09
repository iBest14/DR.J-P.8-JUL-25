// src/components/Calendar/CalendarMonthView.js
import React from 'react';
import { Box, Grid, Typography, Paper } from '@mui/material';
import { 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isToday
} from 'date-fns';
import { useCalendar } from '../../contexts/CalendarContext';
import { motion } from 'framer-motion';
import EventBullet from './EventBullet';

const CalendarMonthView = () => {
  const { 
    currentDate, 
    selectedDate, 
    setSelectedDate,
    events,
    filterEventsBySelectedColors,
    isAgendaMode
  } = useCalendar();

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getDayEvents = (day) => {
    const dayEvents = events.filter(event => 
      isSameDay(new Date(event.date), day)
    );
    return filterEventsBySelectedColors(dayEvents);
  };

  if (isAgendaMode) {
    // Agenda view for month
    const monthEvents = events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= monthStart && eventDate <= monthEnd;
    }).sort((a, b) => new Date(a.date) - new Date(b.date));

    const filteredEvents = filterEventsBySelectedColors(monthEvents);
    const groupedEvents = {};

    filteredEvents.forEach(event => {
      const dateKey = format(new Date(event.date), 'yyyy-MM-dd');
      if (!groupedEvents[dateKey]) {
        groupedEvents[dateKey] = [];
      }
      groupedEvents[dateKey].push(event);
    });

    return (
      <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
        <Typography variant="h5" gutterBottom>
          {format(currentDate, 'MMMM yyyy')} - Agenda
        </Typography>
        {Object.keys(groupedEvents).length === 0 ? (
          <Typography color="text.secondary">No events this month</Typography>
        ) : (
          Object.entries(groupedEvents).map(([date, dayEvents]) => (
            <motion.div
              key={date}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Paper sx={{ mb: 2, p: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  {format(new Date(date), 'EEEE, MMMM d')}
                </Typography>
                {dayEvents.map(event => (
                  <Box key={event.id} sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                    <EventBullet color={event.color} />
                    <Typography variant="body2" sx={{ ml: 1 }}>
                      {event.time} - {event.title}
                      {event.amount && ` ($${event.amount.toLocaleString()})`}
                    </Typography>
                  </Box>
                ))}
              </Paper>
            </motion.div>
          ))
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Week days header */}
      <Grid container sx={{ mb: 1 }}>
        {weekDays.map(day => (
          <Grid item xs key={day} sx={{ textAlign: 'center' }}>
            <Typography variant="caption" fontWeight="bold" color="text.secondary">
              {day}
            </Typography>
          </Grid>
        ))}
      </Grid>

      {/* Calendar grid */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <Grid container sx={{ height: '100%' }}>
          {days.map((day, index) => {
            const dayEvents = getDayEvents(day);
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isSelected = isSameDay(day, selectedDate);
            const isCurrentDay = isToday(day);

            return (
              <Grid 
                item 
                xs={12/7} 
                key={day.toString()}
                sx={{ 
                  border: '1px solid',
                  borderColor: 'divider',
                  minHeight: '100px',
                  height: `${100/6}%`
                }}
              >
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.01 }}
                  style={{ height: '100%' }}
                >
                  <Box
                    onClick={() => setSelectedDate(day)}
                    sx={{
                      p: 1,
                      height: '100%',
                      cursor: 'pointer',
                      backgroundColor: isSelected ? 'action.selected' : 'transparent',
                      opacity: isCurrentMonth ? 1 : 0.5,
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: isCurrentDay ? 'bold' : 'normal',
                          color: isCurrentDay ? 'primary.main' : 'text.primary',
                          backgroundColor: isCurrentDay ? 'primary.light' : 'transparent',
                          borderRadius: '50%',
                          width: 24,
                          height: 24,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {format(day, 'd')}
                      </Typography>
                    </Box>

                    {/* Events */}
                    <Box sx={{ overflow: 'hidden' }}>
                      {dayEvents.slice(0, 3).map((event, idx) => (
                        <Box
                          key={event.id}
                          sx={{
                            fontSize: '11px',
                            mb: 0.5,
                            p: '2px 4px',
                            borderRadius: '4px',
                            backgroundColor: `${getEventColor(event.color)}20`,
                            borderLeft: `3px solid ${getEventColor(event.color)}`,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {event.time} {event.title}
                        </Box>
                      ))}
                      {dayEvents.length > 3 && (
                        <Typography variant="caption" color="text.secondary">
                          +{dayEvents.length - 3} more
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </motion.div>
              </Grid>
            );
          })}
        </Grid>
      </Box>
    </Box>
  );
};

const getEventColor = (color) => {
  const colors = {
    red: '#ef4444',
    blue: '#3b82f6',
    green: '#10b981',
    yellow: '#f59e0b',
    purple: '#8b5cf6',
    pink: '#ec4899',
  };
  return colors[color] || colors.blue;
};

export default CalendarMonthView;