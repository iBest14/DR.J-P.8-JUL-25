// src/components/Calendar/EventBullet.js
import React from 'react';
import { Box } from '@mui/material';

const EventBullet = ({ color, size = 12 }) => {
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
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: getEventColor(color),
        flexShrink: 0
      }}
    />
  );
};

export default EventBullet;