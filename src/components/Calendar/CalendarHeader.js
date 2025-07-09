// src/components/Calendar/CalendarHeader.js
import React, { useState } from 'react';
import { Box, Button, IconButton, Menu, MenuItem, Checkbox, Typography } from '@mui/material';
import { 
  ChevronLeft, 
  ChevronRight, 
  CalendarMonth,
  ViewWeek,
  ViewDay,
  CalendarToday,
  FilterList,
  Schedule,
  Add,
  DarkMode,
  LightMode,
  ViewAgenda,
  Apps
} from '@mui/icons-material';
import { useCalendar } from '../../contexts/CalendarContext';
import { format, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays } from 'date-fns';
import AddEditEventDialog from './AddEditEventDialog';

const CalendarHeader = () => {
  const { 
    view, 
    setView, 
    currentDate, 
    setCurrentDate,
    use24HourFormat,
    toggleTimeFormat,
    isAgendaMode,
    toggleAgendaMode,
    selectedColors,
    setSelectedColors
  } = useCalendar();

  const [filterAnchor, setFilterAnchor] = useState(null);
  const [addEventOpen, setAddEventOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const colors = [
    { name: 'Red', value: 'red', hex: '#ef4444' },
    { name: 'Blue', value: 'blue', hex: '#3b82f6' },
    { name: 'Green', value: 'green', hex: '#10b981' },
    { name: 'Yellow', value: 'yellow', hex: '#f59e0b' },
    { name: 'Purple', value: 'purple', hex: '#8b5cf6' },
    { name: 'Pink', value: 'pink', hex: '#ec4899' },
  ];

  const handlePrevious = () => {
    if (view === 'month' || view === 'year') {
      setCurrentDate(subMonths(currentDate, 1));
    } else if (view === 'week') {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(subDays(currentDate, 1));
    }
  };

  const handleNext = () => {
    if (view === 'month' || view === 'year') {
      setCurrentDate(addMonths(currentDate, 1));
    } else if (view === 'week') {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addDays(currentDate, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const getDateDisplay = () => {
    if (view === 'year') {
      return format(currentDate, 'yyyy');
    } else if (view === 'month') {
      return format(currentDate, 'MMMM yyyy');
    } else if (view === 'week') {
      return `Week of ${format(currentDate, 'MMM d, yyyy')}`;
    } else {
      return format(currentDate, 'EEEE, MMMM d, yyyy');
    }
  };

  const handleColorToggle = (color) => {
    setSelectedColors(prev => 
      prev.includes(color) 
        ? prev.filter(c => c !== color)
        : [...prev, color]
    );
  };

  return (
    <>
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          p: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.paper',
        }}
      >
        {/* Left section - Navigation */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button 
            variant="outlined" 
            onClick={handleToday}
            size="small"
          >
            Today
          </Button>
          <IconButton onClick={handlePrevious} size="small">
            <ChevronLeft />
          </IconButton>
          <IconButton onClick={handleNext} size="small">
            <ChevronRight />
          </IconButton>
          <Typography variant="h6" sx={{ ml: 2, minWidth: '200px' }}>
            {getDateDisplay()}
          </Typography>
        </Box>

        {/* Center section - View toggles */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant={view === 'day' ? 'contained' : 'outlined'}
            onClick={() => setView('day')}
            startIcon={<ViewDay />}
            size="small"
          >
            Day
          </Button>
          <Button
            variant={view === 'week' ? 'contained' : 'outlined'}
            onClick={() => setView('week')}
            startIcon={<ViewWeek />}
            size="small"
          >
            Week
          </Button>
          <Button
            variant={view === 'month' ? 'contained' : 'outlined'}
            onClick={() => setView('month')}
            startIcon={<CalendarMonth />}
            size="small"
          >
            Month
          </Button>
          <Button
            variant={view === 'year' ? 'contained' : 'outlined'}
            onClick={() => setView('year')}
            startIcon={<CalendarToday />}
            size="small"
          >
            Year
          </Button>
        </Box>

        {/* Right section - Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton 
            onClick={toggleAgendaMode}
            size="small"
            title={isAgendaMode ? "Grid View" : "Agenda View"}
          >
            {isAgendaMode ? <Apps /> : <ViewAgenda />}
          </IconButton>

          <IconButton 
            onClick={toggleTimeFormat}
            size="small"
            title={use24HourFormat ? "12 Hour Format" : "24 Hour Format"}
          >
            <Schedule />
            <Typography variant="caption" sx={{ ml: 0.5 }}>
              {use24HourFormat ? '24' : '12'}
            </Typography>
          </IconButton>

          <IconButton 
            onClick={(e) => setFilterAnchor(e.currentTarget)}
            size="small"
            title="Filter by color"
          >
            <FilterList />
          </IconButton>

          <Menu
            anchorEl={filterAnchor}
            open={Boolean(filterAnchor)}
            onClose={() => setFilterAnchor(null)}
          >
            {colors.map(color => (
              <MenuItem key={color.value} onClick={(e) => e.preventDefault()}>
                <Checkbox
                  checked={selectedColors.includes(color.value)}
                  onChange={() => handleColorToggle(color.value)}
                  sx={{ color: color.hex }}
                />
                <Box 
                  sx={{ 
                    width: 16, 
                    height: 16, 
                    borderRadius: '50%',
                    backgroundColor: color.hex,
                    mr: 1
                  }} 
                />
                {color.name}
              </MenuItem>
            ))}
          </Menu>

          <IconButton 
            onClick={() => setDarkMode(!darkMode)}
            size="small"
            title="Toggle theme"
          >
            {darkMode ? <LightMode /> : <DarkMode />}
          </IconButton>

          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setAddEventOpen(true)}
            size="small"
          >
            Add Event
          </Button>
        </Box>
      </Box>

      <AddEditEventDialog 
        open={addEventOpen}
        onClose={() => setAddEventOpen(false)}
      />
    </>
  );
};

export default CalendarHeader;