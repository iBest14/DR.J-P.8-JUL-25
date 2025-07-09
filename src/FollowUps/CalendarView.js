// src/FollowUps/CalendarView.js
import React, { useState, useContext, createContext, useEffect } from "react";
import {
  Box,
  Paper,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Typography,
  Chip,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
  CircularProgress,
} from "@mui/material";
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Today as TodayIcon,
  Add as AddIcon,
  CalendarMonth as CalendarMonthIcon,
  ViewWeek as ViewWeekIcon,
  ViewDay as ViewDayIcon,
  ViewModule as ViewModuleIcon,
  WbSunny as SunIcon,
  DarkMode as MoonIcon,
  AccessTime as ClockIcon,
  FormatListBulleted as ListIcon,
  CalendarToday as CalendarIcon,
  FilterList as FilterIcon,
} from "@mui/icons-material";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, 
         startOfMonth, endOfMonth, addMonths, subMonths, isToday, isSameDay, 
         startOfYear, eachMonthOfInterval, getDaysInMonth, getDay, isSameMonth,
         addDays, subDays, setHours, setMinutes, isWithinInterval } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { collection, query, orderBy, onSnapshot, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import db from "../firebase";
import PaymentPromiseSync from "./PaymentPromiseSync";
import EnhancedEventDialog from "./EnhancedEventDialog";
import { validateEvent } from "./eventSchema";


// Calendar Context
const CalendarContext = createContext();

const CalendarProvider = ({ children }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState("month");
  const [events, setEvents] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
  const [use24HourFormat, setUse24HourFormat] = useState(true);
  const [isAgendaMode, setIsAgendaMode] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const value = {
    currentDate,
    setCurrentDate,
    view,
    setView,
    events,
    setEvents,
    selectedColors,
    setSelectedColors,
    use24HourFormat,
    toggleTimeFormat: () => setUse24HourFormat(!use24HourFormat),
    isAgendaMode,
    toggleAgendaMode: () => setIsAgendaMode(!isAgendaMode),
    isDarkMode,
    toggleDarkMode: () => setIsDarkMode(!isDarkMode),
    addEvent: (event) => setEvents([...events, { ...event, id: Date.now() }]),
    editEvent: (id, updatedEvent) => {
      setEvents(events.map(e => e.id === id ? { ...e, ...updatedEvent } : e));
    },
    deleteEvent: (id) => setEvents(events.filter(e => e.id !== id)),
  };

  return (
    <CalendarContext.Provider value={value}>
      {children}
    </CalendarContext.Provider>
  );
};

const useCalendar = () => {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error("useCalendar must be used within CalendarProvider");
  }
  return context;
};

// Event Colors
const EVENT_COLORS = [
  { value: "red", label: "Red", color: "#ef4444" },
  { value: "blue", label: "Blue", color: "#3b82f6" },
  { value: "green", label: "Green", color: "#10b981" },
  { value: "yellow", label: "Yellow", color: "#eab308" },
  { value: "purple", label: "Purple", color: "#8b5cf6" },
  { value: "pink", label: "Pink", color: "#ec4899" },
  { value: "orange", label: "Orange", color: "#f97316" },
];

// Calendar Header Component
const CalendarHeader = () => {
  const {
    currentDate,
    setCurrentDate,
    view,
    setView,
    use24HourFormat,
    toggleTimeFormat,
    isAgendaMode,
    toggleAgendaMode,
    isDarkMode,
    toggleDarkMode,
    selectedColors,
    setSelectedColors,
    addEvent: addEventToContext,
  } = useCalendar();

  const [addEventOpen, setAddEventOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  const handleAddEvent = async (eventData) => {
    try {
      const newEvent = {
        ...eventData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      const docRef = await addDoc(collection(db, "calendarEvents"), newEvent);
      console.log("Event added successfully");
    } catch (error) {
      console.error("Error adding event:", error);
    }
  };

  const handlePrevious = () => {
    switch (view) {
      case "day":
        setCurrentDate(subDays(currentDate, 1));
        break;
      case "week":
        setCurrentDate(subWeeks(currentDate, 1));
        break;
      case "month":
        setCurrentDate(subMonths(currentDate, 1));
        break;
      case "year":
        setCurrentDate(new Date(currentDate.getFullYear() - 1, 0, 1));
        break;
    }
  };

  const handleNext = () => {
    switch (view) {
      case "day":
        setCurrentDate(addDays(currentDate, 1));
        break;
      case "week":
        setCurrentDate(addWeeks(currentDate, 1));
        break;
      case "month":
        setCurrentDate(addMonths(currentDate, 1));
        break;
      case "year":
        setCurrentDate(new Date(currentDate.getFullYear() + 1, 0, 1));
        break;
    }
  };

  const getHeaderTitle = () => {
    switch (view) {
      case "day":
        return format(currentDate, "EEEE, MMMM d, yyyy");
      case "week":
        const start = startOfWeek(currentDate);
        const end = endOfWeek(currentDate);
        return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`;
      case "month":
        return format(currentDate, "MMMM yyyy");
      case "year":
        return format(currentDate, "yyyy");
      default:
        return "";
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        mb: 2,
        p: 2,
        bgcolor: isDarkMode ? "grey.900" : "background.paper",
        borderRadius: 2,
        boxShadow: 1,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <IconButton onClick={handlePrevious}>
          <ChevronLeftIcon />
        </IconButton>
        <Typography variant="h6" sx={{ minWidth: 200, textAlign: "center" }}>
          {getHeaderTitle()}
        </Typography>
        <IconButton onClick={handleNext}>
          <ChevronRightIcon />
        </IconButton>
        <IconButton onClick={() => setCurrentDate(new Date())}>
          <TodayIcon />
        </IconButton>
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <ToggleButtonGroup
          value={view}
          exclusive
          onChange={(e, newView) => newView && setView(newView)}
          size="small"
        >
          <ToggleButton value="day">
            <ViewDayIcon sx={{ mr: 0.5 }} /> Day
          </ToggleButton>
          <ToggleButton value="week">
            <ViewWeekIcon sx={{ mr: 0.5 }} /> Week
          </ToggleButton>
          <ToggleButton value="month">
            <CalendarMonthIcon sx={{ mr: 0.5 }} /> Month
          </ToggleButton>
          <ToggleButton value="year">
            <ViewModuleIcon sx={{ mr: 0.5 }} /> Year
          </ToggleButton>
        </ToggleButtonGroup>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setAddEventOpen(true)}
          size="small"
        >
          Add Event
        </Button>

        <Tooltip title="Toggle Agenda Mode">
          <IconButton onClick={toggleAgendaMode}>
            {isAgendaMode ? <CalendarIcon /> : <ListIcon />}
          </IconButton>
        </Tooltip>

        <Tooltip title="Toggle Time Format">
          <IconButton onClick={toggleTimeFormat}>
            <ClockIcon />
            <Typography variant="caption" sx={{ ml: 0.5 }}>
              {use24HourFormat ? "24" : "12"}
            </Typography>
          </IconButton>
        </Tooltip>

        <Tooltip title="Filter Events">
          <IconButton onClick={() => setFilterOpen(!filterOpen)}>
            <FilterIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title="Toggle Dark Mode">
          <IconButton onClick={toggleDarkMode}>
            {isDarkMode ? <SunIcon /> : <MoonIcon />}
          </IconButton>
        </Tooltip>
      </Box>

      <EnhancedEventDialog
        open={addEventOpen}
        onClose={() => setAddEventOpen(false)}
        onSave={handleAddEvent}
      />

      <FilterEventsMenu
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        anchorEl={filterOpen}
      />
    </Box>
  );
};

// Filter Events Menu
const FilterEventsMenu = ({ open, onClose }) => {
  const { selectedColors, setSelectedColors } = useCalendar();

  const toggleColor = (color) => {
    if (selectedColors.includes(color)) {
      setSelectedColors(selectedColors.filter(c => c !== color));
    } else {
      setSelectedColors([...selectedColors, color]);
    }
  };

  if (!open) return null;

  return (
    <Paper
      sx={{
        position: "absolute",
        top: 80,
        right: 20,
        p: 2,
        zIndex: 1000,
        minWidth: 200,
      }}
    >
      <Typography variant="subtitle2" gutterBottom>
        Filter by Color
      </Typography>
      {EVENT_COLORS.map((color) => (
        <Box
          key={color.value}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            p: 1,
            cursor: "pointer",
            "&:hover": { bgcolor: "action.hover" },
          }}
          onClick={() => toggleColor(color.value)}
        >
          <Box
            sx={{
              width: 20,
              height: 20,
              borderRadius: "50%",
              backgroundColor: color.color,
              border: selectedColors.includes(color.value) ? "3px solid #000" : "none",
            }}
          />
          <Typography>{color.label}</Typography>
        </Box>
      ))}
      <Button size="small" onClick={() => setSelectedColors([])} sx={{ mt: 1 }}>
        Clear Filters
      </Button>
    </Paper>
  );
};

// Month View Component
const CalendarMonthView = () => {
  const { currentDate, events, selectedColors, isDarkMode } = useCalendar();
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const getEventsForDay = (day) => {
    return events.filter(event => {
      if (selectedColors.length > 0 && !selectedColors.includes(event.color)) {
        return false;
      }
      return isSameDay(new Date(event.date), day);
    });
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setEditDialogOpen(true);
  };

  const handleEventUpdate = async (eventData) => {
    try {
      await updateDoc(doc(db, "calendarEvents", selectedEvent.id), {
        ...eventData,
        updatedAt: new Date().toISOString(),
      });
      setEditDialogOpen(false);
    } catch (error) {
      console.error("Error updating event:", error);
    }
  };

  const handleEventDelete = async (eventId) => {
    try {
      await deleteDoc(doc(db, "calendarEvents", eventId));
      setEditDialogOpen(false);
    } catch (error) {
      console.error("Error deleting event:", error);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <Grid container spacing={0} sx={{ border: 1, borderColor: "divider" }}>
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <Grid
              key={day}
              item
              xs={12 / 7}
              sx={{
                p: 1,
                borderRight: 1,
                borderBottom: 1,
                borderColor: "divider",
                bgcolor: isDarkMode ? "grey.800" : "grey.100",
                textAlign: "center",
                fontWeight: "bold",
              }}
            >
              <Typography variant="body2">{day}</Typography>
            </Grid>
          ))}

          {days.map((day, index) => {
            const dayEvents = getEventsForDay(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isCurrentDay = isToday(day);

            return (
              <Grid
                key={index}
                item
                xs={12 / 7}
                sx={{
                  minHeight: 100,
                  p: 1,
                  borderRight: 1,
                  borderBottom: 1,
                  borderColor: "divider",
                  bgcolor: isCurrentDay
                    ? isDarkMode
                      ? "primary.dark"
                      : "primary.light"
                    : isDarkMode
                    ? "grey.900"
                    : "background.paper",
                  opacity: isCurrentMonth ? 1 : 0.5,
                  cursor: "pointer",
                  "&:hover": {
                    bgcolor: isDarkMode ? "grey.800" : "grey.50",
                  },
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: isCurrentDay ? "bold" : "normal",
                    color: isCurrentDay ? "primary.contrastText" : "text.primary",
                  }}
                >
                  {format(day, "d")}
                </Typography>

                <Box sx={{ mt: 0.5 }}>
                  {dayEvents.slice(0, 3).map((event, i) => (
                    <EventChip 
                      key={i} 
                      event={event} 
                      onClick={() => handleEventClick(event)}
                    />
                  ))}
                  {dayEvents.length > 3 && (
                    <Typography variant="caption" color="text.secondary">
                      +{dayEvents.length - 3} more
                    </Typography>
                  )}
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </motion.div>

      {selectedEvent && (
        <EnhancedEventDialog
          open={editDialogOpen}
          onClose={() => {
            setEditDialogOpen(false);
            setSelectedEvent(null);
          }}
          event={selectedEvent}
          onSave={handleEventUpdate}
          onDelete={handleEventDelete}
        />
      )}
    </>
  );
};

// Week View Component
const CalendarWeekView = () => {
  const { currentDate, events, selectedColors, use24HourFormat, isDarkMode, isAgendaMode } = useCalendar();
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addEventData, setAddEventData] = useState(null);
  
  const weekStart = startOfWeek(currentDate);
  const weekEnd = endOfWeek(currentDate);
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getEventsForDayAndHour = (day, hour) => {
    return events.filter(event => {
      if (selectedColors.length > 0 && !selectedColors.includes(event.color)) {
        return false;
      }
      const eventDate = new Date(event.date);
      const eventStart = parseInt(event.startTime.split(":")[0]);
      const eventEnd = parseInt(event.endTime.split(":")[0]);
      
      return isSameDay(eventDate, day) && hour >= eventStart && hour < eventEnd;
    });
  };

  const handleEventUpdate = async (eventData) => {
    try {
      if (selectedEvent) {
        await updateDoc(doc(db, "calendarEvents", selectedEvent.id), {
          ...eventData,
          updatedAt: new Date().toISOString(),
        });
      } else {
        await addDoc(collection(db, "calendarEvents"), {
          ...eventData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
      setEditDialogOpen(false);
      setSelectedEvent(null);
      setAddEventData(null);
    } catch (error) {
      console.error("Error saving event:", error);
    }
  };

  const handleEventDelete = async (eventId) => {
    try {
      await deleteDoc(doc(db, "calendarEvents", eventId));
      setEditDialogOpen(false);
    } catch (error) {
      console.error("Error deleting event:", error);
    }
  };

  const handleTimeSlotClick = (day, hour) => {
    setAddEventData({
      date: format(day, "yyyy-MM-dd"),
      startTime: `${String(hour).padStart(2, "0")}:00`,
      endTime: `${String(hour + 1).padStart(2, "0")}:00`,
    });
    setSelectedEvent(null);
    setEditDialogOpen(true);
  };

  if (isAgendaMode) {
    return <AgendaView days={days} />;
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ duration: 0.3 }}
      >
        <Box sx={{ overflowX: "auto" }}>
          <Grid container>
            <Grid item xs={1} />
            {days.map((day) => (
              <Grid
                key={day.toString()}
                item
                xs={11 / 7}
                sx={{
                  p: 1,
                  borderBottom: 1,
                  borderColor: "divider",
                  textAlign: "center",
                  bgcolor: isToday(day) 
                    ? isDarkMode ? "primary.dark" : "primary.light"
                    : isDarkMode ? "grey.800" : "grey.100",
                }}
              >
                <Typography variant="body2" fontWeight="bold">
                  {format(day, "EEE")}
                </Typography>
                <Typography variant="h6">
                  {format(day, "d")}
                </Typography>
              </Grid>
            ))}
          </Grid>

          <Box sx={{ maxHeight: 600, overflowY: "auto" }}>
            {hours.map((hour) => (
              <Grid container key={hour}>
                <Grid
                  item
                  xs={1}
                  sx={{
                    p: 1,
                    borderRight: 1,
                    borderBottom: 1,
                    borderColor: "divider",
                    textAlign: "right",
                  }}
                >
                  <Typography variant="caption">
                    {use24HourFormat ? `${hour}:00` : format(setHours(new Date(), hour), "h a")}
                  </Typography>
                </Grid>
                {days.map((day) => {
                  const dayEvents = getEventsForDayAndHour(day, hour);
                  return (
                    <Grid
                      key={`${day}-${hour}`}
                      item
                      xs={11 / 7}
                      sx={{
                        minHeight: 60,
                        borderRight: 1,
                        borderBottom: 1,
                        borderColor: "divider",
                        position: "relative",
                        "&:hover": {
                          bgcolor: isDarkMode ? "grey.800" : "action.hover",
                        },
                      }}
                      onClick={() => dayEvents.length === 0 && handleTimeSlotClick(day, hour)}
                    >
                      <DroppableTimeSlot day={day} hour={hour}>
                        {dayEvents.map((event, i) => (
                          <DraggableEvent 
                            key={i} 
                            event={event}
                            onEdit={(event) => {
                              setSelectedEvent(event);
                              setEditDialogOpen(true);
                            }}
                          />
                        ))}
                      </DroppableTimeSlot>
                    </Grid>
                  );
                })}
              </Grid>
            ))}
          </Box>
        </Box>
      </motion.div>

      <EnhancedEventDialog
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setSelectedEvent(null);
          setAddEventData(null);
        }}
        event={selectedEvent}
        defaultDate={addEventData?.date}
        defaultTime={addEventData?.startTime}
        onSave={handleEventUpdate}
        onDelete={selectedEvent ? handleEventDelete : undefined}
      />
    </>
  );
};

// Day View Component
const CalendarDayView = () => {
  const { currentDate, events, selectedColors, use24HourFormat, isDarkMode, isAgendaMode } = useCalendar();
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinutes = now.getMinutes();

  const getEventsForHour = (hour) => {
    return events.filter(event => {
      if (selectedColors.length > 0 && !selectedColors.includes(event.color)) {
        return false;
      }
      const eventDate = new Date(event.date);
      const eventStart = parseInt(event.startTime.split(":")[0]);
      const eventEnd = parseInt(event.endTime.split(":")[0]);
      
      return isSameDay(eventDate, currentDate) && hour >= eventStart && hour < eventEnd;
    });
  };

  const getCurrentEvents = () => {
    return events.filter(event => {
      const eventDate = new Date(event.date);
      if (!isSameDay(eventDate, now)) return false;
      
      const [startHour, startMin] = event.startTime.split(":").map(Number);
      const [endHour, endMin] = event.endTime.split(":").map(Number);
      
      const eventStart = startHour * 60 + startMin;
      const eventEnd = endHour * 60 + endMin;
      const currentTime = currentHour * 60 + currentMinutes;
      
      return currentTime >= eventStart && currentTime < eventEnd;
    });
  };

  if (isAgendaMode) {
    return <AgendaView days={[currentDate]} />;
  }

  const currentEvents = getCurrentEvents();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
    >
      {isToday(currentDate) && currentEvents.length > 0 && (
        <Paper
          sx={{
            p: 2,
            mb: 2,
            bgcolor: isDarkMode ? "primary.dark" : "primary.light",
            borderRadius: 2,
          }}
        >
          <Typography variant="h6" gutterBottom>
            Happening Now
          </Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {currentEvents.map((event, i) => (
              <EventChip key={i} event={event} showTime />
            ))}
          </Box>
        </Paper>
      )}

      <Box sx={{ maxHeight: 600, overflowY: "auto" }}>
        {hours.map((hour) => {
          const hourEvents = getEventsForHour(hour);
          const isCurrentHour = isToday(currentDate) && hour === currentHour;

          return (
            <Box
              key={hour}
              sx={{
                display: "flex",
                borderBottom: 1,
                borderColor: "divider",
                bgcolor: isCurrentHour 
                  ? isDarkMode ? "action.selected" : "action.hover"
                  : "transparent",
              }}
            >
              <Box
                sx={{
                  width: 80,
                  p: 2,
                  borderRight: 1,
                  borderColor: "divider",
                  textAlign: "right",
                }}
              >
                <Typography variant="caption">
                  {use24HourFormat ? `${hour}:00` : format(setHours(new Date(), hour), "h a")}
                </Typography>
              </Box>
              <Box sx={{ flex: 1, p: 1, minHeight: 60, position: "relative" }}>
                <DroppableTimeSlot day={currentDate} hour={hour}>
                  {hourEvents.map((event, i) => (
                    <DraggableEvent key={i} event={event} fullWidth />
                  ))}
                </DroppableTimeSlot>
                {isCurrentHour && (
                  <Box
                    sx={{
                      position: "absolute",
                      top: `${(currentMinutes / 60) * 100}%`,
                      left: 0,
                      right: 0,
                      height: 2,
                      bgcolor: "error.main",
                      "&::before": {
                        content: '""',
                        position: "absolute",
                        left: -8,
                        top: -4,
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        bgcolor: "error.main",
                      },
                    }}
                  />
                )}
              </Box>
            </Box>
          );
        })}
      </Box>
    </motion.div>
  );
};

// Year View Component
const CalendarYearView = () => {
  const { currentDate, events, selectedColors } = useCalendar();
  const year = currentDate.getFullYear();
  const months = Array.from({ length: 12 }, (_, i) => new Date(year, i, 1));

  const getEventsForDay = (day) => {
    return events.filter(event => {
      if (selectedColors.length > 0 && !selectedColors.includes(event.color)) {
        return false;
      }
      return isSameDay(new Date(event.date), day);
    });
  };

  const [selectedDay, setSelectedDay] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleDayClick = (day, events) => {
    if (events.length > 0) {
      setSelectedDay({ day, events });
      setDialogOpen(true);
    }
  };

  return (
    <Box
      sx={{
        bgcolor: "#f5f5f5",
        p: 3,
        minHeight: "100vh",
      }}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 3,
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        {months.map((month) => (
          <Paper
            key={month.getMonth()}
            elevation={0}
            sx={{
              bgcolor: "white",
              borderRadius: 2,
              overflow: "hidden",
              border: "1px solid #e0e0e0",
              transition: "all 0.2s ease",
              "&:hover": {
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              },
            }}
          >
            <Box sx={{ p: 2.5 }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  textAlign: "center",
                  mb: 2,
                  fontSize: "1rem",
                  fontWeight: 600,
                  color: "#1a1a1a",
                }}
              >
                {format(month, "MMMM")}
              </Typography>
              
              {/* Days of week header */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, 1fr)",
                  gap: 0,
                  mb: 1,
                }}
              >
                {["S", "M", "T", "W", "T", "F", "S"].map((day) => (
                  <Box
                    key={day}
                    sx={{
                      textAlign: "center",
                      fontSize: "0.75rem",
                      color: "#666",
                      fontWeight: 500,
                      p: 0.5,
                    }}
                  >
                    {day}
                  </Box>
                ))}
              </Box>

              {/* Calendar days */}
              <MonthGrid 
                month={month}
                getEventsForDay={getEventsForDay}
                onDayClick={handleDayClick}
              />
            </Box>
          </Paper>
        ))}
      </Box>

      <EventListDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        selectedDay={selectedDay}
      />
    </Box>
  );
};

// Month Grid Component
const MonthGrid = ({ month, getEventsForDay, onDayClick }) => {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const startDate = startOfWeek(monthStart);
  
  // Always create a 6-week grid (42 days)
  const days = [];
  let currentDate = startDate;
  
  for (let i = 0; i < 42; i++) {
    days.push(currentDate);
    currentDate = addDays(currentDate, 1);
  }

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(7, 1fr)",
        gap: 0,
      }}
    >
      {days.map((day, index) => {
        const isCurrentMonth = isSameMonth(day, month);
        const isToday = isSameDay(day, new Date());
        const dayEvents = getEventsForDay(day);
        const hasEvents = dayEvents.length > 0 && isCurrentMonth;

        return (
          <Box
            key={index}
            onClick={() => isCurrentMonth && onDayClick(day, dayEvents)}
            sx={{
              aspectRatio: "1",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              cursor: hasEvents ? "pointer" : "default",
              p: 0.5,
              "&:hover": hasEvents ? {
                bgcolor: "rgba(0,0,0,0.04)",
                borderRadius: 1,
              } : {},
            }}
          >
            <Box
              sx={{
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "50%",
                bgcolor: isToday && isCurrentMonth ? "#1976d2" : "transparent",
                color: isToday && isCurrentMonth ? "white" : isCurrentMonth ? "#333" : "#ccc",
                fontSize: "0.875rem",
                fontWeight: isToday ? 600 : 400,
                transition: "all 0.2s ease",
              }}
            >
              {format(day, "d")}
            </Box>
            
            {/* Event indicators */}
            {hasEvents && (
              <Box
                sx={{
                  position: "absolute",
                  bottom: "20%",
                  display: "flex",
                  gap: "3px",
                  alignItems: "center",
                }}
              >
                {dayEvents.slice(0, 3).map((event, i) => {
                  const color = EVENT_COLORS.find(c => c.value === event.color)?.color || "#666";
                  return (
                    <Box
                      key={i}
                      sx={{
                        width: 4,
                        height: 4,
                        borderRadius: "50%",
                        bgcolor: color,
                      }}
                    />
                  );
                })}
                {dayEvents.length > 3 && (
                  <Typography sx={{ fontSize: "0.6rem", color: "#999", ml: 0.5 }}>
                    +{dayEvents.length - 3}
                  </Typography>
                )}
              </Box>
            )}
          </Box>
        );
      })}
    </Box>
  );
};



// Event List Dialog for Year View
const EventListDialog = ({ open, onClose, selectedDay }) => {
  const { use24HourFormat } = useCalendar();

  if (!selectedDay) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Events on {format(selectedDay.day, "MMMM d, yyyy")}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {selectedDay.events.map((event, i) => (
            <Paper key={i} sx={{ p: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    bgcolor: EVENT_COLORS.find(c => c.value === event.color)?.color || "#000",
                  }}
                />
                <Typography variant="subtitle1" fontWeight="bold">
                  {event.title}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {use24HourFormat 
                  ? `${event.startTime} - ${event.endTime}`
                  : `${format(setHours(setMinutes(new Date(), parseInt(event.startTime.split(":")[1])), parseInt(event.startTime.split(":")[0])), "h:mm a")} - ${format(setHours(setMinutes(new Date(), parseInt(event.endTime.split(":")[1])), parseInt(event.endTime.split(":")[0])), "h:mm a")}`
                }
              </Typography>
              {event.description && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {event.description}
                </Typography>
              )}
            </Paper>
          ))}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

// Agenda View Component
const AgendaView = ({ days }) => {
  const { events, selectedColors, use24HourFormat } = useCalendar();

  const getEventsForDays = () => {
    return events
      .filter(event => {
        if (selectedColors.length > 0 && !selectedColors.includes(event.color)) {
          return false;
        }
        const eventDate = new Date(event.date);
        return days.some(day => isSameDay(eventDate, day));
      })
      .sort((a, b) => {
        const dateA = new Date(`${a.date} ${a.startTime}`);
        const dateB = new Date(`${b.date} ${b.startTime}`);
        return dateA - dateB;
      });
  };

  const sortedEvents = getEventsForDays();

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Agenda View
      </Typography>
      {sortedEvents.length === 0 ? (
        <Typography color="text.secondary">No events scheduled</Typography>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {sortedEvents.map((event, i) => (
            <Paper key={i} sx={{ p: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Box
                  sx={{
                    width: 4,
                    height: 40,
                    bgcolor: EVENT_COLORS.find(c => c.value === event.color)?.color || "#000",
                    borderRadius: 1,
                  }}
                />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {event.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {format(new Date(event.date), "EEEE, MMMM d")} • {" "}
                    {use24HourFormat 
                      ? `${event.startTime} - ${event.endTime}`
                      : `${format(setHours(setMinutes(new Date(), parseInt(event.startTime.split(":")[1])), parseInt(event.startTime.split(":")[0])), "h:mm a")} - ${format(setHours(setMinutes(new Date(), parseInt(event.endTime.split(":")[1])), parseInt(event.endTime.split(":")[0])), "h:mm a")}`
                    }
                  </Typography>
                  {event.description && (
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      {event.description}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Paper>
          ))}
        </Box>
      )}
    </Box>
  );
};

// Event Chip Component
const EventChip = ({ event, showTime = false, onClick }) => {
  const { use24HourFormat } = useCalendar();
  const color = EVENT_COLORS.find(c => c.value === event.color)?.color || "#000";

  return (
    <Chip
      label={
        showTime && use24HourFormat
          ? `${event.startTime} ${event.title}`
          : showTime
          ? `${format(setHours(setMinutes(new Date(), parseInt(event.startTime.split(":")[1])), parseInt(event.startTime.split(":")[0])), "h:mm a")} ${event.title}`
          : event.title
      }
      size="small"
      onClick={onClick}
      sx={{
        bgcolor: color,
        color: "#fff",
        fontSize: "0.75rem",
        height: 20,
        mb: 0.5,
        maxWidth: "100%",
        cursor: onClick ? "pointer" : "default",
        "&:hover": onClick ? {
          filter: "brightness(0.9)",
        } : {},
      }}
    />
  );
};

// Draggable Event Component
const DraggableEvent = ({ event, fullWidth = false, onEdit }) => {
  const color = EVENT_COLORS.find(c => c.value === event.color)?.color || "#000";

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      style={{ width: fullWidth ? "100%" : "auto" }}
      onClick={() => onEdit && onEdit(event)}
    >
      <Paper
        sx={{
          p: 1,
          bgcolor: color,
          color: "#fff",
          cursor: "pointer",
          borderRadius: 1,
          mb: 0.5,
        }}
      >
        <Typography variant="caption" sx={{ fontWeight: "bold" }}>
          {event.title}
        </Typography>
      </Paper>
    </motion.div>
  );
};

// Droppable Time Slot Component
const DroppableTimeSlot = ({ day, hour, children }) => {
  const [isOver, setIsOver] = useState(false);

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        minHeight: 40,
        bgcolor: isOver ? "action.hover" : "transparent",
        transition: "background-color 0.2s",
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsOver(false);
        // Handle drop logic here
      }}
    >
      {children}
    </Box>
  );
};

// Main Calendar View Component
const CalendarView = ({ clients }) => {

  // Convert client data to events
  const clientEvents = clients
    .filter(client => client.paymentPromise?.date)
    .map(client => ({
      id: client.id,
      title: `${client.firstName} ${client.lastName} - ${client.paymentPromise.amount}`,
      date: client.paymentPromise.date,
      startTime: "09:00",
      endTime: "10:00",
      color: new Date(client.paymentPromise.date) < new Date() ? "red" : "green",
      description: client.paymentPromise.notes || `Payment promise for ${client.firstName} ${client.lastName}`,
    }));

  return (
    <CalendarProvider>
      <CalendarViewContent events={clientEvents} />
    </CalendarProvider>
  );
};

// Este componente ya se monta *dentro* del Provider
const CalendarViewContent = ({ events }) => {
  const { view, setEvents } = useCalendar();

  useEffect(() => {
    setEvents(events);
  }, [events, setEvents]);

  return (
    <Box sx={{ width: "100%", height: "100%" }}>
      <CalendarHeader />
      <AnimatePresence mode="wait">
        {view === "day" && <CalendarDayView />}
        {view === "week" && <CalendarWeekView />}
        {view === "month" && <CalendarMonthView />}
        {view === "year" && <CalendarYearView />}
      </AnimatePresence>
    </Box>
  );
};

export default CalendarView;



/*// Main Calendar View Component
const CalendarView = ({ clients }) => {

  // Convert client data to events
  const clientEvents = clients
    .filter(client => client.paymentPromise?.date)
    .map(client => ({
      id: client.id,
      title: `${client.firstName} ${client.lastName} - ${client.paymentPromise.amount}`,
      date: client.paymentPromise.date,
      startTime: "09:00",
      endTime: "10:00",
      color: new Date(client.paymentPromise.date) < new Date() ? "red" : "green",
      description: client.paymentPromise.notes || `Payment promise for ${client.firstName} ${client.lastName}`,
    }));

  return (
    <CalendarProvider>
      <CalendarViewContent events={clientEvents} />
    </CalendarProvider>
  );
};

// Este componente ya se monta *dentro* del Provider
const CalendarViewContent = ({ events }) => {
  const { view, setEvents } = useCalendar();

  useEffect(() => {
    setEvents(events);
  }, [events, setEvents]);

  return (
    <Box sx={{ width: "100%", height: "100%" }}>
      <CalendarHeader />
      <AnimatePresence mode="wait">
        {view === "day" && <CalendarDayView />}
        {view === "week" && <CalendarWeekView />}
        {view === "month" && <CalendarMonthView />}
        {view === "year" && <CalendarYearView />}
      </AnimatePresence>
    </Box>
  );
};*/