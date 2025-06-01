"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { isTokenExpired } from "@/lib/utils";
import { useAppContext } from "@/app/app-provider";
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
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
} from "@mui/material";
import { styled } from '@mui/material/styles';
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import EventIcon from "@mui/icons-material/Event";
import { Dayjs } from "dayjs";

const API_BASE_URL = "http://localhost:8081/api";
const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});
// Define a type for formData state
interface FormDataState {
  title: string;
  customer: string;
  category: string;
  priority: string;
  cd: string;
  assignees: string;
  dueDate: Dayjs | null; // Changed to Dayjs type for MUI DatePicker
  region: string;
  description: string;
  attachments: string; // Changed to string for file name input
}

// Define a type for form errors
interface FormErrors {
  title?: string;
  customer?: string;
  category?: string;
  priority?: string;
  cd?: string;
  assignees?: string;
  dueDate?: string;
  region?: string;
  attachments?: string; // Added for attachment field
  [key: string]: string | undefined; // Allow string indexing for dynamic error keys
}

const JobRegisterPage = () => {
  const router = useRouter();
  const { isAuthenticated, currentUser, logout } = useAppContext();

  const [categories, setCategories] = useState<any[]>([]); // Added type for categories
  const [assignees, setAssignees] = useState<any[]>([]); // Added type for assignees
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // Explicitly type error state

  const [formData, setFormData] = useState<FormDataState>({
    // Apply FormDataState type
    title: "",
    customer: "",
    category: "",
    priority: "",
    cd: "",
    assignees: "",
    dueDate: null,
    region: "",
    description: "",
    attachments: "", // Default to empty string
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({}); // Apply FormErrors type

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
        const categoriesResponse = await fetch(`${API_BASE_URL}/categories`, {
          headers,
        });
        if (
          categoriesResponse.status === 401 ||
          categoriesResponse.status === 403
        ) {
          throw new Error("Unauthorized access. Please log in again.");
        }
        const categoriesData = await categoriesResponse.json();
        setCategories(categoriesData);

        const assigneesResponse = await fetch(`${API_BASE_URL}/users/getList`, {
          headers,
        });
        if (
          assigneesResponse.status === 401 ||
          assigneesResponse.status === 403
        ) {
          throw new Error("Unauthorized access. Please log in again.");
        }
        const assigneesData = await assigneesResponse.json();
        setAssignees(assigneesData);
      } catch (err: unknown) {
        // Explicitly type err as unknown
        console.error("Error fetching data:", err);
        // Safely access error message
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

  // Combined handleChange for all text fields and select
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | { name?: string; value: unknown }
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev: FormDataState) => ({
      // Explicitly type prev
      ...prev,
      [name as string]: value,
    }));
    // Check if name is a key in formErrors before accessing
    if (name && formErrors[name]) {
      setFormErrors((prev: FormErrors) => ({ ...prev, [name]: "" })); // Explicitly type prev
    }
  };

  const handleDueDateChange = (date: Dayjs | null) => {
    // Explicitly type date as Dayjs | null
    setFormData((prev: FormDataState) => ({
      // Explicitly type prev
      ...prev,
      dueDate: date,
    }));
    if (formErrors.dueDate) {
      setFormErrors((prev: FormErrors) => ({ ...prev, dueDate: "" })); // Explicitly type prev
    }
  };

  const validateForm = () => {
    const errors: FormErrors = {}; // Use the defined FormErrors type
    if (!formData.title.trim()) {
      errors.title = "Title is required";
    }
    if (!formData.customer.trim()) {
      errors.customer = "Customer is required";
    }
    if (!formData.category) {
      errors.category = "Category is required";
    }
    if (!formData.priority.trim()) {
      errors.priority = "Priority is required";
    }
    if (!formData.cd.trim()) {
      errors.cd = "CD is required";
    }
    if (!formData.assignees) {
      errors.assignees = "Assignee is required";
    }
    if (!formData.dueDate) {
      // Check if dueDate is null or invalid
      errors.dueDate = "Due Date is required";
    }
    if (!formData.region.trim()) {
      errors.region = "Region is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      const dataToSend = {
        ...formData,
        // Convert Dayjs object to ISO string
        dueDate: formData.dueDate ? formData.dueDate.toISOString() : null,
      };
      console.log("Form data to send:", dataToSend);
      // Here you would typically send dataToSend to your API
      alert("Form submitted successfully! Check console for data.");
    } else {
      alert("Please fill in all required fields.");
    }
  };

  const handleList = () => {
    router.push("/jobs/order-list");
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading data...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, maxWidth: 600, mx: "auto" }}>
        <Alert severity="error">{error}</Alert>
        <Button
          variant="contained"
          onClick={() => window.location.reload()}
          sx={{ mt: 2 }}
        >
          Retry
        </Button>
        <Button
          variant="outlined"
          onClick={() => router.push("/login")}
          sx={{ mt: 2, ml: 2 }}
        >
          Go to Login
        </Button>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ p: 3, maxWidth: 900, mx: "auto" }}>
        <Typography
          variant="h5"
          component="h1"
          gutterBottom
          align="center"
          sx={{ mb: 4 }}
        >
          Job Detail Register
        </Typography>

        <Paper elevation={2} sx={{ p: 4 }}>
          <Grid container spacing={3}>
            {/* Row 1 */}
            <Grid item xs={12} sm={4} component="div">
              <TextField
                fullWidth
                label="Title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                variant="outlined"
                size="small"
                required
                error={!!formErrors.title}
                helperText={formErrors.title}
              />
            </Grid>
            <Grid item xs={12} sm={4} component="div">
              <TextField
                fullWidth
                label="Customer"
                name="customer"
                value={formData.customer}
                onChange={handleChange}
                variant="outlined"
                size="small"
                required
                error={!!formErrors.customer}
                helperText={formErrors.customer}
              />
            </Grid>
            <Grid item xs={12} sm={4} component="div">
              <FormControl
                fullWidth
                size="small"
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
                  {categories.map((cat: any) => (
                    <MenuItem key={cat.id} value={cat.id}>
                      {cat.categoryName}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.category && (
                  <Typography
                    variant="caption"
                    color="error"
                    sx={{ ml: 1.5, mt: 0.5 }}
                  >
                    {formErrors.category}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            {/* Row 2 */}
            <Grid item xs={12} sm={4} component="div">
              <TextField
                fullWidth
                label="Priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                variant="outlined"
                size="small"
                required
                error={!!formErrors.priority}
                helperText={formErrors.priority}
              />
            </Grid>
            <Grid item xs={12} sm={4} component="div">
              <TextField
                fullWidth
                label="CD"
                name="cd"
                value={formData.cd}
                onChange={handleChange}
                variant="outlined"
                size="small"
                required
                error={!!formErrors.cd}
                helperText={formErrors.cd}
              />
            </Grid>
            <Grid item xs={12} sm={4} component="div">
              <FormControl
                fullWidth
                size="small"
                required
                error={!!formErrors.assignees}
              >
                <InputLabel id="assignees-label">Assignees</InputLabel>
                <Select
                  labelId="assignees-label"
                  id="assignees"
                  name="assignees"
                  value={formData.assignees}
                  onChange={handleChange}
                  label="Assignees"
                >
                  {assignees.map((user: any) => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.name}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.assignees && (
                  <Typography
                    variant="caption"
                    color="error"
                    sx={{ ml: 1.5, mt: 0.5 }}
                  >
                    {formErrors.assignees}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            {/* Row 3 */}
            <Grid item xs={12} sm={4} component="div">
              <DatePicker
                label="Due Date"
                value={formData.dueDate}
                onChange={handleDueDateChange}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: "small",
                    variant: "outlined",
                    required: true,
                    error: !!formErrors.dueDate,
                    helperText: formErrors.dueDate,
                    InputProps: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton>
                            <EventIcon />
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4} component="div">
              <TextField
                fullWidth
                label="Region"
                name="region"
                value={formData.region}
                onChange={handleChange}
                variant="outlined"
                size="small"
                required
                error={!!formErrors.region}
                helperText={formErrors.region}
              />
            </Grid>
            {/* Removed the empty Grid item to make layout consistent */}

            {/* Description - now takes full width */}
            <Grid item xs={12} component="div">
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                multiline
                rows={6}
                variant="outlined"
              />
            </Grid>

            {/* Attachments - changed to regular TextField as per request */}
            <Grid item xs={12} component="div">
              {/* <TextField
                fullWidth
                label="Attachments" // Changed label to reflect input
                name="attachments"
                value={formData.attachments} // Bind to formData.attachments
                onChange={handleChange} // Use general handleChange
                variant="outlined"
                size="small"
                // No InputLabelProps or InputProps for icon as it's not a file input anymore
              /> */}
              <Button
                component="label"
                role={undefined}
                variant="contained"
                tabIndex={-1}
                startIcon={<CloudUploadIcon />}
              >
                Upload files
                <VisuallyHiddenInput
                  type="file"
                  onChange={(event) => console.log(event.target.files)}
                  multiple
                />
              </Button>
            </Grid>

            {/* Buttons */}
            <Grid
              item
              xs={12}
              sx={{
                display: "flex",
                gap: 2,
                mt: 3,
                justifyContent: { xs: "center", sm: "flex-start" },
              }}
              component="div"
            >
              <Button variant="outlined" onClick={handleSave} sx={{ px: 4 }}>
                Save
              </Button>
              <Button
                variant="contained"
                color="success"
                onClick={handleList}
                sx={{ px: 4 }}
              >
                List
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </LocalizationProvider>
  );
};

export default JobRegisterPage;
