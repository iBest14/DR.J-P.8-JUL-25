// src/components/Calendar/DroppableArea.js
import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Box } from '@mui/material';

const DroppableArea = ({ id, children }) => {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <Box
      ref={setNodeRef}
      sx={{
        height: '100%',
        backgroundColor: isOver ? 'action.hover' : 'transparent',
        transition: 'background-color 0.2s'
      }}
    >
      {children}
    </Box>
  );
};

export default DroppableArea;