"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import {
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  CardHeader,
  CardContent,
  CircularProgress,
  Box,
  useMediaQuery,
  Alert,
  Snackbar,
  Card,
} from "@mui/material";
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);
import Cookies from "js-cookie";

interface WorkOrder {
  id: number;
  title: string;
  requesterName: string;
  assignerName: string | null;
  statusName: "Open" | "Processing" | "Completed" | "Cancelled";
  createdAt: string | null;
  dueDate: string;
  description?: string | null;
  userName?: string | null;
  completedAt?: string | null;
}
const WorkOverDuePage: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const isSmallScreen = useMediaQuery("(max-width: 600px)");
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    "success" | "info" | "warning" | "error"
  >("error");

  const API_OVERDUE_JOBS_URL = process.env.NEXT_PUBLIC_API_BASE_URL
    ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/jobs/overdue`
    : "http://localhost:8081/api/jobs/overdue";

  const calculateDelayInDays = (dueDate: string): number => {
    try {
      const utcDueDate = new Date(dueDate + "Z");
      const nowUTC = dayjs().utc();
      const diffInMilliseconds = nowUTC.valueOf() - utcDueDate.valueOf();
      return Math.floor(diffInMilliseconds / (1000 * 60 * 60 * 24));
    } catch (error) {
      console.error("Error calculating delay:", error);
      return 0;
    }
  };

  const handleSkip = () => {
    router.push("/");
  };

  const columns = [
    {
      header: "No",
      key: "no",
      render: (_: WorkOrder, index: number) => index + 1,
    },
    {
      header: "Title",
      key: "title",
      render: (row: WorkOrder) => row.title,
    },
    {
      header: "Order",
      key: "requesterName",
      render: (row: WorkOrder) => row.requesterName,
    },
    {
      header: "Worker",
      key: "assignerName",
      render: (row: WorkOrder) => row.assignerName,
    },
    {
      header: "Status",
      key: "statusName",
      render: (row: WorkOrder) => row.statusName,
    },
    {
      header: "Created On",
      key: "createdAt",
      render: (row: WorkOrder) =>
        dayjs(row.createdAt).format("YYYY-MM-DD HH:mm:ss"),
    },
    {
      header: "Delay",
      key: "dueDate",
      render: (row: WorkOrder) => {
        const delayInDays = calculateDelayInDays(row.dueDate);
        return `${delayInDays} days`;
      },
    },
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchOverdueJobs = async () => {
      setLoading(true);
      try {
        const accessToken = Cookies.get("accessToken");

        if (!accessToken) {
          setSnackbarMessage("No access token found. Please log in.");
          setSnackbarSeverity("error");
          setSnackbarOpen(true);
          router.push("/login");
          return;
        }

        const response = await fetch(API_OVERDUE_JOBS_URL, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error(
            `Failed to fetch overdue jobs: ${response.status} ${response.statusText}`
          );
        }
        const data: WorkOrder[] = await response.json();
        setWorkOrders(data);
      } catch (error: any) {
        console.error("Error fetching overdue jobs:", error);
        setSnackbarMessage(error.message || "Could not load overdue jobs.");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
      } finally {
        setLoading(false);
      }
    };
    fetchOverdueJobs();
  }, []);

  const handleSnackbarClose = (
    event: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbarOpen(false);
  };

  if (!mounted) {
    return <></>;
  }

  return (
    <div>
      <Box sx={{ padding: isSmallScreen ? "12px" : "24px" }}>
        <Card>
          <CardHeader title="Recive Work Order" />
          <CardContent>
            {loading ? (
              <Box sx={{ textAlign: "center", padding: "20px" }}>
                <CircularProgress size="large" />
              </Box>
            ) : (
              <>
                <TableContainer>
                  <Table size={isSmallScreen ? "small" : "medium"} aria-label="job order table">
                    <TableHead sx={{ backgroundColor: "black" }}>
                      <TableRow>
                        {columns.map((column: any) => (
                          <TableCell key={column.key} sx={{ color: "white" }}>
                            {column.header}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {workOrders.map((row) => (
                        <TableRow key={row.id}>
                          {columns.map((column: any) => (
                            <TableCell key={column.key}>
                              {column.render(row, workOrders.indexOf(row))}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    marginTop: 2,
                  }}
                >
                  <Button
                    variant="contained"
                    color="primary"
                    size="medium"
                    onClick={handleSkip}
                  >
                    Skip
                  </Button>
                </Box>
              </>
            )}
          </CardContent>
        </Card>
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <Alert
            onClose={handleSnackbarClose}
            severity={snackbarSeverity}
            sx={{ width: "100%" }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Box>
    </div>
  );
};

export default WorkOverDuePage;