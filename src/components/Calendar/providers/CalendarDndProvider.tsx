// src/components/calendar/providers/CalendarDndProvider.tsx
import React, { createContext, useContext, useState } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter } from '@dnd-kit/core';
import { CalendarEvent } from '@/types/calendar';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format } from 'date-fns';

interface DragContextType {
  draggedEvent: CalendarEvent | null;
  isDragging: boolean;
}

const DragContext = createContext<DragContextType>({
  draggedEvent: null,
  isDragging: false
});

export const useDragContext = () => useContext(DragContext);

interface CalendarDndProviderProps {
  children: React.ReactNode;
  onEventUpdate?: (event: CalendarEvent) => void;
}

export const CalendarDndProvider: React.FC<CalendarDndProviderProps> = ({ 
  children,
  onEventUpdate 
}) => {
  const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null);

  const handleDragStart = (event: DragStartEvent) => {
    const eventData = event.active.data.current as CalendarEvent;
    setDraggedEvent(eventData);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || !draggedEvent) {
      setDraggedEvent(null);
      return;
    }

    const dropData = over.data.current as { date?: string; time?: string };
    
    if (dropData.date && draggedEvent.date !== dropData.date) {
      // Update event date
      const updatedEvent = {
        ...draggedEvent,
        date: dropData.date,
        updatedAt: new Date().toISOString()
      };

      try {
        await updateDoc(doc(db, 'calendarEvents', draggedEvent.id), {
          date: dropData.date,
          updatedAt: updatedEvent.updatedAt
        });

        onEventUpdate?.(updatedEvent);
      } catch (error) {
        console.error('Error updating event:', error);
      }
    } else if (dropData.time && dropData.date) {
      // Update event time (for week/day views)
      const [hours, minutes] = dropData.time.split(':');
      const duration = calculateDuration(draggedEvent.startTime, draggedEvent.endTime);
      
      const newStartTime = dropData.time;
      const newEndTime = addMinutesToTime(dropData.time, duration);

      const updatedEvent = {
        ...draggedEvent,
        date: dropData.date,
        startTime: newStartTime,
        endTime: newEndTime,
        updatedAt: new Date().toISOString()
      };

      try {
        await updateDoc(doc(db, 'calendarEvents', draggedEvent.id), {
          date: dropData.date,
          startTime: newStartTime,
          endTime: newEndTime,
          updatedAt: updatedEvent.updatedAt
        });

        onEventUpdate?.(updatedEvent);
      } catch (error) {
        console.error('Error updating event:', error);
      }
    }

    setDraggedEvent(null);
  };

  const handleDragCancel = () => {
    setDraggedEvent(null);
  };

  return (
    <DragContext.Provider value={{ draggedEvent, isDragging: !!draggedEvent }}>
      <DndContext
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        {children}
        <DragOverlay>
          {draggedEvent && <DraggedEventOverlay event={draggedEvent} />}
        </DragOverlay>
      </DndContext>
    </DragContext.Provider>
  );
};

// Dragged event overlay component
const DraggedEventOverlay: React.FC<{ event: CalendarEvent }> = ({ event }) => {
  const eventColor = EVENT_COLORS.find(c => c.value === event.color) || EVENT_COLORS[0];
  
  return (
    <div
      className="px-3 py-2 rounded-md shadow-lg cursor-grabbing opacity-90"
      style={{
        backgroundColor: eventColor.color,
        color: 'white',
        minWidth: '150px'
      }}
    >
      <div className="font-medium text-sm">{event.title}</div>
      <div className="text-xs opacity-90">
        {event.startTime} - {event.endTime}
      </div>
    </div>
  );
};

// Utility functions
function calculateDuration(startTime: string, endTime: string): number {
  const [startHours, startMinutes] = startTime.split(':').map(Number);
  const [endHours, endMinutes] = endTime.split(':').map(Number);
  
  const startTotalMinutes = startHours * 60 + startMinutes;
  const endTotalMinutes = endHours * 60 + endMinutes;
  
  return endTotalMinutes - startTotalMinutes;
}

function addMinutesToTime(time: string, minutes: number): string {
  const [hours, mins] = time.split(':').map(Number);
  const totalMinutes = hours * 60 + mins + minutes;
  
  const newHours = Math.floor(totalMinutes / 60) % 24;
  const newMinutes = totalMinutes % 60;
  
  return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
}