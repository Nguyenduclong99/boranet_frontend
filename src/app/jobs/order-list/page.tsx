"use client";
import "react-datepicker/dist/react-datepicker.css";
import React, { useState, useEffect, useCallback } from "react";
import { format, parseISO, subDays, differenceInDays } from "date-fns";
import {
  Container,
  Grid,
  Paper,
  Typography,
  IconButton,
  Table,
  TableContainer,
  TableRow,
  TableCell,
  TableBody,
  useMediaQuery,
  FormControlLabel,
  Checkbox,
  FormGroup,
  FormControl,
  Radio,
  RadioGroup,
  Button,
  TextField,
  Box,
  Chip,
  Avatar,
  Stack,
  Tooltip,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import DateRangeIcon from "@mui/icons-material/DateRange";
import DatePicker from "react-datepicker";
import EnhancedTableHead from "@/components/ui/EnhancedTableHead";
import { useRouter } from "next/navigation";
import { isTokenExpired } from "@/lib/utils";
import Cookies from "js-cookie";
import { useAppContext } from "@/app/app-provider";

interface User {
  createdAt: string;
  updatedAt: string;
  id: number;
  name: string;
  username: string;
  email: string;
  phone: string;
  title: string;
  employmentType: string;
  auth: string;
  roles: Array<{
    id: number;
    name: string;
  }>;
}

interface WorkOrder {
  id: number;
  title: string;
  description: string;
  requesterName: string;
  category: string;
  priority: string;
  status: string;
  statusId: number;
  cd: string;
  region: string;
  assignees: User[];
  requesterBy: string;
  customer: string;
  dueDate: string;
  createdAt: string;
  completedAt: string | null;
}

interface ApiResponse {
  listJob: WorkOrder[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

const WorkOrderDashboard = () => {
  const router = useRouter();
  const { user } = useAppContext();
  const username = user?.username || user?.email || null;

  useEffect(() => {
    if (isTokenExpired()) {
      Cookies.remove("accessToken");
      Cookies.remove("accessTokenExpiresAt");
      router.push("/login");
    }
  }, [router]);

  const [fromDate, setFromDate] = useState<Date | null>(subDays(new Date(), 7));
  const [toDate, setToDate] = useState<Date | null>(new Date());
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterSentReceived, setFilterSentReceived] = useState<
    "All" | "Sent" | "Received"
  >("All");
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const [orderBy, setOrderBy] = useState<keyof WorkOrder>("id");
  const [showFilters, setShowFilters] = useState(false);

  const isSmallScreen = useMediaQuery("(max-width: 600px)");
  const isMediumScreen = useMediaQuery("(max-width: 960px)");
  const API_GET_LIST_JOB = process.env.NEXT_PUBLIC_BACKEND_API_URL
    ? `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/jobs`
    : "http://localhost:8081/api/jobs";

  const fetchWorkOrders = useCallback(
    async (fromDate?: string | null, toDate?: string | null) => {
      const token = Cookies.get("accessToken");

      if (!token) {
        router.push("/login");
        return;
      }

      let url = API_GET_LIST_JOB;
      const params = new URLSearchParams();

      if (fromDate) {
        params.append("fromDate", format(fromDate, "yyyy-MM-dd'T'HH:mm:ss"));
      }
      if (toDate) {
        params.append("toDate", format(toDate, "yyyy-MM-dd'T'HH:mm:ss"));
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      try {
        const response = await fetch(url, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data: ApiResponse = await response.json();
        setWorkOrders(data.listJob);
      } catch (error) {
        console.error("Error fetching work orders:", error);
      }
    },
    [API_GET_LIST_JOB, router]
  );

  useEffect(() => {
    fetchWorkOrders();
  }, [fetchWorkOrders]);

  const handleRequestSort =
    (property: keyof WorkOrder) => (_event: React.MouseEvent<unknown>) => {
      const isAsc = orderBy === property && order === "asc";
      setOrder(isAsc ? "desc" : "asc");
      setOrderBy(property);
    };

  const calculateDfDays = (dueDate: string, completedAt: string | null) => {
    if (completedAt) {
      return 0;
    }
    const today = new Date();
    const due = parseISO(dueDate);
    if (due < today) {
      return differenceInDays(today, due);
    }
    return 0;
  };

  const sortedWorkOrders = [...workOrders].sort((a, b) => {
    if (orderBy) {
      if (orderBy === "assignees") {
        const aAssigneeNames =
          a.assignees?.map((assignee) => assignee.name).join(", ") || "";
        const bAssigneeNames =
          b.assignees?.map((assignee) => assignee.name).join(", ") || "";
        if (aAssigneeNames < bAssigneeNames) {
          return order === "asc" ? -1 : 1;
        }
        if (aAssigneeNames > bAssigneeNames) {
          return order === "asc" ? 1 : -1;
        }
      } else if (orderBy === "dueDate") {
        const dateA = a.dueDate ? parseISO(a.dueDate) : null;
        const dateB = b.dueDate ? parseISO(b.dueDate) : null;

        if (dateA && dateB) {
          if (dateA < dateB) {
            return order === "asc" ? -1 : 1;
          }
          if (dateA > dateB) {
            return order === "asc" ? 1 : -1;
          }
        } else if (dateA) {
          return order === "asc" ? -1 : 1;
        } else if (dateB) {
          return order === "asc" ? 1 : -1;
        }
      } else if (orderBy === "createdAt") {
        const dateA = a.createdAt ? parseISO(a.createdAt) : null;
        const dateB = b.createdAt ? parseISO(b.createdAt) : null;

        if (dateA && dateB) {
          if (dateA < dateB) {
            return order === "asc" ? -1 : 1;
          }
          if (dateA > dateB) {
            return order === "asc" ? 1 : -1;
          }
        } else if (dateA) {
          return order === "asc" ? -1 : 1;
        } else if (dateB) {
          return order === "asc" ? 1 : -1;
        }
      } else {
        if (a[orderBy] < b[orderBy]) {
          return order === "asc" ? -1 : 1;
        }
        if (a[orderBy] > b[orderBy]) {
          return order === "asc" ? 1 : -1;
        }
      }
    }
    return 0;
  });

  const statusColors: Record<string, string> = {
    Open: "#ff9800",
    Processing: "#2196f3",
    Request: "#9c27b0",
    Complete: "#4caf50",
    "Return for Revision": "#f44336",
    Pending: "#607d8b",
  };

  const priorityColors: Record<string, string> = {
    High: "#f44336",
    Medium: "#ff9800",
    Low: "#4caf50",
  };

  const tableHeadCells = React.useMemo(() => {
    const baseCells = [
      { id: "id", label: "ID", width: "5%" },
      { id: "ticketNo", label: "Ticket No", width: "8%" },
      { id: "region", label: "Region", width: "5%" },
      { id: "category", label: "Category", width: "10%" },
      { id: "customer", label: "Customer", width: "10%" },
      { id: "title", label: "Title", width: "20%" },
      { id: "priority", label: "Priority", width: "5%" },
      { id: "status", label: "Status", width: "10%" },
      { id: "cd", label: "CD", width: "5%" },
      { id: "requesterBy", label: "Requester", width: "10%" },
      { id: "assignees", label: "Owner", width: "10%" },
      { id: "createdAt", label: "Created", width: "8%" },
      { id: "dueDate", label: "Due Date", width: "8%" },
      { id: "dfDays", label: "Delay", width: "5%" },
    ];

    if (isSmallScreen) {
      return baseCells
        .filter((cell) =>
          ["id", "title", "status", "dueDate", "dfDays"].includes(cell.id)
        )
        .map((cell) => ({
          ...cell,
          width: cell.id === "title" ? "40%" : "15%",
        }));
    } else if (isMediumScreen) {
      return baseCells
        .filter((cell) =>
          ["id", "title", "category", "status", "dueDate", "dfDays"].includes(
            cell.id
          )
        )
        .map((cell) => ({
          ...cell,
          width: cell.id === "title" ? "30%" : "14%",
        }));
    }
    return baseCells;
  }, [isSmallScreen, isMediumScreen]);

  const handleStatusFilterChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { value, checked } = event.target;
    setFilterStatus((prev) =>
      checked ? [...prev, value] : prev.filter((s) => s !== value)
    );
  };

  const handleSentReceivedFilterChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFilterSentReceived(event.target.value as "All" | "Sent" | "Received");
  };

  const filteredWorkOrders = sortedWorkOrders.filter((order) => {
    const statusMatch =
      filterStatus.length === 0 || filterStatus.includes(order.status);
    const sentReceivedMatch =
      filterSentReceived === "All" ||
      (filterSentReceived === "Sent" &&
        order.assignees &&
        order.assignees.length > 0) ||
      (filterSentReceived === "Received" && order.requesterBy);
    return statusMatch && sentReceivedMatch;
  });

  const handleSearchClick = () => {
    fetchWorkOrders(fromDate, toDate);
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 2, px: { xs: 1, sm: 2 } }}>
      {/* Header Section - Made more compact for mobile */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          {username ? `${username}'s Work Orders` : "Work Orders"}
        </Typography>
      </Box>

      {/* Date Filter Section - Improved for mobile */}
      <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
        <Grid container spacing={1} alignItems="center">
          <Grid item xs={12} sm="auto">
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{ flexWrap: "wrap" }}
            >
              <DateRangeIcon
                color="action"
                sx={{ display: { xs: "none", sm: "block" } }}
              />
              <DatePicker
                selected={fromDate}
                onChange={(date: Date | null) => setFromDate(date)}
                dateFormat="dd/MM/yyyy"
                placeholderText="From"
                customInput={
                  <TextField
                    size="small"
                    label={isSmallScreen ? "From" : "From Date"}
                    variant="outlined"
                    sx={{ width: isSmallScreen ? 120 : 150 }}
                  />
                }
              />
              <Typography sx={{ display: { xs: "none", sm: "block" } }}>
                -
              </Typography>
              <DatePicker
                selected={toDate}
                onChange={(date: Date | null) => setToDate(date)}
                dateFormat="dd/MM/yyyy"
                placeholderText="To"
                customInput={
                  <TextField
                    size="small"
                    label={isSmallScreen ? "To" : "To Date"}
                    variant="outlined"
                    sx={{ width: isSmallScreen ? 120 : 150 }}
                  />
                }
              />
              <Tooltip title="Search">
                <IconButton color="primary" onClick={handleSearchClick}>
                  <SearchIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          </Grid>
          <Grid
            item
            xs={12}
            sm="auto"
            sx={{ ml: "auto", display: "flex", justifyContent: "flex-end" }}
          >
            <Button
              variant="outlined"
              startIcon={<FilterAltIcon />}
              onClick={toggleFilters}
              size={isSmallScreen ? "small" : "medium"}
              sx={{ mr: 1 }}
            >
              {isSmallScreen ? "Filter" : "Filters"}
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => router.push("/jobs/register")}
              size={isSmallScreen ? "small" : "medium"}
            >
              {isSmallScreen ? "New" : "New Work Order"}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Summary Cards - Made horizontal scrollable on mobile */}
      <Box sx={{ mb: 2, overflowX: "auto", whiteSpace: "nowrap" }}>
        <Grid
          container
          spacing={1}
          sx={{ display: "inline-flex", width: "auto" }}
        >
          {[
            { label: "Total", value: workOrders.length, color: "inherit" },
            {
              label: "Open",
              value: workOrders.filter((wo) => wo.status === "Open").length,
              color: "warning.main",
            },
            {
              label: "Processing",
              value: workOrders.filter((wo) => wo.status === "Processing")
                .length,
              color: "info.main",
            },
            {
              label: "Completed",
              value: workOrders.filter((wo) => wo.status === "Complete").length,
              color: "success.main",
            },
            {
              label: "Overdue",
              value: workOrders.filter(
                (wo) => new Date(wo.dueDate) < new Date()
              ).length,
              color: "error.main",
            },
          ].map((item, index) => (
            <Grid item key={index} sx={{ display: "inline-block", width: 120 }}>
              <Paper sx={{ p: 1, textAlign: "center", borderRadius: 2 }}>
                <Typography variant="caption">{item.label}</Typography>
                <Typography variant="h6" fontWeight="bold" color={item.color}>
                  {item.value}
                </Typography>
              </Paper>
            </Grid>
          ))}
          <Grid item sx={{ display: "inline-block", width: 120 }}>
            <Paper
              sx={{
                p: 1,
                textAlign: "center",
                borderRadius: 2,
                height: "100%",
                display: "flex",
                alignItems: "center",
              }}
            >
              <Button
                variant="outlined"
                size="small"
                fullWidth
                onClick={() => router.push("/jobs/over-due-date")}
              >
                Overdue
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* Filters Section - Improved for mobile */}
      {showFilters && (
        <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Filters
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="body2" gutterBottom>
                Status
              </Typography>
              <Box sx={{ overflowX: "auto", whiteSpace: "nowrap", py: 1 }}>
                <Stack direction="row" spacing={1}>
                  {[
                    "Open",
                    "Processing",
                    "Request",
                    "Complete",
                    "Return for Revision",
                    "Pending",
                  ].map((status) => (
                    <FormControlLabel
                      key={status}
                      control={
                        <Checkbox
                          checked={filterStatus.includes(status)}
                          onChange={handleStatusFilterChange}
                          value={status}
                          size="small"
                        />
                      }
                      label={
                        <Chip
                          label={status}
                          size="small"
                          sx={{
                            backgroundColor: statusColors[status] || "#e0e0e0",
                            color: "white",
                          }}
                        />
                      }
                      sx={{ m: 0 }}
                    />
                  ))}
                </Stack>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" gutterBottom>
                Work Order Type
              </Typography>
              <FormControl component="fieldset">
                <RadioGroup
                  aria-labelledby="sent-received-label"
                  name="sent-received-group"
                  value={filterSentReceived}
                  onChange={handleSentReceivedFilterChange}
                  row
                  sx={{ flexWrap: "wrap" }}
                >
                  <FormControlLabel
                    value="All"
                    control={<Radio size="small" />}
                    label="All"
                    sx={{ mr: 1 }}
                  />
                  <FormControlLabel
                    value="Sent"
                    control={<Radio size="small" />}
                    label="Sent"
                    sx={{ mr: 1 }}
                  />
                  <FormControlLabel
                    value="Received"
                    control={<Radio size="small" />}
                    label="Received"
                    sx={{ mr: 1 }}
                  />
                </RadioGroup>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Work Orders Table - Improved scrolling for mobile */}
      <Paper sx={{ borderRadius: 2, overflow: "hidden" }}>
        <Box sx={{ overflowX: "auto" }}>
          <TableContainer sx={{ minWidth: 600 }}>
            <Table>
              <EnhancedTableHead
                order={order}
                orderBy={orderBy}
                onRequestSort={handleRequestSort}
                headCells={tableHeadCells}
                sx={{
                  backgroundColor: (theme) => theme.palette.primary.main,
                  "& .MuiTableCell-root": {
                    color: "white",
                    fontWeight: "bold",
                  },
                }}
              />
              <TableBody>
                {filteredWorkOrders.map((row) => (
                  <TableRow
                    key={row.id}
                    hover
                    onClick={() => router.push(`/jobs/${row.id}`)}
                    sx={{
                      "&:last-child td, &:last-child th": { border: 0 },
                      "&:hover": {
                        backgroundColor: "action.hover",
                        cursor: "pointer",
                      },
                    }}
                  >
                    {tableHeadCells.map((cell) => {
                      let value: any;
                      let cellContent: React.ReactNode;

                      if (cell.id === "dueDate") {
                        value = row.dueDate
                          ? format(parseISO(row.dueDate), "dd/MM/yy")
                          : "N/A";
                        const isOverdue =
                          row.dueDate && new Date(row.dueDate) < new Date();
                        cellContent = (
                          <Typography
                            color={isOverdue ? "error" : "inherit"}
                            fontWeight={isOverdue ? "bold" : "normal"}
                            variant="body2"
                          >
                            {value}
                          </Typography>
                        );
                      } else if (cell.id === "dfDays") {
                        value = calculateDfDays(row.dueDate, row.completedAt);
                        cellContent =
                          value > 0 ? (
                            <Chip
                              label={`+${value}`}
                              size="small"
                              color="error"
                            />
                          ) : (
                            value
                          );
                      } else if (cell.id === "id") {
                        value = row.id;
                        cellContent = (
                          <Typography variant="body2">{value}</Typography>
                        );
                      } else if (cell.id === "priority") {
                        value =
                          row.priority === "High"
                            ? "H"
                            : row.priority === "Medium"
                            ? "M"
                            : row.priority === "Low"
                            ? "L"
                            : row.priority;
                        cellContent = (
                          <Chip
                            label={value}
                            size="small"
                            sx={{
                              backgroundColor:
                                priorityColors[row.priority] || "#e0e0e0",
                              color: "white",
                            }}
                          />
                        );
                      } else if (cell.id === "assignees") {
                        value =
                          row.assignees && row.assignees.length > 0
                            ? row.assignees
                                .map((assignee) => assignee.name)
                                .join(", ")
                            : "N/A";
                        cellContent = (
                          <Stack direction="row" spacing={0.5}>
                            {row.assignees?.map((assignee) => (
                              <Tooltip key={assignee.id} title={assignee.name}>
                                <Avatar
                                  sx={{
                                    width: 24,
                                    height: 24,
                                    fontSize: 12,
                                    display: { xs: "none", sm: "flex" },
                                  }}
                                >
                                  {assignee.name.charAt(0)}
                                </Avatar>
                              </Tooltip>
                            ))}
                            {isSmallScreen && row.assignees?.length > 0 && (
                              <Typography variant="body2">
                                {row.assignees.length}
                              </Typography>
                            )}
                          </Stack>
                        );
                      } else if (cell.id === "status") {
                        value = row.status;
                        cellContent = (
                          <Chip
                            label={value}
                            size="small"
                            sx={{
                              backgroundColor: statusColors[value] || "#e0e0e0",
                              color: "white",
                            }}
                          />
                        );
                      } else if (cell.id === "requesterBy") {
                        value = row.requesterBy || "N/A";
                        cellContent = (
                          <Typography variant="body2" noWrap>
                            {value}
                          </Typography>
                        );
                      } else if (cell.id === "ticketNo") {
                        value = row.id;
                        cellContent = (
                          <Typography variant="body2">{value}</Typography>
                        );
                      } else if (cell.id === "region") {
                        value = row.region || "N/A";
                        cellContent = (
                          <Typography variant="body2">{value}</Typography>
                        );
                      } else if (cell.id === "createdAt") {
                        value = row.createdAt
                          ? format(parseISO(row.createdAt), "dd/MM/yy")
                          : "N/A";
                        cellContent = (
                          <Typography variant="body2">{value}</Typography>
                        );
                      } else {
                        value = row[cell.id as keyof WorkOrder];
                        cellContent = (
                          <Typography
                            variant="body2"
                            noWrap={cell.id === "title"}
                          >
                            {value}
                          </Typography>
                        );
                      }

                      return (
                        <TableCell
                          key={cell.id}
                          sx={{
                            width: cell.width,
                            px: 1,
                            py: 1.5,
                          }}
                        >
                          {cellContent}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
        {filteredWorkOrders.length === 0 && (
          <Box sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              No work orders found
            </Typography>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default WorkOrderDashboard;
