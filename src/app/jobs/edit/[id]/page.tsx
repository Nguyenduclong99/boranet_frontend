"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { isTokenExpired } from "@/lib/utils";
import Cookies from "js-cookie";
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  Paper,
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

// Interfaces for data structures
interface User {
  id: number;
  username: string;
  name: string;
  email: string;
}

interface Job {
  id: number;
  title: string;
  description: string;
  customer: string;
  requesterName?: string;
  assignees?: User[];
  status: string;
  statusId: number;
  dueDate: string;
  createdAt: string;
  category?: string;
  priority?: string;
  cd?: string;
  completedAt?: string;
}

interface StatusOption {
  statusId: number;
  statusName: string;
}

interface JobCategory {
  id: number;
  categoryName: string;
}

interface JobPriority {
  id: number;
  priorityName: string;
}

const JobEditPage = () => {
  const { id } = useParams();
  const router = useRouter();

  // User role check
  const userRolesCookie = Cookies.get("userRoles");
  let roles: string[] = [];
  if (userRolesCookie) {
    try {
      roles = JSON.parse(userRolesCookie);
    } catch (e) {
      console.error("Failed to parse user roles from cookie:", e);
      Cookies.remove("userRoles");
    }
  }

  const isAdmin = roles && roles.includes("ROLE_ADMIN");

  const token = Cookies.get("accessToken");
  useEffect(() => {
    if (isTokenExpired()) {
      Cookies.remove("accessToken");
      Cookies.remove("accessTokenExpiresAt");
      Cookies.remove("userRoles");
      router.push("/login");
    }
  }, [router]);

  // State for job data and form fields
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCustomer, setEditCustomer] = useState("");
  const [editStatus, setEditStatus] = useState<number | null>(null);
  const [editDueDate, setEditDueDate] = useState<Date | null>(null);
  const [editCategory, setEditCategory] = useState("");
  const [editPriority, setEditPriority] = useState("");
  const [editCd, setEditCd] = useState("");
  const [editCompletedAt, setEditCompletedAt] = useState<Date | null>(null);

  const [statusOptions, setStatusOptions] = useState<StatusOption[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedAssignees, setSelectedAssignees] = useState<User[]>([]);

  // API URLs
  const API_JOBS_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL
    ? `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/jobs`
    : "http://localhost:8081/api/jobs";

  const API_STATUSES_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL
    ? `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/job-statuses`
    : "http://localhost:8081/api/job-statuses";

  const API_USERS_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL
    ? `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/users/getList`
    : "http://localhost:8081/api/users/getList";

  // Fetch job details, status options, and users on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch Job Details
        const jobResponse = await fetch(`${API_JOBS_URL}/${id}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (!jobResponse.ok) {
          throw new Error(`HTTP error! Status: ${jobResponse.status}`);
        }
        const jobData: Job = await jobResponse.json();
        setJob(jobData);
        setEditTitle(jobData.title);
        setEditDescription(jobData.description);
        setEditCustomer(jobData.customer);
        setEditStatus(jobData.statusId || null);
        setEditDueDate(jobData.dueDate ? parseISO(jobData.dueDate) : null);
        setEditCategory(jobData.category || "");
        setEditPriority(jobData.priority || "");
        setEditCd(jobData.cd || "");
        setEditCompletedAt(
          jobData.completedAt ? parseISO(jobData.completedAt) : null
        );
        setSelectedAssignees(jobData.assignees || []);

        // Fetch Status Options
        const statusResponse = await fetch(API_STATUSES_URL, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (statusResponse.ok) {
          const statusData: StatusOption[] = await statusResponse.json();
          setStatusOptions(statusData);
        } else {
          console.error("Failed to fetch status options");
        }

        // Fetch Users List (only if admin, but fetching for dropdown regardless for now)
        const usersResponse = await fetch(API_USERS_URL, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (usersResponse.ok) {
          const usersData: User[] = await usersResponse.json();
          setUsers(usersData);
        } else {
          console.error("Failed to fetch users list");
        }
      } catch (err: any) {
        console.error("Error fetching job details for edit:", err);
        setError(err.message || "Could not fetch job details for editing.");
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load job details for editing.",
        });
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id, token, API_JOBS_URL, API_STATUSES_URL, API_USERS_URL]);

  const handleSaveClick = async () => {
    if (!job) return;
    setLoading(true);
    setError(null);

    try {
      const updatePayload: any = {
        title: isAdmin ? editTitle : job.title,
        description: isAdmin ? editDescription : job.description,
        customer: isAdmin ? editCustomer : job.customer,
        status: editStatus, // Both admin and user can change status
        dueDate:
          isAdmin && editDueDate
            ? format(editDueDate, "yyyy-MM-dd'T'HH:mm:ss")
            : job.dueDate,
        category: isAdmin ? editCategory : job.category,
        priority: isAdmin ? editPriority : job.priority,
        cd: isAdmin ? editCd : job.cd,
        completedAt:
          isAdmin && editCompletedAt
            ? format(editCompletedAt, "yyyy-MM-dd'T'HH:mm:ss")
            : job.completedAt,
      };

      if (isAdmin) {
        updatePayload.assigneeIds = selectedAssignees.map((user) => user.id);
      }

      const response = await fetch(`${API_JOBS_URL}/${job.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatePayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP error! Status: ${response.status}`
        );
      }

      const updatedJob: Job = await response.json();
      setJob(updatedJob);
      toast({
        title: "Success",
        description: "Job updated successfully.",
      });
      router.push(`/jobs/${job.id}`); // Redirect back to detail page
    } catch (err: any) {
      console.error("Error updating job:", err);
      setError(err.message || "Could not update job.");
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to update job: ${err.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClick = () => {
    router.push(`/jobs/${job?.id}`); // Go back to the detail page
  };

  if (loading) {
    return <div className="text-center py-8">Loading job details...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">Error: {error}</div>;
  }

  if (!job) {
    return <div className="text-center py-8">Job not found.</div>;
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-4">
          <Button onClick={() => router.push("/jobs/order-list")}>
            &lt; List
          </Button>
          <Typography variant="h4" component="h1" className="text-center">
            Edit Job: {job.id}
          </Typography>
          <div className="w-1/4"></div>
        </div>

        <Paper elevation={3} className="p-6">
          <Grid container spacing={4}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Order Number"
                value={job.id}
                fullWidth
                margin="normal"
                InputProps={{ readOnly: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Customer"
                value={editCustomer}
                onChange={(e) => setEditCustomer(e.target.value)}
                fullWidth
                margin="normal"
                InputProps={{ readOnly: !isAdmin }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Requester"
                value={job.requesterName || "N/A"}
                fullWidth
                margin="normal"
                InputProps={{ readOnly: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                multiple
                id="assign-workers-autocomplete"
                options={users}
                getOptionLabel={(option) => option.name}
                value={selectedAssignees}
                onChange={(_event, newValue) => {
                  setSelectedAssignees(newValue);
                }}
                filterSelectedOptions
                disabled={!isAdmin}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Assign Workers"
                    placeholder="Search workers"
                    margin="normal"
                    fullWidth
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="status-label">Status</InputLabel>
                <Select
                  labelId="status-label"
                  id="status"
                  value={editStatus}
                  onChange={(e) => setEditStatus(Number(e.target.value))}
                  label="Status"
                  disabled={!isAdmin && !roles.includes("ROLE_USER")} // Only allow status change for ADMIN and USER
                >
                  {statusOptions.map((option) => (
                    <MenuItem key={option.statusId} value={option.statusId}>
                      {option.statusName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                fullWidth
                margin="normal"
                InputProps={{ readOnly: !isAdmin }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="Due Date"
                value={editDueDate}
                onChange={(newValue) => setEditDueDate(newValue)}
                slots={{
                  textField: (params) => (
                    <TextField {...params} fullWidth margin="normal" />
                  ),
                }}
                disabled={!isAdmin}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Registration Date"
                value={
                  job.createdAt
                    ? format(parseISO(job.createdAt), "MMM d, yyyy HH:mm")
                    : "N/A"
                }
                fullWidth
                margin="normal"
                InputProps={{ readOnly: true }}
              />
            </Grid>

            {/* Row 3: Category, Priority, CD, Completed At */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Category"
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                fullWidth
                margin="normal"
                InputProps={{ readOnly: !isAdmin }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Priority"
                value={editPriority}
                onChange={(e) => setEditPriority(e.target.value)}
                fullWidth
                margin="normal"
                InputProps={{ readOnly: !isAdmin }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="CD"
                value={editCd}
                onChange={(e) => setEditCd(e.target.value)}
                fullWidth
                margin="normal"
                InputProps={{ readOnly: !isAdmin }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="Completed At"
                value={editCompletedAt}
                onChange={(newValue) => setEditCompletedAt(newValue)}
                slots={{
                  textField: (params) => (
                    <TextField {...params} fullWidth margin="normal" />
                  ),
                }}
                disabled={!isAdmin}
              />
            </Grid>

            {/* Row 4: Description */}
            <Grid item xs={12}>
              <TextField
                label="Description"
                multiline
                rows={4}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                fullWidth
                margin="normal"
                InputProps={{ readOnly: !isAdmin }}
              />
            </Grid>

            {/* Action Buttons */}
            <Grid item xs={12} className="flex justify-end space-x-2 mt-4">
              <Button
                onClick={handleSaveClick}
                variant="default"
                color="primary"
              >
                Save
              </Button>
              <Button onClick={handleCancelClick} variant="outline">
                Cancel
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </div>
    </LocalizationProvider>
  );
};

export default JobEditPage;
