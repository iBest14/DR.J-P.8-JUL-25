// src/components/Calendar/CalendarDayView.js
import React, { useState } from 'react';
import { Box, Typography, Paper, Chip } from '@mui/material';
import { 
  format, 
  setHours, 
  setMinutes,
  isToday, 
  isSameHour, 
  isSameDay,
  startOfHour 
} from 'date-fns';
import { useCalendar } from '../../contexts/CalendarContext';
import { motion, AnimatePresence } from 'framer-motion';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import DroppableArea from './DroppableArea';
import DraggableEvent from './DraggableEvent';
import AddEditEventDialog from './AddEditEventDialog';

const CalendarDayView = () => {
  const { 
    currentDate,
    events,
    filterEventsBySelectedColors,
    use24HourFormat,
    isAgendaMode,
    editEvent
  } = useCalendar();

  const [draggedEvent, setDraggedEvent] = useState(null);
  const [addEventDialog, setAddEventDialog] = useState({ open: false, time: null });

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const currentHour = new Date().getHours();

  const getEventsForHour = (hour) => {
    const dayEvents = events.filter(event => {
      const eventDate = new Date(event.date);
      const eventHour = parseInt(event.time.split(':')[0]);
      return isSameDay(eventDate, currentDate) && eventHour === hour;
    });
    return filterEventsBySelectedColors(dayEvents);
  };

  const getCurrentEvents = () => {
    const now = new Date();
    return events.filter(event => {
      const eventDate = new Date(event.date);
      const [eventHour, eventMinute] = event.time.split(':').map(Number);
      const eventTime = setHours(setMinutes(eventDate, eventMinute), eventHour);
      const eventEndTime = new Date(eventTime.getTime() + 60 * 60 * 1000); // 1 hour duration
      
      return isSameDay(eventDate, currentDate) && 
             now >= eventTime && now < eventEndTime;
    });
  };

  const handleDragStart = (event) => {
    const { active } = event;
    const draggedEvent = events.find(e => e.id === active.id);
    setDraggedEvent(draggedEvent);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (over && draggedEvent) {
      const time = over.id;
      editEvent(active.id, { time });
    }
    
    setDraggedEvent(null);
  };

  const handleTimeSlotClick = (hour) => {
    const time = `${hour.toString().padStart(2, '0')}:00`;
    setAddEventDialog({ open: true, time });
  };

  if (isAgendaMode) {
    const dayEvents = events.filter(event => 
      isSameDay(new Date(event.date), currentDate)
    ).sort((a, b) => a.time.localeCompare(b.time));

    const filteredEvents = filterEventsBySelectedColors(dayEvents);

    return (
      <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
        <Typography variant="h5" gutterBottom>
          {format(currentDate, 'EEEE, MMMM d, yyyy')} - Agenda
        </Typography>
        
        {/* Current/Happening Now Section */}
        {isToday(currentDate) && getCurrentEvents().length > 0 && (
          <Paper sx={{ mb: 3, p: 2, backgroundColor: 'primary.light' }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Happening Now
            </Typography>
            {getCurrentEvents().map(event => (
              <Box key={event.id} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: getEventColor(event.color),
                    mr: 1,
                    animation: 'pulse 2s infinite'
                  }}
                />
                <Typography>
                  {event.title} - Started at {event.time}
                </Typography>
              </Box>
            ))}
          </Paper>
        )}

        {filteredEvents.length === 0 ? (
          <Typography color="text.secondary">No events today</Typography>
        ) : (
          <Box>
            {filteredEvents.map(event => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
              >
                <Paper sx={{ mb: 2, p: 2, display: 'flex', alignItems: 'flex-start' }}>
                  <Box sx={{ mr: 3, textAlign: 'center', minWidth: 60 }}>
                    <Typography variant="h6" color="primary">
                      {event.time.split(':')[0]}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {use24HourFormat ? '00' : format(setHours(new Date(), parseInt(event.time.split(':')[0])), 'a')}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Box
                        sx={{
                          width: 4,
                          height: 30,
                          backgroundColor: getEventColor(event.color),
                          mr: 2,
                          borderRadius: 1
                        }}
                      />
                      <Typography variant="h6">{event.title}</Typography>
                      {event.amount && (
                        <Chip 
                          label={`$${event.amount.toLocaleString()}`}
                          size="small"
                          sx={{ ml: 2 }}
                          color="success"
                        />
                      )}
                    </Box>
                    {event.description && (
                      <Typography variant="body2" color="text.secondary">
                        {event.description}
                      </Typography>
                    )}
                  </Box>
                </Paper>
              </motion.div>
            ))}
          </Box>
        )}
      </Box>
    );
  }

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <Box sx={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
        {/* Time column */}
        <Box sx={{ width: 80, flexShrink: 0 }}>
          {hours.map(hour => (
            <Box
              key={hour}
              sx={{
                height: 80,
                borderTop: '1px solid',
                borderColor: 'divider',
                pr: 2,
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'flex-end',
                position: 'relative'
              }}
            >
              <Typography 
                variant="caption" 
                color="text.secondary"
                sx={{
                  fontWeight: isToday(currentDate) && hour === currentHour ? 'bold' : 'normal',
                  color: isToday(currentDate) && hour === currentHour ? 'primary.main' : 'text.secondary'
                }}
              >
                {format(setHours(new Date(), hour), use24HourFormat ? 'HH:00' : 'h a')}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Day timeline */}
        <Box sx={{ flex: 1, overflow: 'auto', position: 'relative' }}>
          {/* Current time indicator */}
          {isToday(currentDate) && (
            <Box
              sx={{
                position: 'absolute',
                top: `${(currentHour + new Date().getMinutes() / 60) * 80}px`,
                left: 0,
                right: 0,
                height: 2,
                backgroundColor: 'error.main',
                zIndex: 10,
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  left: -8,
                  top: -4,
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  backgroundColor: 'error.main'
                }
              }}
            />
          )}

          {hours.map(hour => {
            const events = getEventsForHour(hour);
            const slotId = `${hour.toString().padStart(2, '0')}:00`;

            return (
              <DroppableArea key={slotId} id={slotId}>
                <Box
                  onClick={() => handleTimeSlotClick(hour)}
                  sx={{
                    height: 80,
                    borderTop: '1px solid',
                    borderColor: 'divider',
                    p: 1,
                    cursor: 'pointer',
                    backgroundColor: isToday(currentDate) && hour === currentHour ? 'action.hover' : 'transparent',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    }
                  }}
                >
                  <AnimatePresence>
                    {events.map(event => (
                      <DraggableEvent key={event.id} event={event} />
                    ))}
                  </AnimatePresence>
                </Box>
              </DroppableArea>
            );
          })}
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
          onClose={() => setAddEventDialog({ open: false, time: null })}
          initialDate={format(currentDate, 'yyyy-MM-dd')}
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

// Add CSS animation for pulse
const style = document.createElement('style');
style.textContent = `
  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
  }
`;
document.head.appendChild(style);

export default CalendarDayView;