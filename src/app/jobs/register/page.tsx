"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { isTokenExpired } from "@/lib/utils";
import { useAppContext } from "@/app/app-provider";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Button,
  Grid,
  Paper,
  InputAdornment,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  Alert,
  Divider,
  Fade,
} from "@mui/material";
import { styled, useTheme } from "@mui/material/styles";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import EventIcon from "@mui/icons-material/Event";
import ClearIcon from "@mui/icons-material/Clear";
import dayjs, { Dayjs } from "dayjs";

const API_BASE_URL = "http://localhost:8081/api";

const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});

interface FormDataState {
  title: string;
  customer: string;
  category: string; // This will be the category ID (string from select, convert to Long for backend)
  priority: string;
  cd: string; // This will be the CD user ID (string from input, convert to Long for backend)
  assignees: string; // This will be the assignee user ID (string from select, convert to Long for backend)
  dueDate: Dayjs | null;
  region: string;
  description: string;
  attachments: File[];
}

interface FormErrors {
  title?: string;
  customer?: string;
  category?: string;
  priority?: string;
  cd?: string;
  assignees?: string;
  dueDate?: string;
  region?: string;
  attachments?: string;
  [key: string]: string | undefined;
}

const JobRegisterPage = () => {
  const router = useRouter();
  const { isAuthenticated, currentUser, logout } = useAppContext();
  const theme = useTheme();

  const [categories, setCategories] = useState<any[]>([]);
  const [assignees, setAssignees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submissionStatus, setSubmissionStatus] = useState<{
    message: string | null;
    severity: "success" | "error" | "info" | undefined;
  }>({ message: null, severity: undefined });

  const [formData, setFormData] = useState<FormDataState>({
    title: "",
    customer: "",
    category: "",
    priority: "",
    cd: "",
    assignees: "",
    dueDate: null,
    region: "",
    description: "",
    attachments: [],
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      setLoading(true);
      setError(null);
      const accessToken = Cookies.get("accessToken");

      if (!accessToken || isTokenExpired()) {
        logout();
        router.push("/login");
        return;
      }

      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      };

      try {
        const [categoriesResponse, assigneesResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/categories`, { headers }),
          fetch(`${API_BASE_URL}/users/getList`, { headers }),
        ]);

        if (!categoriesResponse.ok) {
          if (categoriesResponse.status === 401 || categoriesResponse.status === 403) {
            throw new Error("Unauthorized access for categories. Please log in again.");
          }
          throw new Error(`Failed to load categories: ${categoriesResponse.statusText}`);
        }
        const categoriesData = await categoriesResponse.json();
        setCategories(categoriesData);

        if (!assigneesResponse.ok) {
          if (assigneesResponse.status === 401 || assigneesResponse.status === 403) {
            throw new Error("Unauthorized access for assignees. Please log in again.");
          }
          throw new Error(`Failed to load assignees: ${assigneesResponse.statusText}`);
        }
        const assigneesData = await assigneesResponse.json();
        setAssignees(assigneesData);
      } catch (err: unknown) {
        console.error("Error fetching data:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load data. Please try again."
        );
        if (err instanceof Error && err.message.includes("Unauthorized")) {
          logout();
          router.push("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndFetchData();
  }, [router, logout]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | { name?: string; value: unknown }
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev: FormDataState) => ({
      ...prev,
      [name as string]: value,
    }));
    if (name && formErrors[name]) {
      setFormErrors((prev: FormErrors) => ({ ...prev, [name]: "" }));
    }
  };

  const handleDueDateChange = (date: Dayjs | null) => {
    setFormData((prev: FormDataState) => ({
      ...prev,
      dueDate: date,
    }));
    if (formErrors.dueDate) {
      setFormErrors((prev: FormErrors) => ({ ...prev, dueDate: "" }));
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const newErrors: FormErrors = {};

    if (files.length > 5) {
      newErrors.attachments = "You can upload a maximum of 5 files.";
    } else {
      const oversizedFiles = files.filter(file => file.size > 10 * 1024 * 1024);
      if (oversizedFiles.length > 0) {
        newErrors.attachments = "Some files exceed the 10MB limit.";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setFormErrors(prev => ({ ...prev, ...newErrors }));
      setFormData(prev => ({ ...prev, attachments: [] }));
    } else {
      setFormData(prev => ({ ...prev, attachments: files }));
      setFormErrors(prev => ({ ...prev, attachments: "" }));
    }
  };

  const validateForm = () => {
    const errors: FormErrors = {};
    if (!formData.title.trim()) {
      errors.title = "Job Title is required.";
    }
    if (!formData.customer.trim()) {
      errors.customer = "Customer Name is required.";
    }
    if (!formData.category) {
      errors.category = "Category is required.";
    }
    if (!formData.priority.trim()) {
      errors.priority = "Priority is required.";
    }
    if (!formData.cd.trim()) {
      errors.cd = "Contact Department is required.";
    }
    if (!formData.assignees) {
      errors.assignees = "Assignee is required.";
    }
    if (!formData.dueDate) {
      errors.dueDate = "Due Date is required.";
    }
    if (!formData.region.trim()) {
      errors.region = "Region is required.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    setSubmissionStatus({ message: null, severity: undefined });
    if (validateForm()) {
      setLoading(true);
      const accessToken = Cookies.get("accessToken");

      if (!accessToken) {
        setSubmissionStatus({ message: "Authentication token missing.", severity: "error" });
        setLoading(false);
        logout();
        router.push("/login");
        return;
      }

      const formDataToSend = new FormData();

      // Prepare JobRequest JSON
      const jobRequest = {
        title: formData.title,
        description: formData.description,
        dueDate: formData.dueDate ? formData.dueDate.format("YYYY-MM-DDTHH:mm:ss") : null,
        status: 1, // Default status, assuming 1 is PENDING
        assigneeIds: formData.assignees ? [parseInt(formData.assignees, 10)] : [],
        customer: formData.customer,
        category: formData.category, // Backend might expect category ID here, ensure it's a Long if needed
        priority: formData.priority,
        cdId: formData.cd ? parseInt(formData.cd, 10) : null,
        completedAt: null, // Not used in registration
        region: formData.region,
      };

      // Append jobRequest as a JSON string with its own Content-Type
      const jobRequestBlob = new Blob([JSON.stringify(jobRequest)], { type: "application/json" });
      formDataToSend.append("jobRequest", jobRequestBlob, "jobRequest.json");

      // Append attachments
      formData.attachments.forEach((file) => {
        formDataToSend.append("attachments", file);
      });

      try {
        const response = await fetch(`${API_BASE_URL}/jobs`, {
          method: "POST",
          headers: {
            // Do NOT set Content-Type header here for FormData.
            // Fetch API will set it automatically with the correct boundary.
            Authorization: `Bearer ${accessToken}`,
          },
          body: formDataToSend,
        });

        if (!response.ok) {
          const errorData = await response.json();
          let errorMessage = `Failed to register job order: ${errorData.message || response.statusText}`;
          if (response.status === 401 || response.status === 403) {
            errorMessage = "Unauthorized. Please log in again.";
            logout();
            router.push("/login");
          }
          throw new Error(errorMessage);
        }

        const responseData = await response.json(); // Assuming API returns a success message or object
        console.log("Job order registered successfully:", responseData);

        setSubmissionStatus({
          message: "Job order registered successfully!",
          severity: "success",
        });
        setFormData({
          title: "",
          customer: "",
          category: "",
          priority: "",
          cd: "",
          assignees: "",
          dueDate: null,
          region: "",
          description: "",
          attachments: [],
        });
        setFormErrors({}); // Clear errors after successful submission
      } catch (submitError: any) {
        console.error("Submission error:", submitError);
        setSubmissionStatus({
          message: `Failed to register job order: ${submitError.message || "Unknown error"}`,
          severity: "error",
        });
      } finally {
        setLoading(false);
      }
    } else {
      setSubmissionStatus({
        message: "Please correct the errors in the form.",
        severity: "error",
      });
    }
  };

  const handleList = () => {
    router.push("/jobs/order-list");
  };

  if (loading && !submissionStatus.message) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          flexDirection: "column",
          bgcolor: theme.palette.background.default,
          color: theme.palette.text.primary,
          p: 3,
        }}
      >
        <CircularProgress color="primary" size={60} sx={{ mb: 2 }} />
        <Typography variant="h6" sx={{ color: theme.palette.text.secondary }}>
          Loading data...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          p: 3,
          maxWidth: 600,
          mx: "auto",
          mt: 8,
          [theme.breakpoints.down("sm")]: {
            mt: 4,
            p: 2,
          },
        }}
      >
        <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
          <Alert severity="error" sx={{ mb: 3, boxShadow: 1 }}>
            {error}
          </Alert>
          <Box sx={{ display: "flex", gap: 2, flexDirection: { xs: "column", sm: "row" } }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => window.location.reload()}
              sx={{ flexGrow: 1 }}
            >
              Retry
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => router.push("/login")}
              sx={{ flexGrow: 1 }}
            >
              Go to Login
            </Button>
          </Box>
        </Paper>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box
        sx={{
          p: { xs: 2, sm: 3, md: 4 },
          maxWidth: 1000,
          mx: "auto",
          my: 4,
        }}
      >
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          align="center"
          sx={{
            mb: 4,
            fontWeight: "bold",
            color: theme.palette.primary.dark,
            fontSize: { xs: "2rem", sm: "2.5rem", md: "3rem" },
          }}
        >
          Register New Job Order
        </Typography>

        <Paper
          elevation={8}
          sx={{
            p: { xs: 2.5, sm: 4, md: 5 },
            borderRadius: 3,
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: theme.palette.background.paper,
          }}
        >
          {submissionStatus.message && (
            <Fade in={!!submissionStatus.message}>
              <Alert
                severity={submissionStatus.severity}
                onClose={() => setSubmissionStatus({ message: null, severity: undefined })}
                sx={{ mb: 3 }}
              >
                {submissionStatus.message}
              </Alert>
            </Fade>
          )}

          <Grid container spacing={4}>
            <Grid item xs={12}>
              <Typography
                variant="h6"
                gutterBottom
                color="text.secondary"
                sx={{ mb: 1, borderBottom: `2px solid ${theme.palette.primary.light}`, pb: 0.5 }}
              >
                Job Details
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Job Title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                variant="outlined"
                size="medium"
                required
                error={!!formErrors.title}
                helperText={formErrors.title}
                placeholder="e.g., Website Redesign Project for Client X"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Customer Name"
                name="customer"
                value={formData.customer}
                onChange={handleChange}
                variant="outlined"
                size="medium"
                required
                error={!!formErrors.customer}
                helperText={formErrors.customer}
                placeholder="e.g., Stellar Innovations Inc."
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl
                fullWidth
                size="medium"
                required
                error={!!formErrors.category}
              >
                <InputLabel id="category-label">Category</InputLabel>
                <Select
                  labelId="category-label"
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  label="Category"
                >
                  <MenuItem value="">
                    <em>Select a category</em>
                  </MenuItem>
                  {categories.map((cat: any) => (
                    <MenuItem key={cat.id} value={cat.id}> {/* Assuming cat.id is the value for category */}
                      {cat.categoryName}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.category && (
                  <Typography variant="caption" color="error" sx={{ ml: 1.5, mt: 0.5 }}>
                    {formErrors.category}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Priority"
                name="priority"
                select
                value={formData.priority}
                onChange={handleChange}
                variant="outlined"
                size="medium"
                required
                error={!!formErrors.priority}
                helperText={formErrors.priority}
                InputLabelProps={{ shrink: true }}
              >
                <MenuItem value="">
                  <em>Select priority</em>
                </MenuItem>
                <MenuItem value="High">High</MenuItem>
                <MenuItem value="Medium">Medium</MenuItem>
                <MenuItem value="Low">Low</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Contact Department (CD)"
                name="cd"
                value={formData.cd}
                onChange={handleChange}
                variant="outlined"
                size="medium"
                required
                error={!!formErrors.cd}
                helperText={formErrors.cd}
                placeholder="e.g., Sales Department"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl
                fullWidth
                size="medium"
                required
                error={!!formErrors.assignees}
              >
                <InputLabel id="assignees-label">Assignee</InputLabel>
                <Select
                  labelId="assignees-label"
                  id="assignees"
                  name="assignees"
                  value={formData.assignees}
                  onChange={handleChange}
                  label="Assignee"
                >
                  <MenuItem value="">
                    <em>Select an assignee</em>
                  </MenuItem>
                  {assignees.map((user: any) => (
                    <MenuItem key={user.id} value={user.id}> {/* Assuming user.id is the value for assignee */}
                      {user.name}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.assignees && (
                  <Typography variant="caption" color="error" sx={{ ml: 1.5, mt: 0.5 }}>
                    {formErrors.assignees}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <DatePicker
                label="Due Date"
                value={formData.dueDate}
                onChange={handleDueDateChange}
                format="DD/MM/YYYY"
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: "medium",
                    variant: "outlined",
                    required: true,
                    error: !!formErrors.dueDate,
                    helperText: formErrors.dueDate,
                    InputLabelProps: { shrink: true },
                    InputProps: {
                      endAdornment: (
                        <InputAdornment position="end">
                          {formData.dueDate && (
                            <IconButton onClick={() => handleDueDateChange(null)} size="small" edge="end">
                              <ClearIcon fontSize="small" color="action" />
                            </IconButton>
                          )}
                          <IconButton>
                            <EventIcon color="action" />
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Region"
                name="region"
                value={formData.region}
                onChange={handleChange}
                variant="outlined"
                size="medium"
                required
                error={!!formErrors.region}
                helperText={formErrors.region}
                placeholder="e.g., North America, APAC, EMEA"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ mt: 2, mb: 1, borderBottom: `2px solid ${theme.palette.primary.light}`, pb: 0.5 }}
                color="text.secondary"
              >
                Additional Information
              </Typography>
              <TextField
                fullWidth
                label="Job Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                multiline
                rows={7}
                variant="outlined"
                placeholder="Provide a detailed description of the job, including specific requirements, scope, deliverables, and any other relevant information."
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ mt: 2, mb: 1, borderBottom: `2px solid ${theme.palette.primary.light}`, pb: 0.5 }}
                color="text.secondary"
              >
                Attachments
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  component="label"
                  role={undefined}
                  variant="contained"
                  tabIndex={-1}
                  startIcon={<CloudUploadIcon />}
                  sx={{
                    bgcolor: theme.palette.info.main,
                    "&:hover": { bgcolor: theme.palette.info.dark },
                    py: 1.2,
                    px: 3,
                  }}
                >
                  Upload Files
                  <VisuallyHiddenInput
                    type="file"
                    onChange={handleFileChange}
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                </Button>
                {formData.attachments.length > 0 && (
                  <Typography variant="body2" color="text.primary" sx={{ fontWeight: 'medium' }}>
                    {formData.attachments.length} file(s) selected
                  </Typography>
                )}
                {formErrors.attachments && (
                  <Typography variant="caption" color="error" display="block" sx={{ mt: 0.5 }}>
                    {formErrors.attachments}
                  </Typography>
                )}
              </Box>
              <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                (Max 5 files, 10MB each. Supported formats: PDF, JPG, PNG. Click to select files.)
              </Typography>
            </Grid>

            <Grid
              item
              xs={12}
              sx={{
                display: "flex",
                gap: { xs: 1.5, sm: 3 },
                mt: 4,
                justifyContent: { xs: "center", sm: "flex-end" },
                pt: 3,
                borderTop: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Button
                variant="contained"
                color="primary"
                onClick={handleSave}
                sx={{
                  px: { xs: 3, sm: 6 },
                  py: 1.5,
                  fontSize: { xs: "0.95rem", sm: "1.05rem" },
                  fontWeight: "bold",
                  boxShadow: theme.shadows[4],
                  '&:hover': {
                    boxShadow: theme.shadows[6],
                  },
                }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : "Save Job Order"}
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                onClick={handleList}
                sx={{
                  px: { xs: 3, sm: 6 },
                  py: 1.5,
                  fontSize: { xs: "0.95rem", sm: "1.05rem" },
                  fontWeight: "bold",
                }}
                disabled={loading}
              >
                View All Jobs
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </LocalizationProvider>
  );
};

export default JobRegisterPage;