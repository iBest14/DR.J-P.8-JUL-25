// src/FollowUps/CalendarViewShadcn.js
import React, { useState, useContext, createContext, useEffect } from "react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, 
         startOfMonth, endOfMonth, addMonths, subMonths, isToday, isSameDay, 
         startOfYear, eachMonthOfInterval, isSameMonth, addDays, subDays, 
         setHours, setMinutes } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { collection, query, orderBy, onSnapshot, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import db from "../firebase";
import PaymentPromiseSync from "./PaymentPromiseSync";
import { validateEvent } from "./eventSchema";
import { cn } from "../utils/cn"; // Utility for className concatenation

// Icons - Using Lucide React (ShadCN's preferred icon library)
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Plus,
  Clock,
  Sun,
  Moon,
  Filter,
  LayoutList,
  CalendarDays,
  X
} from "lucide-react";

// ShadCN UI style button component
const Button = ({ children, variant = "default", size = "default", className, ...props }) => {
  const baseStyles = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background";
  
  const variants = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    outline: "border border-input hover:bg-accent hover:text-accent-foreground",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  };
  
  const sizes = {
    default: "h-10 py-2 px-4 text-sm",
    sm: "h-9 px-3 rounded-md text-xs",
    lg: "h-11 px-8 rounded-md",
    icon: "h-10 w-10",
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
};

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
      <div className={cn("min-h-screen", isDarkMode && "dark")}>
        {children}
      </div>
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
    isDarkMode,
    toggleDarkMode,
  } = useCalendar();

  const [addEventOpen, setAddEventOpen] = useState(false);

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
    <div className="flex items-center justify-between mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePrevious}
          className="h-9 w-9"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <h2 className="text-xl font-semibold min-w-[200px] text-center">
          {getHeaderTitle()}
        </h2>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={handleNext}
          className="h-9 w-9"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentDate(new Date())}
          className="ml-2"
        >
          <CalendarIcon className="h-3 w-3 mr-1" />
          Today
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <Button
            variant={view === "day" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setView("day")}
            className="px-3"
          >
            DAY
          </Button>
          <Button
            variant={view === "week" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setView("week")}
            className="px-3"
          >
            WEEK
          </Button>
          <Button
            variant={view === "month" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setView("month")}
            className="px-3"
          >
            MONTH
          </Button>
          <Button
            variant={view === "year" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setView("year")}
            className="px-3"
          >
            YEAR
          </Button>
        </div>

        <Button
          variant="default"
          size="sm"
          onClick={() => setAddEventOpen(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-1" />
          ADD EVENT
        </Button>

        <div className="flex items-center space-x-1 ml-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTimeFormat}
            className="h-9 w-9"
          >
            <Clock className="h-4 w-4" />
            <span className="text-xs ml-1">{use24HourFormat ? "24" : "12"}</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            className="h-9 w-9"
          >
            {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
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

  return (
    <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
        {months.map((month) => (
          <motion.div
            key={month.getMonth()}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: month.getMonth() * 0.02 }}
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
              <h3 className="text-center font-semibold mb-3 text-gray-900 dark:text-gray-100">
                {format(month, "MMMM")}
              </h3>
              <MonthGrid 
                month={month}
                getEventsForDay={getEventsForDay}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// Month Grid Component
const MonthGrid = ({ month, getEventsForDay }) => {
  const monthStart = startOfMonth(month);
  const startDate = startOfWeek(monthStart);
  
  const days = [];
  let currentDate = startDate;
  
  for (let i = 0; i < 42; i++) {
    days.push(currentDate);
    currentDate = addDays(currentDate, 1);
  }

  return (
    <div className="w-full">
      {/* Days of week header */}
      <div className="grid grid-cols-7 mb-1">
        {["S", "M", "T", "W", "T", "F", "S"].map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 p-1"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar days */}
      <div className="grid grid-cols-7">
        {days.map((day, index) => {
          const isCurrentMonth = isSameMonth(day, month);
          const isToday = isSameDay(day, new Date());
          const dayEvents = getEventsForDay(day);
          const hasEvents = dayEvents.length > 0 && isCurrentMonth;

          return (
            <div
              key={index}
              className={cn(
                "aspect-square flex flex-col items-center justify-center relative p-1",
                hasEvents && "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 rounded"
              )}
            >
              <span
                className={cn(
                  "text-sm flex items-center justify-center w-7 h-7 rounded-full",
                  isToday && isCurrentMonth && "bg-blue-600 text-white font-semibold",
                  !isToday && isCurrentMonth && "text-gray-900 dark:text-gray-100",
                  !isCurrentMonth && "text-gray-400 dark:text-gray-600"
                )}
              >
                {format(day, "d")}
              </span>
              
              {hasEvents && (
                <div className="absolute bottom-1 flex gap-0.5">
                  {dayEvents.slice(0, 3).map((event, i) => {
                    const color = EVENT_COLORS.find(c => c.value === event.color)?.color || "#666";
                    return (
                      <div
                        key={i}
                        className="w-1 h-1 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Month View Component
const CalendarMonthView = () => {
  const { currentDate, events, selectedColors } = useCalendar();
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4"
    >
      <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
        {/* Days of week header */}
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="bg-gray-50 dark:bg-gray-800 p-3 text-center text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {days.map((day, index) => {
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isToday = isSameDay(day, new Date());
          const dayEvents = getEventsForDay(day);

          return (
            <div
              key={index}
              className={cn(
                "bg-white dark:bg-gray-900 min-h-[100px] p-2",
                !isCurrentMonth && "bg-gray-50 dark:bg-gray-800",
                isToday && "bg-blue-50 dark:bg-blue-900/20"
              )}
            >
              <div className="flex flex-col h-full">
                <span
                  className={cn(
                    "text-sm font-medium mb-1",
                    isToday && "text-blue-600 dark:text-blue-400",
                    !isCurrentMonth && "text-gray-400 dark:text-gray-600"
                  )}
                >
                  {format(day, "d")}
                </span>
                
                <div className="flex-1 space-y-1">
                  {dayEvents.slice(0, 3).map((event, i) => (
                    <EventChip key={i} event={event} />
                  ))}
                  {dayEvents.length > 3 && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      +{dayEvents.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

// Event Chip Component
const EventChip = ({ event }) => {
  const color = EVENT_COLORS.find(c => c.value === event.color)?.color || "#666";
  
  return (
    <div
      className="text-xs px-2 py-0.5 rounded truncate cursor-pointer hover:opacity-90 transition-opacity"
      style={{ backgroundColor: color, color: "white" }}
    >
      {event.title}
    </div>
  );
};

// Main Calendar View Component
const CalendarViewShadcn = ({ clients }) => {
  return (
    <CalendarProvider>
      <CalendarContent clients={clients} />
    </CalendarProvider>
  );
};

const CalendarContent = ({ clients }) => {
  const { view, setEvents } = useCalendar();
  const [eventsLoaded, setEventsLoaded] = useState(false);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const eventsQuery = query(
          collection(db, "calendarEvents"),
          orderBy("date", "asc")
        );
        
        const snapshot = await getDocs(eventsQuery);
        const eventsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setEvents(eventsData);
        setEventsLoaded(true);
      } catch (error) {
        console.error("Error loading events:", error);
        setEventsLoaded(true);
      }
    };

    loadEvents();

    const eventsQuery = query(
      collection(db, "calendarEvents"),
      orderBy("date", "asc")
    );

    const unsubscribe = onSnapshot(eventsQuery, (snapshot) => {
      const eventsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEvents(eventsData);
    });

    return () => unsubscribe();
  }, [setEvents]);

  if (!eventsLoaded) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <PaymentPromiseSync clients={clients} />
      <CalendarHeader />
      
      <AnimatePresence mode="wait">
        {view === "year" && <CalendarYearView key="year" />}
        {view === "month" && <CalendarMonthView key="month" />}
        {/* Add other views (day, week) here */}
      </AnimatePresence>
    </div>
  );
};

export default CalendarViewShadcn;