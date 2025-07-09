// src/components/Calendar/DraggableEvent.js
import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';

const DraggableEvent = ({ event }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: event.id,
  });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
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

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
    >
      <Box
        sx={{
          p: 0.5,
          mb: 0.5,
          backgroundColor: getEventColor(event.color),
          color: 'white',
          borderRadius: 1,
          cursor: 'move',
          fontSize: '11px',
          opacity: isDragging ? 0.5 : 1,
          userSelect: 'none',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          boxShadow: isDragging ? 3 : 1,
          transition: 'all 0.2s',
          '&:hover': {
            boxShadow: 2,
          }
        }}
      >
        <Typography variant="caption" sx={{ fontWeight: 500 }}>
          {event.time} - {event.title}
        </Typography>
      </Box>
    </motion.div>
  );
};

export default DraggableEvent;