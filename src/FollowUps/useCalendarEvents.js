// src/FollowUps/useCalendarEvents.js
import { useState, useEffect } from "react";
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from "firebase/firestore";
import db from "../firebase";

const useCalendarEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Subscribe to calendar events collection
    const eventsQuery = query(
      collection(db, "calendarEvents"),
      orderBy("date", "asc")
    );

    const unsubscribe = onSnapshot(
      eventsQuery,
      (snapshot) => {
        const eventsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setEvents(eventsData);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching events:", err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const addEvent = async (eventData) => {
    try {
      const newEvent = {
        ...eventData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      const docRef = await addDoc(collection(db, "calendarEvents"), newEvent);
      
      // Return the new event with ID for optimistic updates
      return { id: docRef.id, ...newEvent };
    } catch (err) {
      console.error("Error adding event:", err);
      throw err;
    }
  };

  const updateEvent = async (eventId, updates) => {
    try {
      const eventRef = doc(db, "calendarEvents", eventId);
      await updateDoc(eventRef, {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Error updating event:", err);
      throw err;
    }
  };

  const deleteEvent = async (eventId) => {
    try {
      const eventRef = doc(db, "calendarEvents", eventId);
      await deleteDoc(eventRef);
    } catch (err) {
      console.error("Error deleting event:", err);
      throw err;
    }
  };

  const getEventsForDateRange = (startDate, endDate) => {
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= startDate && eventDate <= endDate;
    });
  };

  const getEventsForDay = (date) => {
    const dateString = date.toISOString().split('T')[0];
    return events.filter(event => event.date === dateString);
  };

  const getUpcomingEvents = (limit = 10) => {
    const today = new Date().toISOString().split('T')[0];
    return events
      .filter(event => event.date >= today)
      .slice(0, limit);
  };

  const getPastEvents = (limit = 10) => {
    const today = new Date().toISOString().split('T')[0];
    return events
      .filter(event => event.date < today)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, limit);
  };

  return {
    events,
    loading,
    error,
    addEvent,
    updateEvent,
    deleteEvent,
    getEventsForDateRange,
    getEventsForDay,
    getUpcomingEvents,
    getPastEvents,
  };
};

export default useCalendarEvents;