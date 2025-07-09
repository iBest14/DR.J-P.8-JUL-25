// src/components/Calendar/CalendarYearView.js
import React, { useState } from 'react';
import { Box, Grid, Typography, Paper, Dialog, DialogTitle, DialogContent, List, ListItem, ListItemText } from '@mui/material';
import { 
  startOfYear,
  endOfYear,
  eachMonthOfInterval,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isSameDay,
  isToday,
  isSameMonth
} from 'date-fns';
import { useCalendar } from '../../contexts/CalendarContext';
import { motion } from 'framer-motion';
import EventBullet from './EventBullet';

const CalendarYearView = () => {
  const { 
    currentDate,
    setCurrentDate,
    setView,
    events,
    filterEventsBySelectedColors
  } = useCalendar();

  const [selectedDayEvents, setSelectedDayEvents] = useState({ open: false, date: null, events: [] });

  const yearStart = startOfYear(currentDate);
  const yearEnd = endOfYear(currentDate);
  const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });

  const getDayEvents = (day) => {
    const dayEvents = events.filter(event => 
      isSameDay(new Date(event.date), day)
    );
    return filterEventsBySelectedColors(dayEvents);
  };

  const handleDayClick = (day, dayEvents) => {
    if (dayEvents.length > 0) {
      setSelectedDayEvents({ open: true, date: day, events: dayEvents });
    }
  };

  const handleMonthClick = (month) => {
    setCurrentDate(month);
    setView('month');
  };

  const renderMonth = (month, index) => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const firstDayOfWeek = monthStart.getDay();
    const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    return (
      <motion.div
        key={month.toString()}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.05 }}
     >
       <Paper
         sx={{
           p: 2,
           height: '100%',
           cursor: 'pointer',
           transition: 'all 0.3s',
           '&:hover': {
             transform: 'translateY(-4px)',
             boxShadow: 4
           }
         }}
         onClick={() => handleMonthClick(month)}
       >
         <Typography 
           variant="subtitle2" 
           fontWeight="bold" 
           gutterBottom
           sx={{ textAlign: 'center', mb: 1 }}
         >
           {format(month, 'MMMM')}
         </Typography>

         {/* Week days header */}
         <Grid container sx={{ mb: 0.5 }}>
           {weekDays.map(day => (
             <Grid item xs key={day} sx={{ textAlign: 'center' }}>
               <Typography variant="caption" sx={{ fontSize: '10px', color: 'text.secondary' }}>
                 {day}
               </Typography>
             </Grid>
           ))}
         </Grid>

         {/* Empty cells for first week */}
         <Grid container>
           {Array.from({ length: firstDayOfWeek }, (_, i) => (
             <Grid item xs={12/7} key={`empty-${i}`}>
               <Box sx={{ aspectRatio: '1', p: 0.25 }} />
             </Grid>
           ))}

           {/* Days */}
           {days.map(day => {
             const dayEvents = getDayEvents(day);
             const hasEvents = dayEvents.length > 0;
             const isCurrentDay = isToday(day);

             return (
               <Grid item xs={12/7} key={day.toString()}>
                 <Box
                   onClick={(e) => {
                     e.stopPropagation();
                     handleDayClick(day, dayEvents);
                   }}
                   sx={{
                     aspectRatio: '1',
                     p: 0.25,
                     display: 'flex',
                     flexDirection: 'column',
                     alignItems: 'center',
                     justifyContent: 'center',
                     cursor: hasEvents ? 'pointer' : 'default',
                     borderRadius: '50%',
                     backgroundColor: isCurrentDay ? 'primary.main' : 'transparent',
                     color: isCurrentDay ? 'primary.contrastText' : 'text.primary',
                     position: 'relative',
                     '&:hover': hasEvents ? {
                       backgroundColor: isCurrentDay ? 'primary.dark' : 'action.hover',
                     } : {}
                   }}
                 >
                   <Typography 
                     variant="caption" 
                     sx={{ 
                       fontSize: '11px',
                       fontWeight: isCurrentDay ? 'bold' : 'normal'
                     }}
                   >
                     {format(day, 'd')}
                   </Typography>
                   
                   {/* Event indicators */}
                   {hasEvents && (
                     <Box sx={{ display: 'flex', gap: 0.25, mt: 0.25 }}>
                       {dayEvents.slice(0, 3).map((event, idx) => (
                         <Box
                           key={idx}
                           sx={{
                             width: 4,
                             height: 4,
                             borderRadius: '50%',
                             backgroundColor: getEventColor(event.color)
                           }}
                         />
                       ))}
                     </Box>
                   )}
                 </Box>
               </Grid>
             );
           })}
         </Grid>
       </Paper>
     </motion.div>
   );
 };

 return (
   <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
     <Typography variant="h4" gutterBottom sx={{ textAlign: 'center', mb: 3 }}>
       {format(currentDate, 'yyyy')}
     </Typography>

     <Grid container spacing={2}>
       {months.map((month, index) => (
         <Grid item xs={12} sm={6} md={4} lg={3} key={month.toString()}>
           {renderMonth(month, index)}
         </Grid>
       ))}
     </Grid>

     {/* Event Details Dialog */}
     <Dialog
       open={selectedDayEvents.open}
       onClose={() => setSelectedDayEvents({ open: false, date: null, events: [] })}
       maxWidth="sm"
       fullWidth
     >
       <DialogTitle>
         Events on {selectedDayEvents.date && format(selectedDayEvents.date, 'EEEE, MMMM d, yyyy')}
       </DialogTitle>
       <DialogContent>
         <List>
           {selectedDayEvents.events.map(event => (
             <ListItem key={event.id} sx={{ display: 'flex', alignItems: 'flex-start' }}>
               <EventBullet color={event.color} />
               <ListItemText
                 primary={
                   <Box>
                     <Typography variant="subtitle2">
                       {event.time} - {event.title}
                     </Typography>
                     {event.amount && (
                       <Typography variant="caption" color="success.main">
                         ${event.amount.toLocaleString()}
                       </Typography>
                     )}
                   </Box>
                 }
                 secondary={event.description}
               />
             </ListItem>
           ))}
         </List>
       </DialogContent>
     </Dialog>
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

export default CalendarYearView;