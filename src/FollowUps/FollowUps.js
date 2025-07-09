// src/FollowUps/FollowUps.js
/*import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Paper,
} from "@mui/material";
import { format } from "date-fns";
import { doc, updateDoc } from "firebase/firestore";
import db from "../firebase";
import FollowUpScheduler from "./FollowUpScheduler";
import { shouldTriggerRecurringFollowUp } from "./FollowUpCycle";
import FollowUpNotes from "./FollowUpNotes";

const FollowUps = ({ clients, updateClientCommunication }) => {
  const [clientsNeedingFollowUp, setClientsNeedingFollowUp] = useState([]);

  useEffect(() => {
    filterClients();
  }, [clients]);

  const filterClients = () => {
    const today = new Date(new Date().toDateString());
    const cutoffDate = new Date(today.getFullYear(), today.getMonth(), 16);

    const filteredClients = clients.filter((client) => {
      const firstRaw = client.firstInstallmentDate;
      if (!firstRaw) return false;

      const firstInstallmentDate = firstRaw?.seconds
        ? new Date(firstRaw.seconds * 1000)
        : new Date(firstRaw);
      if (isNaN(firstInstallmentDate.getTime())) return false;

      const monthly = Number(client.installmentAmount || 500);
      const payments = Array.isArray(client.payments) ? client.payments : [];

      const validPayments = payments.filter((p) => {
        const date = new Date(p.date);
        return !isNaN(date.getTime()) && date >= firstInstallmentDate;
      });

      const validTotalPaid = validPayments.reduce(
        (sum, p) => sum + p.amount,
        0
      );
      const paymentsMade = Math.floor(validTotalPaid / monthly);

      const monthsSinceStart =
        (today.getFullYear() - firstInstallmentDate.getFullYear()) * 12 +
        (today.getMonth() - firstInstallmentDate.getMonth()) +
        1;

      const missedPayments = Math.max(0, monthsSinceStart - paymentsMade);
      const isPastDue = missedPayments > 0;

      const logs = client.communicationLog || client.communicationLogs || [];
      const validDates = logs
        .map((log) => new Date(log.timestamp || log.date))
        .filter((d) => !isNaN(d.getTime()));

      const lastContactDate = validDates.length
        ? validDates.sort((a, b) => b - a)[0]
        : null;

      const wasContactedAfterCutoff =
        lastContactDate && lastContactDate > cutoffDate;

      const nextFollowUp = client.nextFollowUpDate
        ? new Date(new Date(client.nextFollowUpDate).toDateString())
        : null;

      const needsFollowUp =
        (isPastDue && !wasContactedAfterCutoff && !nextFollowUp) ||
        (isPastDue && nextFollowUp && nextFollowUp <= today);

      return needsFollowUp;
    });

    setClientsNeedingFollowUp(filteredClients);
  };

  const updateFollowUpDate = async (clientId, newDate) => {
    try {
      const clientRef = doc(db, "clients", clientId);
      await updateDoc(clientRef, {
        nextFollowUpDate: newDate,
        lastFollowUpContactDate: new Date().toISOString(),
      });

      filterClients(); // Re-run filter to remove client if follow-up moved
    } catch (error) {
      console.error("Error updating next follow-up date:", error);
    }
  };

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        📌 Outstanding Client Follow-Ups
      </Typography>
      <Paper elevation={3}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <strong>Client Name</strong>
              </TableCell>
              <TableCell>Installment</TableCell>
              <TableCell>Payments Made</TableCell>
              <TableCell>Expected</TableCell>
              <TableCell>
                <strong>Amount Due</strong>
              </TableCell>
              <TableCell>
                <strong>MyCase</strong>
              </TableCell>
              <TableCell>
                <strong>Next Follow-Up</strong>
              </TableCell>
              <TableCell>Last Contact</TableCell>
              <TableCell>
                <strong>Note</strong>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {clientsNeedingFollowUp.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9}>
                  🎉 All follow-ups are complete for this month!
                </TableCell>
              </TableRow>
            ) : (
              clientsNeedingFollowUp.map((client) => {
                const monthly = Number(client.installmentAmount || 500);
                const payments = Array.isArray(client.payments)
                  ? client.payments
                  : [];

                const firstRaw = client.firstInstallmentDate;
                const firstInstallmentDate = firstRaw?.seconds
                  ? new Date(firstRaw.seconds * 1000)
                  : new Date(firstRaw);

                const validPayments = payments.filter((p) => {
                  const date = new Date(p.date);
                  return !isNaN(date.getTime()) && date >= firstInstallmentDate;
                });

                const validTotalPaid = validPayments.reduce(
                  (sum, p) => sum + p.amount,
                  0
                );
                const paymentsMade = Math.floor(validTotalPaid / monthly);

                const monthsSinceStart =
                  (new Date().getFullYear() -
                    firstInstallmentDate.getFullYear()) *
                    12 +
                  (new Date().getMonth() - firstInstallmentDate.getMonth()) +
                  1;

                const missedPayments = Math.max(
                  0,
                  monthsSinceStart - paymentsMade
                );
                const amountDue = missedPayments * monthly;

                const lastLog = (
                  client.communicationLog ||
                  client.communicationLogs ||
                  []
                )
                  .map((log) => new Date(log.timestamp || log.date))
                  .filter((d) => !isNaN(d.getTime()))
                  .sort((a, b) => b - a)[0];

                return (
                  <TableRow key={client.id}>
                    <TableCell>
                      {client.name ||
                        `${client.firstName || ""} ${client.lastName || ""}`}
                    </TableCell>
                    <TableCell>${monthly.toLocaleString()}</TableCell>
                    <TableCell>{paymentsMade}</TableCell>
                    <TableCell>{monthsSinceStart}</TableCell>
                    <TableCell>${amountDue.toLocaleString()}</TableCell>
                    <TableCell>
                      {client.myCaseLink ? (
                        <a
                          href={client.myCaseLink}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button variant="outlined">Open</Button>
                        </a>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      <FollowUpScheduler
                        client={client}
                        updateFollowUpDate={updateFollowUpDate}
                      />
                    </TableCell>
                    <TableCell>
                      {lastLog && !isNaN(lastLog.getTime())
                        ? format(lastLog, "MMMM d, yyyy")
                        : "No contact yet"}
                    </TableCell>
                    <TableCell>
                      <FollowUpNotes clientId={client.id} />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
};

export default FollowUps; */

// src/FollowUps/FollowUps.js
import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Paper,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import { Search as SearchIcon, Clear as ClearIcon } from "@mui/icons-material";
import { format } from "date-fns";
import { doc, updateDoc } from "firebase/firestore";
import db from "../firebase";
import FollowUpScheduler from "./FollowUpScheduler";
import { shouldTriggerRecurringFollowUp } from "./FollowUpCycle";
import FollowUpNotes from "./FollowUpNotes";
import CalendarView from "./CalendarView";

const FollowUps = ({ clients, updateClientCommunication }) => {
  const [clientsNeedingFollowUp, setClientsNeedingFollowUp] = useState([]);
  const [currentTab, setCurrentTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterField, setFilterField] = useState("all");
  const [maxAmountDue, setMaxAmountDue] = useState("");

  useEffect(() => {
    filterClients();
  }, [clients, maxAmountDue]);

  const filterClients = () => {
    const today = new Date(new Date().toDateString());
    const cutoffDate = new Date(today.getFullYear(), today.getMonth(), 16);

    const filteredClients = clients.filter((client) => {
      const firstRaw = client.firstInstallmentDate;
      if (!firstRaw) return false;

      const firstInstallmentDate = firstRaw?.seconds
        ? new Date(firstRaw.seconds * 1000)
        : new Date(firstRaw);
      if (isNaN(firstInstallmentDate.getTime())) return false;

      const monthly = Number(client.installmentAmount || 500);
      const payments = Array.isArray(client.payments) ? client.payments : [];

      const validPayments = payments.filter((p) => {
        const date = new Date(p.date);
        return !isNaN(date.getTime()) && date >= firstInstallmentDate;
      });

      const validTotalPaid = validPayments.reduce(
        (sum, p) => sum + p.amount,
        0
      );
      const paymentsMade = Math.floor(validTotalPaid / monthly);

      const monthsSinceStart =
        (today.getFullYear() - firstInstallmentDate.getFullYear()) * 12 +
        (today.getMonth() - firstInstallmentDate.getMonth()) +
        1;

      const missedPayments = Math.max(0, monthsSinceStart - paymentsMade);
      const isPastDue = missedPayments > 0;
      const amountDue = missedPayments * monthly;

      // Apply max amount due filter
      if (maxAmountDue && amountDue > parseFloat(maxAmountDue)) {
        return false;
      }

      const logs = client.communicationLog || client.communicationLogs || [];
      const validDates = logs
        .map((log) => new Date(log.timestamp || log.date))
        .filter((d) => !isNaN(d.getTime()));

      const lastContactDate = validDates.length
        ? validDates.sort((a, b) => b - a)[0]
        : null;

      const wasContactedAfterCutoff =
        lastContactDate && lastContactDate > cutoffDate;

      const nextFollowUp = client.nextFollowUpDate
        ? new Date(new Date(client.nextFollowUpDate).toDateString())
        : null;

      const needsFollowUp =
        (isPastDue && !wasContactedAfterCutoff && !nextFollowUp) ||
        (isPastDue && nextFollowUp && nextFollowUp <= today);

      return needsFollowUp;
    });

    setClientsNeedingFollowUp(filteredClients);
  };

  const updateFollowUpDate = async (clientId, newDate) => {
    try {
      const clientRef = doc(db, "clients", clientId);
      await updateDoc(clientRef, {
        nextFollowUpDate: newDate,
        lastFollowUpContactDate: new Date().toISOString(),
      });

      filterClients();
    } catch (error) {
      console.error("Error updating next follow-up date:", error);
    }
  };

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const getFilteredAndSearchedClients = () => {
    let filtered = clientsNeedingFollowUp;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((client) => {
        const searchLower = searchTerm.toLowerCase();
        const clientName = `${client.firstName || ""} ${client.lastName || ""}`.toLowerCase();
        const clientId = (client.id || "").toLowerCase();
        const installment = (client.installmentAmount || "").toString();
        const lastLog = (client.communicationLog || client.communicationLogs || [])
          .map((log) => new Date(log.timestamp || log.date))
          .filter((d) => !isNaN(d.getTime()))
          .sort((a, b) => b - a)[0];
        const lastContact = lastLog ? format(lastLog, "MMMM d, yyyy").toLowerCase() : "";

        switch (filterField) {
          case "id":
            return clientId.includes(searchLower);
          case "name":
            return clientName.includes(searchLower);
          case "installment":
            return installment.includes(searchLower);
          case "lastContact":
            return lastContact.includes(searchLower);
          case "all":
          default:
            return (
              clientId.includes(searchLower) ||
              clientName.includes(searchLower) ||
              installment.includes(searchLower) ||
              lastContact.includes(searchLower)
            );
        }
      });
    }

    return filtered;
  };

  const filteredClients = getFilteredAndSearchedClients();

  return (
    <Box sx={{ width: "100%", typography: "body1" }}>
      <Typography variant="h4" gutterBottom>
        Client Follow-Ups & Calendar
      </Typography>
      
      <Paper sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs 
          value={currentTab} 
          onChange={handleTabChange} 
          aria-label="follow-ups tabs"
          sx={{ 
            '& .MuiTab-root': { 
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '1rem'
            } 
          }}
        >
          <Tab label="📌 Outstanding Client Follow-Ups" />
          <Tab label="📅 Calendar" />
        </Tabs>
      </Paper>

      {currentTab === 0 && (
        <Box p={3}>
          {/* Filter Controls */}
          <Box sx={{ mb: 3, display: "flex", gap: 2, flexWrap: "wrap" }}>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Filter By</InputLabel>
              <Select
                value={filterField}
                label="Filter By"
                onChange={(e) => setFilterField(e.target.value)}
              >
                <MenuItem value="all">All Fields</MenuItem>
                <MenuItem value="id">ID</MenuItem>
                <MenuItem value="name">Client Name</MenuItem>
                <MenuItem value="installment">Installment</MenuItem>
                <MenuItem value="lastContact">Last Contact</MenuItem>
              </Select>
            </FormControl>

            <TextField
              size="small"
              placeholder={`Search by ${filterField === 'all' ? 'any field' : filterField}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ minWidth: 250 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchTerm("")}>
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              size="small"
              label="Maximum Amount Due"
              type="number"
              value={maxAmountDue}
              onChange={(e) => setMaxAmountDue(e.target.value)}
              sx={{ minWidth: 180 }}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
            />
          </Box>

          <Paper elevation={3}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>ID</strong></TableCell>
                  <TableCell><strong>Client Name</strong></TableCell>
                  <TableCell>Installment</TableCell>
                  <TableCell>Payments Made</TableCell>
                  <TableCell>Expected</TableCell>
                  <TableCell><strong>Amount Due</strong></TableCell>
                  <TableCell><strong>MyCase</strong></TableCell>
                  <TableCell><strong>Next Follow-Up</strong></TableCell>
                  <TableCell>Last Contact</TableCell>
                  <TableCell><strong>Note</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredClients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center">
                      {searchTerm || maxAmountDue
                        ? "No clients match your filters."
                        : "🎉 All follow-ups are complete for this month!"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClients.map((client) => {
                    const monthly = Number(client.installmentAmount || 500);
                    const payments = Array.isArray(client.payments)
                      ? client.payments
                      : [];

                    const firstRaw = client.firstInstallmentDate;
                    const firstInstallmentDate = firstRaw?.seconds
                      ? new Date(firstRaw.seconds * 1000)
                      : new Date(firstRaw);

                    const validPayments = payments.filter((p) => {
                      const date = new Date(p.date);
                      return !isNaN(date.getTime()) && date >= firstInstallmentDate;
                    });

                    const validTotalPaid = validPayments.reduce(
                      (sum, p) => sum + p.amount,
                      0
                    );
                    const paymentsMade = Math.floor(validTotalPaid / monthly);

                    const monthsSinceStart =
                      (new Date().getFullYear() -
                        firstInstallmentDate.getFullYear()) *
                        12 +
                      (new Date().getMonth() - firstInstallmentDate.getMonth()) +
                      1;

                    const missedPayments = Math.max(
                      0,
                      monthsSinceStart - paymentsMade
                    );
                    const amountDue = missedPayments * monthly;

                    const lastLog = (
                      client.communicationLog ||
                      client.communicationLogs ||
                      []
                    )
                      .map((log) => new Date(log.timestamp || log.date))
                      .filter((d) => !isNaN(d.getTime()))
                      .sort((a, b) => b - a)[0];

                    return (
                      <TableRow key={client.id}>
                        <TableCell>{client.id.substring(0, 8)}...</TableCell>
                        <TableCell>
                          {client.name ||
                            `${client.firstName || ""} ${client.lastName || ""}`}
                        </TableCell>
                        <TableCell>${monthly.toLocaleString()}</TableCell>
                        <TableCell>{paymentsMade}</TableCell>
                        <TableCell>{monthsSinceStart}</TableCell>
                        <TableCell>${amountDue.toLocaleString()}</TableCell>
                        <TableCell>
                          {client.myCaseLink ? (
                            <a
                              href={client.myCaseLink}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button variant="outlined" size="small">
                                Open
                              </Button>
                            </a>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>
                          <FollowUpScheduler
                            client={client}
                            updateFollowUpDate={updateFollowUpDate}
                          />
                        </TableCell>
                        <TableCell>
                          {lastLog && !isNaN(lastLog.getTime())
                            ? format(lastLog, "MMMM d, yyyy")
                            : "No contact yet"}
                        </TableCell>
                        <TableCell>
                          <FollowUpNotes clientId={client.id} />
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </Paper>
        </Box>
      )}

      {currentTab === 1 && (
        <Box p={3}>
          <CalendarView clients={clients} />
        </Box>
      )}
    </Box>
  );
};

export default FollowUps;
