// src/components/Calendar/CalendarWeekView.js
import React, { useState } from 'react';
import { Box, Grid, Typography, Paper } from '@mui/material';
import { 
  startOfWeek, 
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameDay,
  isToday,
  setHours,
  setMinutes
} from 'date-fns';
import { useCalendar } from '../../contexts/CalendarContext';
import { motion } from 'framer-motion';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import DroppableArea from './DroppableArea';
import DraggableEvent from './DraggableEvent';
import AddEditEventDialog from './AddEditEventDialog';

const CalendarWeekView = () => {
  const { 
    currentDate,
    events,
    filterEventsBySelectedColors,
    use24HourFormat,
    isAgendaMode,
    editEvent
  } = useCalendar();

  const [draggedEvent, setDraggedEvent] = useState(null);
  const [addEventDialog, setAddEventDialog] = useState({ open: false, date: null, time: null });

  const weekStart = startOfWeek(currentDate);
  const weekEnd = endOfWeek(currentDate);
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getEventsForDayAndHour = (day, hour) => {
    const dayEvents = events.filter(event => {
      const eventDate = new Date(event.date);
      const eventHour = parseInt(event.time.split(':')[0]);
      return isSameDay(eventDate, day) && eventHour === hour;
    });
    return filterEventsBySelectedColors(dayEvents);
  };

  const handleDragStart = (event) => {
    const { active } = event;
    const draggedEvent = events.find(e => e.id === active.id);
    setDraggedEvent(draggedEvent);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (over && draggedEvent) {
      const [day, time] = over.id.split('-');
      editEvent(active.id, {
        date: day,
        time: time
      });
    }
    
    setDraggedEvent(null);
  };

  const handleTimeSlotClick = (day, hour) => {
    const time = `${hour.toString().padStart(2, '0')}:00`;
    setAddEventDialog({ open: true, date: day, time });
  };

  if (isAgendaMode) {
    // Agenda view for week
    const weekEvents = events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= weekStart && eventDate <= weekEnd;
    }).sort((a, b) => {
      const dateA = new Date(a.date + ' ' + a.time);
      const dateB = new Date(b.date + ' ' + b.time);
      return dateA - dateB;
    });

    const filteredEvents = filterEventsBySelectedColors(weekEvents);

    return (
      <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
        <Typography variant="h5" gutterBottom>
          Week of {format(weekStart, 'MMM d')} - Agenda
        </Typography>
        {filteredEvents.length === 0 ? (
          <Typography color="text.secondary">No events this week</Typography>
        ) : (
          filteredEvents.map(event => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Paper sx={{ mb: 2, p: 2, display: 'flex', alignItems: 'center' }}>
                <Box
                  sx={{
                    width: 4,
                    height: 40,
                    backgroundColor: getEventColor(event.color),
                    mr: 2,
                    borderRadius: 1
                  }}
                />
                <Box>
                  <Typography variant="subtitle2">
                    {format(new Date(event.date), 'EEE, MMM d')} at {event.time}
                  </Typography>
                  <Typography variant="body1">
                    {event.title}
                    {event.amount && ` - $${event.amount.toLocaleString()}`}
                  </Typography>
                  {event.description && (
                    <Typography variant="body2" color="text.secondary">
                      {event.description}
                    </Typography>
                  )}
                </Box>
              </Paper>
            </motion.div>
          ))
        )}
      </Box>
    );
  }

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <Box sx={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
        {/* Time column */}
        <Box sx={{ width: 60, flexShrink: 0, pt: 6 }}>
          {hours.map(hour => (
            <Box
              key={hour}
              sx={{
                height: 60,
                borderTop: '1px solid',
                borderColor: 'divider',
                pr: 1,
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'flex-end'
              }}
            >
              <Typography variant="caption" color="text.secondary">
                {format(setHours(new Date(), hour), use24HourFormat ? 'HH:00' : 'h a')}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Days grid */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          <Grid container sx={{ position: 'sticky', top: 0, backgroundColor: 'background.paper', zIndex: 1 }}>
            {weekDays.map(day => (
              <Grid item xs key={day.toString()} sx={{ textAlign: 'center', p: 1, borderLeft: '1px solid', borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary">
                  {format(day, 'EEE')}
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: isToday(day) ? 'bold' : 'normal',
                    color: isToday(day) ? 'primary.main' : 'text.primary',
                  }}
                >
                  {format(day, 'd')}
                </Typography>
              </Grid>
            ))}
          </Grid>

          <Grid container>
            {weekDays.map(day => (
              <Grid item xs key={day.toString()}>
                {hours.map(hour => {
                  const events = getEventsForDayAndHour(day, hour);
                  const slotId = `${format(day, 'yyyy-MM-dd')}-${hour.toString().padStart(2, '0')}:00`;

                  return (
                    <DroppableArea key={slotId} id={slotId}>
                      <Box
                        onClick={() => handleTimeSlotClick(format(day, 'yyyy-MM-dd'), hour)}
                        sx={{
                          height: 60,
                          borderTop: '1px solid',
                          borderLeft: '1px solid',
                          borderColor: 'divider',
                          p: 0.5,
                          cursor: 'pointer',
                          position: 'relative',
                          '&:hover': {
                            backgroundColor: 'action.hover',
                          }
                        }}
                      >
                        {events.map(event => (
                          <DraggableEvent key={event.id} event={event} />
                        ))}
                      </Box>
                    </DroppableArea>
                  );
                })}
              </Grid>
            ))}
          </Grid>
        </Box>
      </Box>

      <DragOverlay>
        {draggedEvent && (
          <Box
            sx={{
              p: 1,
              backgroundColor: getEventColor(draggedEvent.color),
              color: 'white',
              borderRadius: 1,
              fontSize: '12px',
              opacity: 0.8
            }}
          >
            {draggedEvent.title}
          </Box>
        )}
      </DragOverlay>

      {addEventDialog.open && (
        <AddEditEventDialog
          open={addEventDialog.open}
          onClose={() => setAddEventDialog({ open: false, date: null, time: null })}
          initialDate={addEventDialog.date}
          initialTime={addEventDialog.time}
        />
      )}
    </DndContext>
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

export default CalendarWeekView;