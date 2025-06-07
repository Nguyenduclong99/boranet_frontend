"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { isTokenExpired } from "@/lib/utils";
import { useAppContext } from "@/app/app-provider";
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
  Container,
  Stack,
  Chip,
  Avatar,
  Card,
  CardContent,
  CardHeader,
  Stepper,
  Step,
  StepLabel,
} from "@mui/material";
import { styled, useTheme } from "@mui/material/styles";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import {
  CloudUpload as CloudUploadIcon,
  Event as EventIcon,
  Clear as ClearIcon,
  Person as PersonIcon,
  Work as WorkIcon,
  Description as DescriptionIcon,
  AttachFile as AttachFileIcon,
  ListAlt as ListAltIcon,
} from "@mui/icons-material";
import dayjs, { Dayjs } from "dayjs";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8081/api";

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
  category: string;
  priority: string;
  cd: string;
  assignees: string;
  dueDate: Dayjs | null;
  region: string;
  description: string;
  attachments: File[];
}

interface FormErrors {
  [key: string]: string | undefined;
}

const steps = ["Job Details", "Additional Information", "Attachments"];

const JobRegisterPage = () => {
  const router = useRouter();
  const { isAuthenticated, currentUser, logout } = useAppContext();
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(0);

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
          throw new Error(
            categoriesResponse.status === 401 || categoriesResponse.status === 403
              ? "Unauthorized access for categories. Please log in again."
              : `Failed to load categories: ${categoriesResponse.statusText}`
          );
        }

        if (!assigneesResponse.ok) {
          throw new Error(
            assigneesResponse.status === 401 || assigneesResponse.status === 403
              ? "Unauthorized access for assignees. Please log in again."
              : `Failed to load assignees: ${assigneesResponse.statusText}`
          );
        }

        const [categoriesData, assigneesData] = await Promise.all([
          categoriesResponse.json(),
          assigneesResponse.json(),
        ]);

        setCategories(categoriesData);
        setAssignees(assigneesData);
      } catch (err: unknown) {
        console.error("Error fetching data:", err);
        const errorMessage = err instanceof Error ? err.message : "Failed to load data. Please try again.";
        setError(errorMessage);
        
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

  const handleNext = () => {
    // Validate current step before proceeding
    if (activeStep === 0) {
      const requiredFields = ["title", "customer", "category", "priority", "cd", "assignees", "region"];
      const errors: FormErrors = {};
      
      requiredFields.forEach(field => {
        if (!formData[field as keyof FormDataState]) {
          errors[field] = "This field is required";
        }
      });
      
      if (!formData.dueDate) {
        errors.dueDate = "Due date is required";
      }
      
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        return;
      }
    }
    
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | { name?: string; value: unknown }>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name as string]: value,
    }));
    if (name && formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleDueDateChange = (date: Dayjs | null) => {
    setFormData((prev) => ({
      ...prev,
      dueDate: date,
    }));
    if (formErrors.dueDate) {
      setFormErrors((prev) => ({ ...prev, dueDate: "" }));
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const newErrors: FormErrors = {};
    const allowedTypes = ['.pdf', '.jpg', '.jpeg', '.png'];
    const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png'];

    if (files.length > 5) {
      newErrors.attachments = "You can upload a maximum of 5 files.";
    } else {
      const oversizedFiles = files.filter(file => file.size > 10 * 1024 * 1024);
      if (oversizedFiles.length > 0) {
        newErrors.attachments = "Some files exceed the 10MB limit.";
      }
    
      const invalidFiles = files.filter(file => {
        const nameParts = file.name.split('.');
        const fileExtension = nameParts.length > 1 ? '.' + nameParts.pop()?.toLowerCase() : '';
        return !allowedTypes.includes(fileExtension) && !allowedMimeTypes.includes(file.type);
      });
      if (invalidFiles.length > 0) {
        newErrors.attachments = "Some files have unsupported formats. Only PDF, JPG, and PNG are allowed.";
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

  const removeAttachment = (index: number) => {
    const newAttachments = [...formData.attachments];
    newAttachments.splice(index, 1);
    setFormData(prev => ({ ...prev, attachments: newAttachments }));
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    const requiredFields: Array<keyof FormDataState> = [
      "title",
      "customer",
      "category",
      "priority",
      "cd",
      "assignees",
      "region",
    ];
    const fieldDisplayNames: Record<string, string> = {
      title: "Job Title",
      customer: "Customer Name",
      category: "Category",
      priority: "Priority",
      cd: "Contact Department",
      assignees: "Assignee",
      region: "Region",
      dueDate: "Due Date"
    };

    requiredFields.forEach((field) => {
      if (!formData[field]) {
        errors[field] = `${fieldDisplayNames[field] || field} is required.`;
      }
    });

    if (!formData.dueDate) {
      errors.dueDate = "Due Date is required.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    setSubmissionStatus({ message: null, severity: undefined });
    
    if (!validateForm()) {
      setSubmissionStatus({
        message: "Please correct the errors in the form.",
        severity: "error",
      });
      return;
    }

    setLoading(true);
    const accessToken = Cookies.get("accessToken");

    if (!accessToken) {
      setSubmissionStatus({ message: "Authentication token missing.", severity: "error" });
      setLoading(false);
      logout();
      router.push("/login");
      return;
    }

    try {
      const formDataToSend = new FormData();
      const jobRequest = {
        title: formData.title,
        description: formData.description,
        dueDate: formData.dueDate ? formData.dueDate.format("YYYY-MM-DDTHH:mm:ss") : null,
        status: 1,
        assigneeId: formData.assignees ? parseInt(formData.assignees, 10) : null,
        customer: formData.customer,
        category: formData.category,
        priority: formData.priority,
        cdId: formData.cd ? parseInt(formData.cd, 10) : null,
        completedAt: null,
        region: formData.region,
      };

      const jobRequestBlob = new Blob([JSON.stringify(jobRequest)], { type: "application/json" });
      formDataToSend.append("jobRequest", jobRequestBlob, "jobRequest.json");

      formData.attachments.forEach((file) => {
        formDataToSend.append("attachments", file);
      });

      const response = await fetch(`${API_BASE_URL}/jobs`, {
        method: "POST",
        headers: {
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

      setSubmissionStatus({
        message: "Job order registered successfully!",
        severity: "success",
      });
      
      // Reset form after successful submission
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
      setFormErrors({});
    } catch (submitError: any) {
      console.error("Submission error:", submitError);
      setSubmissionStatus({
        message: `Failed to register job order: ${submitError.message || "Unknown error"}`,
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleList = () => {
    router.push("/jobs/order-list");
  };

  if (loading && !submissionStatus.message) {
    return (
      <Container maxWidth="sm" sx={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Stack alignItems="center" spacing={3}>
          <CircularProgress size={60} thickness={4} />
          <Typography variant="h6" color="text.secondary">
            Loading job registration data...
          </Typography>
        </Stack>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Card elevation={3}>
          <CardHeader 
            title="Error Loading Data"
            avatar={
              <Avatar sx={{ bgcolor: theme.palette.error.main }}>
                <WorkIcon />
              </Avatar>
            }
          />
          <CardContent>
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => window.location.reload()}
                fullWidth
              >
                Retry
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => router.push("/login")}
                fullWidth
              >
                Go to Login
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Container maxWidth="md" sx={{ py: { xs: 2, md: 4 } }}>
        <Box sx={{ mb: 4, textAlign: "center" }}>
          <Typography
            variant="h3"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 700,
              color: theme.palette.primary.main,
              fontSize: { xs: "2rem", sm: "2.5rem", md: "3rem" },
            }}
          >
            Register New Job Order
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Fill in the details below to create a new job order
          </Typography>
        </Box>

        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Card
          elevation={3}
          sx={{
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <CardHeader 
            title={
              <Typography variant="h5" component="h2">
                {steps[activeStep]}
              </Typography>
            }
            avatar={
              <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                {activeStep === 0 ? <WorkIcon /> : activeStep === 1 ? <DescriptionIcon /> : <AttachFileIcon />}
              </Avatar>
            }
          />
          <CardContent>
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

            {activeStep === 0 && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
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
                    placeholder="e.g., Website Redesign Project"
                    InputLabelProps={{ shrink: true }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <WorkIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
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
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth size="medium" required error={!!formErrors.category}>
                    <InputLabel id="category-label">Category</InputLabel>
                    <Select
                      labelId="category-label"
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      label="Category"
                      startAdornment={
                        <InputAdornment position="start">
                          <WorkIcon color="action" />
                        </InputAdornment>
                      }
                    >
                      <MenuItem value="">
                        <em>Select a category</em>
                      </MenuItem>
                      {categories.map((cat) => (
                        <MenuItem key={cat.id} value={cat.id}>
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

                <Grid item xs={12} md={6}>
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

                <Grid item xs={12} md={6}>
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

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth size="medium" required error={!!formErrors.assignees}>
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
                      {assignees.map((user) => (
                        <MenuItem key={user.id} value={user.id.toString()}>
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

                <Grid item xs={12} md={6}>
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
                          startAdornment: (
                            <InputAdornment position="start">
                              <EventIcon color="action" />
                            </InputAdornment>
                          ),
                          endAdornment: formData.dueDate ? (
                            <IconButton onClick={() => handleDueDateChange(null)} size="small" edge="end">
                              <ClearIcon fontSize="small" color="action" />
                            </IconButton>
                          ) : null,
                        },
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
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
              </Grid>
            )}

            {activeStep === 1 && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Job Description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    multiline
                    rows={6}
                    variant="outlined"
                    placeholder="Provide detailed description including requirements, scope, and deliverables..."
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>
            )}

            {activeStep === 2 && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Stack spacing={2}>
                    <Button
                      component="label"
                      variant="contained"
                      color="primary"
                      startIcon={<CloudUploadIcon />}
                      sx={{ width: { xs: '100%', sm: 'auto' } }}
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
                      <Box>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          Selected files:
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                          {formData.attachments.map((file, index) => (
                            <Chip
                              key={index}
                              label={file.name}
                              onDelete={() => removeAttachment(index)}
                              variant="outlined"
                              sx={{ mb: 1 }}
                              avatar={<Avatar><AttachFileIcon fontSize="small" /></Avatar>}
                            />
                          ))}
                        </Stack>
                      </Box>
                    )}
                    
                    {formErrors.attachments && (
                      <Typography variant="caption" color="error">
                        {formErrors.attachments}
                      </Typography>
                    )}
                    
                    <Typography variant="caption" color="text.secondary">
                      Maximum 5 files, 10MB each. Supported formats: PDF, JPG, PNG.
                    </Typography>
                  </Stack>
                </Grid>
              </Grid>
            )}

            <Divider sx={{ my: 4 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button
                variant="outlined"
                color="secondary"
                onClick={handleList}
                sx={{ minWidth: 150 }}
                disabled={loading}
                startIcon={<ListAltIcon />}
              >
                View All Jobs
              </Button>

              <Box sx={{ display: 'flex', gap: 2 }}>
                {activeStep > 0 && (
                  <Button
                    variant="outlined"
                    onClick={handleBack}
                    sx={{ minWidth: 150 }}
                    disabled={loading}
                  >
                    Back
                  </Button>
                )}
                
                {activeStep < steps.length - 1 ? (
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    sx={{ minWidth: 150 }}
                    disabled={loading}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSave}
                    sx={{ minWidth: 150 }}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
                  >
                    {loading ? "Processing..." : "Submit Job Order"}
                  </Button>
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </LocalizationProvider>
  );
};

export default JobRegisterPage;