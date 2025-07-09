/*import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Divider,
  Box,
  List,
  ListItem,
  Chip,
  Grid,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import { Link } from "react-router-dom";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DateCalendar } from "@mui/x-date-pickers";
import { collection, getDocs } from "firebase/firestore";
import db from "./firebase";

function PromisedPaymentCalendar() {
  const [clients, setClients] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [promisesOnDate, setPromisesOnDate] = useState([]);
  const [selectedPromise, setSelectedPromise] = useState(null);

  useEffect(() => {
    const fetchClients = async () => {
      const snapshot = await getDocs(collection(db, "clients"));
      const allClients = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setClients(allClients);
    };
    fetchClients();
  }, []);

  const handleDateClick = (date) => {
    setSelectedDate(date);
    const matches = clients.filter(
      (client) =>
        client.paymentPromise?.date &&
        new Date(client.paymentPromise.date).toDateString() ===
          date.toDateString()
    );
    setPromisesOnDate(matches);
  };

  const today = new Date();
  const thisMonth = today.getMonth();
  const thisYear = today.getFullYear();

  const isMissed = (date) => {
    return new Date(date).setHours(0, 0, 0, 0) < today.setHours(0, 0, 0, 0);
  };

  const summary = clients.reduce(
    (acc, client) => {
      const promise = client.paymentPromise;
      if (!promise?.date || isNaN(new Date(promise.date))) return acc;

      const date = new Date(promise.date);
      const isSameDay = date.toDateString() === today.toDateString();

      if (date.getMonth() === thisMonth && date.getFullYear() === thisYear) {
        acc.totalThisMonth += parseFloat(promise.amount || 0);
      }

      if (isMissed(promise.date)) {
        acc.missed += 1;
      } else {
        acc.upcoming += 1;
      }

      if (isSameDay) {
        acc.today += 1;
      }

      return acc;
    },
    {
      totalThisMonth: 0,
      missed: 0,
      upcoming: 0,
      today: 0,
    }
  );

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 6 }}>
      <Box
        sx={{
          background: "linear-gradient(to right, #4e54c8, #8f94fb)",
          color: "white",
          borderRadius: "12px",
          padding: "2rem",
          mb: 4,
          textAlign: "center",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        }}
      >
        <Typography variant="h4" fontWeight={600}>
          🗓️ Promised Payment Calendar
        </Typography>
        <Typography variant="subtitle1" mt={1} sx={{ opacity: 0.9 }}>
          Track upcoming, missed, and completed payment promises
        </Typography>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          {
            label: "💰 Total Promised",
            value: `$${summary.totalThisMonth.toLocaleString()}`,
            color: "#4e54c8",
          },
          { label: "🔴 Missed", value: summary.missed, color: "#dc3545" },
          { label: "🟢 Upcoming", value: summary.upcoming, color: "#28a745" },
          { label: "📅 Today", value: summary.today, color: "#6c63ff" },
        ].map((card, idx) => (
          <Grid item xs={6} sm={3} key={idx}>
            <Paper
              elevation={3}
              sx={{
                p: 2,
                textAlign: "center",
                borderRadius: "16px",
                background: "rgba(255,255,255,0.75)",
                backdropFilter: "blur(6px)",
                boxShadow: "0 8px 20px rgba(0,0,0,0.05)",
              }}
            >
              <Typography
                variant="body2"
                sx={{ color: card.color, fontWeight: 600 }}
              >
                {card.label}
              </Typography>
              <Typography variant="h6" fontWeight={700}>
                {card.value}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* 📅 MUI Calendar Resized & Centered *//*}
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <DateCalendar
            value={selectedDate}
            onChange={(newDate) => handleDateClick(newDate)}
            sx={{
              backgroundColor: "#fff",
              borderRadius: "12px",
              boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
              p: 2,
              width: "100%",
              maxWidth: 500,
            }}
          />
        </Box>
      </LocalizationProvider>

      {promisesOnDate.length > 0 && (
        <Box mt={4}>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            💵 Promises on {selectedDate.toDateString()}
          </Typography>
          <List>
            {promisesOnDate.map((client) => (
              <ListItem
                key={client.id}
                onClick={() => setSelectedPromise(client)}
                sx={{
                  mb: 2,
                  px: 3,
                  py: 2,
                  backgroundColor: "#fff",
                  borderRadius: "16px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                  cursor: "pointer",
                  "&:hover": {
                    boxShadow: "0 6px 18px rgba(0,0,0,0.1)",
                    transform: "translateY(-2px)",
                    backgroundColor: "#f9f9ff",
                  },
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Box>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {client.firstName} {client.lastName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    💵 $
                    {parseFloat(client.paymentPromise.amount).toLocaleString()}
                  </Typography>
                  {client.paymentPromise.notes && (
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      📝 {client.paymentPromise.notes}
                    </Typography>
                  )}
                </Box>
                <Chip
                  label={
                    isMissed(client.paymentPromise.date) ? "Missed" : "Upcoming"
                  }
                  color={
                    isMissed(client.paymentPromise.date) ? "error" : "success"
                  }
                  size="small"
                />
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      <Dialog
        open={!!selectedPromise}
        onClose={() => setSelectedPromise(null)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: "16px", p: 2 } }}
      >
        {selectedPromise && (
          <>
            <DialogTitle sx={{ fontWeight: 700, pb: 0 }}>
              🔍 {selectedPromise.firstName} {selectedPromise.lastName}
            </DialogTitle>
            <DialogContent sx={{ pt: 1 }}>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body1" gutterBottom>
                  💵 <strong>Amount:</strong> $
                  {parseFloat(
                    selectedPromise.paymentPromise.amount
                  ).toLocaleString()}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  📅 <strong>Date:</strong>{" "}
                  {new Date(selectedPromise.paymentPromise.date).toDateString()}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  📝 <strong>Notes:</strong>{" "}
                  {selectedPromise.paymentPromise.notes || "None"}
                </Typography>
              </Box>
              <Chip
                label={
                  isMissed(selectedPromise.paymentPromise.date)
                    ? "Missed"
                    : "Upcoming"
                }
                color={
                  isMissed(selectedPromise.paymentPromise.date)
                    ? "error"
                    : "success"
                }
                sx={{ mt: 1 }}
              />
            </DialogContent>
            <DialogActions sx={{ pr: 3, pb: 2 }}>
              <Button
                variant="contained"
                component={Link}
                to={`/client/${selectedPromise?.id}`}
                onClick={() => setSelectedPromise(null)}
              >
                View Dashboard
              </Button>
              <Button onClick={() => setSelectedPromise(null)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  );
}

export default PromisedPaymentCalendar; */

// src/PromisedPaymentCalendar.js
import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  Chip,
} from "@mui/material";
import { collection, getDocs } from "firebase/firestore";
import db from "./firebase";
import { CalendarProvider } from "./contexts/CalendarContext";
import CalendarHeader from "./components/Calendar/CalendarHeader";
import CalendarMonthView from "./components/Calendar/CalendarMonthView";
import CalendarWeekView from "./components/Calendar/CalendarWeekView";
import CalendarDayView from "./components/Calendar/CalendarDayView";
import CalendarYearView from "./components/Calendar/CalendarYearView";
import { useCalendar } from "./contexts/CalendarContext";
import { motion, AnimatePresence } from "framer-motion";

// Componente interno que usa el contexto
function CalendarContent() {
  const { view, events } = useCalendar();
  const [summary, setSummary] = useState({
    totalThisMonth: 0,
    missed: 0,
    upcoming: 0,
    today: 0,
  });

  useEffect(() => {
    const today = new Date();
    const thisMonth = today.getMonth();
    const thisYear = today.getFullYear();

    const newSummary = events.reduce(
      (acc, event) => {
        const eventDate = new Date(event.date);
        const isSameDay = eventDate.toDateString() === today.toDateString();
        const isPast = eventDate < today;

        if (eventDate.getMonth() === thisMonth && eventDate.getFullYear() === thisYear) {
          acc.totalThisMonth += parseFloat(event.amount || 0);
        }

        if (isPast && !isSameDay) {
          acc.missed += 1;
        } else if (!isPast || isSameDay) {
          acc.upcoming += 1;
        }

        if (isSameDay) {
          acc.today += 1;
        }

        return acc;
      },
      {
        totalThisMonth: 0,
        missed: 0,
        upcoming: 0,
        today: 0,
      }
    );

    setSummary(newSummary);
  }, [events]);

  const renderView = () => {
    const variants = {
      initial: { opacity: 0, scale: 0.95 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.95 }
    };

    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial="initial"
          animate="animate"
          exit="exit"
          variants={variants}
          transition={{ duration: 0.2 }}
          style={{ height: '100%' }}
        >
          {view === 'day' && <CalendarDayView />}
          {view === 'week' && <CalendarWeekView />}
          {view === 'month' && <CalendarMonthView />}
          {view === 'year' && <CalendarYearView />}
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
    <>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          {
            label: "💰 Total Promised",
            value: `$${summary.totalThisMonth.toLocaleString()}`,
            color: "#6366f1",
            bgColor: "#e0e7ff",
          },
          { 
            label: "🔴 Missed", 
            value: summary.missed, 
            color: "#ef4444",
            bgColor: "#fee2e2",
          },
          { 
            label: "🟢 Upcoming", 
            value: summary.upcoming, 
            color: "#10b981",
            bgColor: "#d1fae5",
          },
          { 
            label: "📅 Today", 
            value: summary.today, 
            color: "#8b5cf6",
            bgColor: "#ede9fe",
          },
        ].map((card, idx) => (
          <Grid item xs={6} sm={3} key={idx}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  textAlign: "center",
                  borderRadius: "16px",
                  backgroundColor: card.bgColor,
                  border: `1px solid ${card.color}20`,
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                  }
                }}
              >
                <Typography
                  variant="h3"
                  sx={{ fontSize: '2rem', mb: 1 }}
                >
                  {card.label.split(' ')[0]}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: card.color, fontWeight: 600, mb: 1 }}
                >
                  {card.label.split(' ')[1]}
                </Typography>
                <Typography variant="h5" fontWeight={700}>
                  {card.value}
                </Typography>
              </Paper>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      <Paper 
        elevation={0}
        sx={{ 
          backgroundColor: 'background.paper',
          borderRadius: '20px',
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
          height: 'calc(100vh - 300px)',
          minHeight: '600px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <CalendarHeader />
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          {renderView()}
        </Box>
      </Paper>
    </>
  );
}

// Componente principal
function PromisedPaymentCalendar() {
  const [clients, setClients] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);

  useEffect(() => {
    const fetchClients = async () => {
      const snapshot = await getDocs(collection(db, "clients"));
      const allClients = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setClients(allClients);
      
      // Convertir promesas de pago a eventos del calendario
      const events = allClients
        .filter(client => client.paymentPromise?.date)
        .map(client => {
          const promiseDate = new Date(client.paymentPromise.date);
          const amount = parseFloat(client.paymentPromise.amount || 0);
          const isMissed = promiseDate < new Date().setHours(0, 0, 0, 0);
          
          return {
            id: client.id,
            title: `${client.firstName} ${client.lastName}`,
            date: client.paymentPromise.date,
            time: "09:00",
            endTime: "10:00",
            description: client.paymentPromise.notes || `Payment promise of $${amount.toLocaleString()}`,
            color: isMissed ? 'red' : 'green',
            amount: amount,
            clientData: client
          };
        });
      
      setCalendarEvents(events);
    };
    fetchClients();
  }, []);

  return (
    <CalendarProvider initialEvents={calendarEvents}>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 6 }}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Box
            sx={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              borderRadius: "20px",
              padding: "2.5rem",
              mb: 4,
              textAlign: "center",
              boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
            }}
          >
            <Typography variant="h3" fontWeight={700} gutterBottom>
              Payment Promise Calendar
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              Track and manage all payment promises in one place
            </Typography>
          </Box>
        </motion.div>

        <CalendarContent />
      </Container>
    </CalendarProvider>
  );
}

export default PromisedPaymentCalendar;
