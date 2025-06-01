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
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
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
  website: string;
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

  const [fromDate, setFromDate] = useState<Date | null>(subDays(new Date(), 2));
  const [toDate, setToDate] = useState<Date | null>(new Date());
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterSentReceived, setFilterSentReceived] = useState<
    "All" | "Sent" | "Received"
  >("All");
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const [orderBy, setOrderBy] = useState<keyof WorkOrder>("id");

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

  const tableHeadCells = React.useMemo(() => {
    const baseCells = [
      { id: "id", label: "No" },
      { id: "ticketNo", label: "Ticket No" },
      { id: "region", label: "R" },
      { id: "category", label: "Category" },
      { id: "customer", label: "Customer" },
      { id: "title", label: "Title" },
      { id: "priority", label: "P :" },
      { id: "status", label: "Status" },
      { id: "cd", label: "CD" },
      { id: "requesterBy", label: "Order" },
      { id: "assignees", label: "Owner" },
      { id: "createdAt", label: "Date" },
      { id: "dueDate", label: "Due" },
      { id: "dfDays", label: "DF" },
    ];

    if (isSmallScreen) {
      return baseCells.filter(
        (cell) =>
          ["id", "title", "status", "dueDate", "dfDays", "region"].includes(
            cell.id
          )
      );
    } else if (isMediumScreen) {
      return baseCells.filter((cell) =>
        [
          "id",
          "title",
          "requesterName",
          "category",
          "status",
          "dueDate",
          "dfDays",
          "region",
        ].includes(cell.id)
      );
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

  return (
    <div>
      <Container maxWidth="xl">
        <Grid container>
          <Grid item></Grid>
          <Grid item>
            <DatePicker
              showIcon
              selected={fromDate}
              onChange={(date: Date | null) => setFromDate(date)}
              dateFormat="dd/MM/yyyy"
              placeholderText="From Date"
              size="small"
            />
          </Grid>
          <Grid item>
            <Typography>-</Typography>
          </Grid>
          <Grid item>
            <DatePicker
              label="To Date"
              value={toDate}
              onChange={(newValue) => setToDate(newValue)}
              slotProps={{
                textField: (params) => <TextField {...params} size="small" />,
              }}
              format="DD/MM/YYYY" // Định dạng hiển thị
            />
          </Grid>
          <Grid item>
            <IconButton
              aria-label="search"
              onClick={handleSearchClick}
              size="small"
            >
              <SearchIcon />
            </IconButton>
          </Grid>
        </Grid>
        <Typography variant="h4" component="h1" gutterBottom sx={{ mt: 2 }}>
          {username
            ? `${username}'s WORKORDER Statistics`
            : "WORKORDER Statistics"}
        </Typography>

        <Paper sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item>
              <Typography>
                Total: <strong>{workOrders.length}</strong>
              </Typography>
            </Grid>
            <Grid item>
              <Typography>
                Open:{" "}
                <strong>
                  {workOrders.filter((wo) => wo.status === "Open").length}
                </strong>
              </Typography>
            </Grid>
            <Grid item>
              <Typography>
                Processing:{" "}
                <strong>
                  {workOrders.filter((wo) => wo.status === "Processing").length}
                </strong>
              </Typography>
            </Grid>
            <Grid item>
              <Typography>
                Request:{" "}
                <strong>
                  {workOrders.filter((wo) => wo.status === "Request").length}
                </strong>
              </Typography>
            </Grid>
            <Grid item>
              <Typography>
                Complete:{" "}
                <strong>
                  {workOrders.filter((wo) => wo.status === "Complete").length}
                </strong>
              </Typography>
            </Grid>
            <Grid item>
              <Typography color="error">
                Over Due:{" "}
                <strong>
                  {
                    workOrders.filter((wo) => new Date(wo.dueDate) < new Date())
                      .length
                  }
                </strong>
              </Typography>
            </Grid>
            <Grid item>
              <Button variant="outlined" size="small" onClick={() => router.push("/jobs/over-due-date")}>
                $(Click)
              </Button>
            </Grid>
          </Grid>
        </Paper>

        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" component="h2" gutterBottom>
            Work Order List
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item>
              <FormGroup row>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={filterStatus.includes("Open")}
                      onChange={handleStatusFilterChange}
                      value="Open"
                    />
                  }
                  label="Open"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={filterStatus.includes("Processing")}
                      onChange={handleStatusFilterChange}
                      value="Processing"
                    />
                  }
                  label="Processing"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={filterStatus.includes("Requested")}
                      onChange={handleStatusFilterChange}
                      value="Requested"
                    />
                  }
                  label="Requested"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={filterStatus.includes("Return for Revision")}
                      onChange={handleStatusFilterChange}
                      value="Return for Revision"
                    />
                  }
                  label="Return for Revision"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={filterStatus.includes("Pending")}
                      onChange={handleStatusFilterChange}
                      value="Pending"
                    />
                  }
                  label="Pending"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={filterStatus.includes("Completed")}
                      onChange={handleStatusFilterChange}
                      value="Completed"
                    />
                  }
                  label="Completed"
                />
              </FormGroup>
            </Grid>
            <FormControl component="fieldset">
              <RadioGroup
                aria-labelledby="sent-received-label"
                name="sent-received-group"
                value={filterSentReceived}
                onChange={handleSentReceivedFilterChange}
                row
              >
                <FormControlLabel
                  value="All"
                  control={<Radio size="small" />}
                  label="All"
                />
                <FormControlLabel
                  value="Sent"
                  control={<Radio size="small" />}
                  label="Sent"
                />
                <FormControlLabel
                  value="Received"
                  control={<Radio size="small" />}
                  label="Received"
                />
              </RadioGroup>
            </FormControl>
          </Grid>
        </Paper>

        <Grid item xs={12}>
          <Paper>
            <TableContainer>
              <Table>
                <EnhancedTableHead
                  order={order}
                  orderBy={orderBy}
                  onRequestSort={handleRequestSort}
                  headCells={tableHeadCells}
                />
                <TableBody>
                  {filteredWorkOrders.map((row) => (
                    <TableRow key={row.id}>
                      {tableHeadCells.map((cell) => {
                        let value: any;

                        if (cell.id === "dueDate") {
                          value = row.dueDate
                            ? format(parseISO(row.dueDate), "dd/MM/yy")
                            : "N/A";
                        } else if (cell.id === "dfDays") {
                          value = calculateDfDays(row.dueDate, row.completedAt);
                        } else if (cell.id === "id") {
                          value = row.id;
                        } else if (cell.id === "priority") {
                          value =
                            row.priority === "High"
                              ? "H"
                              : row.priority === "Medium"
                              ? "M"
                              : row.priority === "Low"
                              ? "L"
                              : row.priority;
                        } else if (cell.id === "assignees") {
                          value =
                            row.assignees && row.assignees.length > 0
                              ? row.assignees
                                  .map((assignee) => assignee.name)
                                  .join(", ")
                              : "N/A";
                        } else if (cell.id === "requesterBy") {
                          value = row.requesterBy || "N/A";
                        } else if (cell.id === "ticketNo") {
                          value = row.id;
                        } else if (cell.id === "region") {
                          value = row.region || "N/A";
                        } else if (cell.id === "createdAt") {
                          value = row.createdAt
                            ? format(parseISO(row.createdAt), "dd/MM/yy")
                            : "N/A";
                        } else {
                          value = row[cell.id as keyof WorkOrder];
                        }

                        return (
                          <TableCell
                            key={cell.id}
                            onClick={() => {
                              if (cell.id === "title") {
                                router.push(`/jobs/${row.id}`);
                              }
                            }}
                            style={{
                              cursor:
                                cell.id === "title" ? "pointer" : "default",
                            }}
                          >
                            {value == null ? "N/A" : value}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Container>
    </div>
  );
};

export default WorkOrderDashboard;
