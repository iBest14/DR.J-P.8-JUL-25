// src/components/calendar/dnd/DraggableEvent.tsx
import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { CalendarEvent, EVENT_COLORS } from '@/types/calendar';
import { motion } from 'framer-motion';

interface DraggableEventProps {
  event: CalendarEvent;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const DraggableEvent: React.FC<DraggableEventProps> = ({
  event,
  children,
  className,
  style
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging
  } = useDraggable({
    id: event.id,
    data: event
  });

  const transformStyle = transform ? {
    transform: CSS.Translate.toString(transform),
  } : undefined;

  const eventColor = EVENT_COLORS.find(c => c.value === event.color) || EVENT_COLORS[0];

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        ...transformStyle,
        ...style,
        cursor: isDragging ? 'grabbing' : 'grab',
        opacity: isDragging ? 0.5 : 1
      }}
      className={cn(
        'transition-opacity',
        className
      )}
    >
      {children || (
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="px-2 py-1 rounded text-xs truncate"
          style={{
            backgroundColor: eventColor.bgColor,
            borderLeftColor: eventColor.color,
            borderLeftWidth: '3px',
            color: eventColor.color
          }}
        >
          <span className="font-medium">{event.startTime}</span>
          <span className="ml-1">{event.title}</span>
        </motion.div>
      )}
    </div>
  );
};

// src/components/calendar/dnd/DroppableTimeSlot.tsx
import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface DroppableTimeSlotProps {
  date: Date;
  time?: string;
  children?: React.ReactNode;
  className?: string;
  highlightOnHover?: boolean;
}

export const DroppableTimeSlot: React.FC<DroppableTimeSlotProps> = ({
  date,
  time,
  children,
  className,
  highlightOnHover = true
}) => {
  const id = time 
    ? `${format(date, 'yyyy-MM-dd')}-${time}`
    : format(date, 'yyyy-MM-dd');

  const {
    setNodeRef,
    isOver
  } = useDroppable({
    id,
    data: {
      date: format(date, 'yyyy-MM-dd'),
      time
    }
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'h-full w-full',
        highlightOnHover && isOver && 'bg-blue-50 dark:bg-blue-900/20',
        className
      )}
    >
      {children}
    </div>
  );
};

// src/components/calendar/dnd/DroppableDay.tsx
import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface DroppableDayProps {
  date: Date;
  children?: React.ReactNode;
  className?: string;
  onDrop?: (date: Date) => void;
}

export const DroppableDay: React.FC<DroppableDayProps> = ({
  date,
  children,
  className
}) => {
  const {
    setNodeRef,
    isOver
  } = useDroppable({
    id: format(date, 'yyyy-MM-dd'),
    data: {
      date: format(date, 'yyyy-MM-dd')
    }
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'h-full w-full transition-colors',
        isOver && 'bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-500 ring-inset',
        className
      )}
    >
      {children}
    </div>
  );
};