"use client";
import 'react-datepicker/dist/react-datepicker.css';
import React, { useState, useEffect, useCallback } from "react";
import { format, parseISO } from "date-fns";
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
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { subDays } from 'date-fns';
import DatePicker from 'react-datepicker';
import EnhancedTableHead from "@/components/ui/EnhancedTableHead";
import { useRouter } from "next/navigation";
import { isTokenExpired } from "@/lib/utils";
import Cookies from "js-cookie";

interface WorkOrder {
    id: number;
    title: string;
    description: string;
    requesterName: string;
    category: string;
    priority: string;
    status: string;
    cd: string;
    assignerBy: string;
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

    // --- Fetch Work Orders Function ---
    const fetchWorkOrders = useCallback(async (fromDate?: string | null, toDate?: string | null) => {
        // const token = localStorage.getItem("accessToken"); // Removed localStorage
        const token = Cookies.get("accessToken"); // Get token from cookie

        if (!token) {
            router.push("/login");
            return;
        }

        let url = API_GET_LIST_JOB;
        const params = new URLSearchParams();

        if (fromDate) {
            params.append("fromDate", fromDate);
        }
        if (toDate) {
            params.append("toDate", toDate);
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
            const data: ApiResponse = await response.json(); // Type assertion here
            setWorkOrders(data.listJob);
        } catch (error) {
            console.error("Error fetching work orders:", error);
        }
    }, [API_GET_LIST_JOB, router]);

    // --- Initial Data Fetch ---
    useEffect(() => {
        fetchWorkOrders();
    }, [fetchWorkOrders]);

    const handleRequestSort =
        (property: keyof WorkOrder) => (_event: React.MouseEvent<unknown>) => {
            const isAsc = orderBy === property && order === "asc";
            setOrder(isAsc ? "desc" : "asc");
            setOrderBy(property);
        };

    const sortedWorkOrders = [...workOrders].sort((a, b) => {
        if (orderBy) {
            if (a[orderBy] < b[orderBy]) {
                return order === "asc" ? -1 : 1;
            }
            if (a[orderBy] > b[orderBy]) {
                return order === "asc" ? 1 : -1;
            }
        }
        return 0;
    });

    const tableHeadCells = React.useMemo(() => {
        const baseCells = [
            { id: "id", label: "ID" },
            { id: "title", label: "Title" },
            { id: "description", label: "Description" },
            { id: "requesterName", label: "Requester" },
            { id: "category", label: "Category" },
            { id: "priority", label: "Priority" },
            { id: "status", label: "Status" },
            { id: "cd", label: "CD" },
            { id: "assignerBy", label: "Assigner" },
            { id: "requesterBy", label: "Requester By" },
            { id: "customer", label: "Customer" },
            { id: "dueDate", label: "Due Date" },
            { id: "createdAt", label: "Created At" },
            { id: "completedAt", label: "Completed At" },
        ];

        if (isSmallScreen) {
            return baseCells.filter((cell) =>
                ["id", "title", "status", "dueDate"].includes(cell.id)
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
                ].includes(cell.id)
            );
        }
        return baseCells;
    }, [isSmallScreen, isMediumScreen]);
    const formattedFromDate = fromDate ? format(fromDate, "yyyy-MM-dd'T'HH:mm:ss") : null;
    const formattedToDate = toDate ? format(toDate, "yyyy-MM-dd'T'HH:mm:ss") : null;
    const handleSearchClick = () => {
        fetchWorkOrders(formattedFromDate, formattedToDate);
    };


    return (
        <div>
            <Container maxWidth="xl">
                <Typography variant="h4" component="h1" gutterBottom sx={{ mt: 2 }}>
                    Work Order Dashboard
                </Typography>

                <Grid container spacing={2}>
                    {/* Date Filters */}
                    <Grid item xs={12} md={6} lg={4}>
                        <Grid container spacing={1} alignItems="center">
                            <Grid item>
                                <DatePicker
                                    showIcon
                                    selected={fromDate}
                                    onChange={(date: Date | null) => setFromDate(date)}
                                />

                            </Grid>
                            <Grid item>
                                <DatePicker
                                    showIcon
                                    selected={toDate}
                                    onChange={(date: Date | null) => setToDate(date)}
                                />
                            </Grid>
                            <Grid item>
                                <IconButton aria-label="search" onClick={handleSearchClick}>
                                    <SearchIcon />
                                </IconButton>
                            </Grid>
                        </Grid>
                    </Grid>

                    {/* ... Other filter components ... */}

                    {/* Table */}
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
                                        {sortedWorkOrders.map((row) => (
                                            <TableRow key={row.id}>
                                                {tableHeadCells.map((cell) => {
                                                    let value: any = row[cell.id]; // Change type to any

                                                    if (cell.id === "dueDate" || cell.id === "createdAt") {
                                                        value = value
                                                            ? format(parseISO(value), "dd/MM/yyyy")
                                                            : "N/A";
                                                    }
                                                    if (cell.id === "completedAt") {
                                                        value = value
                                                            ? format(parseISO(value), "dd/MM/yyyy")
                                                            : "N/A";
                                                    }

                                                    return (
                                                        <TableCell key={cell.id}>
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
                </Grid>
            </Container>
        </div>
    );
};

export default WorkOrderDashboard;