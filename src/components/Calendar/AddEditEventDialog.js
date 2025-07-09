// src/components/Calendar/AddEditEventDialog.js
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  InputAdornment
} from '@mui/material';
import { Close, Event, Schedule, AttachMoney, Palette } from '@mui/icons-material';
import { useCalendar } from '../../contexts/CalendarContext';
import { motion } from 'framer-motion';

const AddEditEventDialog = ({ 
  open, 
  onClose, 
  event = null, 
  initialDate = null, 
  initialTime = null 
}) => {
  const { addEvent, editEvent, deleteEvent } = useCalendar();
  
  const [formData, setFormData] = useState({
    title: '',
    date: initialDate || new Date().toISOString().split('T')[0],
    time: initialTime || '09:00',
    endTime: '10:00',
    description: '',
    color: 'blue',
    amount: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || '',
        date: event.date || new Date().toISOString().split('T')[0],
        time: event.time || '09:00',
        endTime: event.endTime || '10:00',
        description: event.description || '',
        color: event.color || 'blue',
        amount: event.amount || ''
      });
    } else if (initialDate || initialTime) {
      setFormData(prev => ({
        ...prev,
        date: initialDate || prev.date,
        time: initialTime || prev.time
      }));
    }
  }, [event, initialDate, initialTime]);

  const colors = [
    { name: 'Red', value: 'red', hex: '#ef4444' },
    { name: 'Blue', value: 'blue', hex: '#3b82f6' },
    { name: 'Green', value: 'green', hex: '#10b981' },
    { name: 'Yellow', value: 'yellow', hex: '#f59e0b' },
    { name: 'Purple', value: 'purple', hex: '#8b5cf6' },
    { name: 'Pink', value: 'pink', hex: '#ec4899' },
  ];

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.date) newErrors.date = 'Date is required';
    if (!formData.time) newErrors.time = 'Time is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const eventData = {
      ...formData,
      amount: formData.amount ? parseFloat(formData.amount) : null
    };

    if (event) {
      editEvent(event.id, eventData);
    } else {
      addEvent(eventData);
    }

    onClose();
  };

  const handleDelete = () => {
    if (event && window.confirm('Are you sure you want to delete this event?')) {
      deleteEvent(event.id);
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        component: motion.div,
        initial: { scale: 0.9, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        transition: { duration: 0.2 }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {event ? 'Edit Event' : 'Add New Event'}
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <TextField
            label="Event Title"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            error={!!errors.title}
            helperText={errors.title}
            fullWidth
            autoFocus
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Event />
                </InputAdornment>
              ),
            }}
          />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Date"
              type="date"
              value={formData.date}
              onChange={(e) => handleChange('date', e.target.value)}
              error={!!errors.date}
              helperText={errors.date}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label="Start Time"
              type="time"
              value={formData.time}
              onChange={(e) => handleChange('time', e.target.value)}
              error={!!errors.time}
              helperText={errors.time}
              fullWidth
              InputLabelProps={{ shrink: true }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Schedule />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              label="End Time"
              type="time"
              value={formData.endTime}
              onChange={(e) => handleChange('endTime', e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Box>

          <TextField
            label="Amount (Optional)"
            type="number"
            value={formData.amount}
            onChange={(e) => handleChange('amount', e.target.value)}
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <AttachMoney />
                </InputAdornment>
              ),
            }}
          />

          <FormControl fullWidth>
            <InputLabel>Color</InputLabel>
            <Select
              value={formData.color}
              onChange={(e) => handleChange('color', e.target.value)}
              label="Color"
              startAdornment={
                <InputAdornment position="start">
                  <Palette />
                </InputAdornment>
              }
            >
              {colors.map(color => (
                <MenuItem key={color.value} value={color.value}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        backgroundColor: color.hex
                      }}
                    />
                    {color.name}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Description (Optional)"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            multiline
            rows={3}
            fullWidth
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        {event && (
          <Button onClick={handleDelete} color="error" sx={{ mr: 'auto' }}>
            Delete
          </Button>
        )}
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">
          {event ? 'Update' : 'Add'} Event
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddEditEventDialog;