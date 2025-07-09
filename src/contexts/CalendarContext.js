import React, { createContext, useContext, useState, useCallback } from 'react';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

const CalendarContext = createContext();

export const useCalendar = () => {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error('useCalendar must be used within CalendarProvider');
  }
  return context;
};

export const CalendarProvider = ({ children, initialEvents = [] }) => {
  const [events, setEvents] = useState(initialEvents);
  const [view, setView] = useState('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedColors, setSelectedColors] = useState([]);
  const [isAgendaMode, setIsAgendaMode] = useState(false);
  const [use24HourFormat, setUse24HourFormat] = useState(true);

  const toggleAgendaMode = () => setIsAgendaMode(!isAgendaMode);
  const toggleTimeFormat = () => setUse24HourFormat(!use24HourFormat);

  const addEvent = useCallback((event) => {
    setEvents(prev => [...prev, { ...event, id: Date.now().toString() }]);
  }, []);

  const editEvent = useCallback((eventId, updatedEvent) => {
    setEvents(prev => prev.map(event => 
      event.id === eventId ? { ...event, ...updatedEvent } : event
    ));
  }, []);

  const deleteEvent = useCallback((eventId) => {
    setEvents(prev => prev.filter(event => event.id !== eventId));
  }, []);

  const filterEventsBySelectedColors = useCallback((eventsToFilter) => {
    if (selectedColors.length === 0) return eventsToFilter;
    return eventsToFilter.filter(event => selectedColors.includes(event.color));
  }, [selectedColors]);

  const getEventsForDateRange = useCallback((start, end) => {
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= start && eventDate <= end;
    });
  }, [events]);

  const value = {
    events,
    view,
    setView,
    currentDate,
    setCurrentDate,
    selectedDate,
    setSelectedDate,
    selectedColors,
    setSelectedColors,
    isAgendaMode,
    toggleAgendaMode,
    use24HourFormat,
    toggleTimeFormat,
    addEvent,
    editEvent,
    deleteEvent,
    filterEventsBySelectedColors,
    getEventsForDateRange,
  };

  return (
    <CalendarContext.Provider value={value}>
      {children}
    </CalendarContext.Provider>
  );
};