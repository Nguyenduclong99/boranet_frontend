"use client";
import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Box,
  Card,
  CardContent,
  Snackbar,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  useMediaQuery,
  Theme,
  IconButton,
  Tooltip,
  Avatar,
  styled,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { useRouter } from "next/navigation";
import { isTokenExpired } from "@/lib/utils";
import Cookies from "js-cookie";
import {
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Key as KeyIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { ThemeProvider, createTheme } from '@mui/material/styles';

dayjs.extend(customParseFormat);

const API_BASE_URL = process.env.NEXT_PUBLIC_API_ENDPOINT;

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    success: {
      main: '#4caf50',
      light: '#e8f5e9',
    },
    warning: {
      main: '#ff9800',
      light: '#fff3e0',
    },
    error: {
      main: '#f44336',
      light: '#ffebee',
    },
  },
});

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  "&:hover": {
    backgroundColor: theme.palette.action.hover,
    cursor: "pointer",
  },
  "&:last-child td, &:last-child th": { border: 0 },
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 500,
}));

const HeaderTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: "bold",
  backgroundColor: "black",
  color: theme.palette.common.white,
}));

interface CompanyType {
  id?: number;
  name: string;
}

interface DepartmentType {
  id?: number;
  name: string;
}

interface EmployeeType {
  key: React.Key;
  no: number;
  id: string;
  name: string;
  password?: string;
  company: CompanyType;
  department: DepartmentType;
  title: string;
  phone?: string;
  email?: string;
  startDate: string;
  joinDate: string;
  employmentType: string;
  contract: string;
  status: string;
  level: string;
  auth: number;
}

const employeeStatusOptions = ["Employed", "On Leave", "Terminated"];
const employeeLevelOptions = ["Staff", "Senior Staff", "Manager", "Director"];
const contractTypeOptions = ["Full Time Emp", "Part Time Emp", "Contractor"];
const authOptions = [0, 1, 2, 3, 4, 5];

const EmployeesPage = () => {
  const router = useRouter();
  const isMobile = useMediaQuery("(max-width:600px)");
  const isTablet = useMediaQuery("(min-width:600px) and (max-width:960px)");

  useEffect(() => {
    if (isTokenExpired()) {
      Cookies.remove("accessToken");
      Cookies.remove("accessTokenExpiresAt");
      router.push("/login");
    }
  }, [router]);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeType | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentUserToken, setCurrentUserToken] = useState("");
  const [isResetPasswordModalVisible, setIsResetPasswordModalVisible] = useState(false);
  const [employeeData, setEmployeeData] = useState<EmployeeType[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">("success");

  const [companies, setCompanies] = useState<CompanyType[]>([]);
  const [departments, setDepartments] = useState<DepartmentType[]>([]);

  const [formValues, setFormValues] = useState<Partial<EmployeeType>>({
    company: { name: "" },
    department: { name: "" },
  });
  const [resetPasswordValue, setResetPasswordValue] = useState("");

  useEffect(() => {
    const token = Cookies.get("accessToken");
    if (token) {
      setCurrentUserToken(token);
    }
  }, []);

  useEffect(() => {
    const fetchCompaniesAndDepartments = async () => {
      const token = Cookies.get("accessToken");
      if (!token) {
        showSnackbar("Authentication token not found. Please log in.", "error");
        router.push("/login");
        return;
      }

      try {
        const [companiesResponse, departmentsResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/api/companies`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE_URL}/api/departments`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!companiesResponse.ok) throw new Error("Failed to fetch companies");
        if (!departmentsResponse.ok) throw new Error("Failed to fetch departments");

        const [companiesData, departmentsData] = await Promise.all([
          companiesResponse.json(),
          departmentsResponse.json(),
        ]);

        setCompanies(companiesData);
        setDepartments(departmentsData);
      } catch (error) {
        console.error("Error fetching companies or departments:", error);
        showSnackbar("Error loading department options", "error");
      }
    };

    fetchCompaniesAndDepartments();
  }, [currentUserToken, router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = Cookies.get("accessToken");
        const response = await fetch(`${API_BASE_URL}/api/users/getList`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error("Failed to fetch data");

        const data = await response.json();
        const dataWithKeys = data.map((item: any, index: number) => ({
          ...item,
          key: item.id,
          no: index + 1,
          company: { name: item.company || "" },
          department: { name: item.department || "" },
          auth: Number(item.auth),
        }));
        setEmployeeData(dataWithKeys);
      } catch (error) {
        console.error("Error fetching data:", error);
        showSnackbar("Error fetching employee data", "error");
      }
    };

    fetchData();
  }, []);

  const showSnackbar = (message: string, severity: "success" | "error") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === "clickaway") return;
    setSnackbarOpen(false);
  };

  const showEmployeeDetails = (employee: EmployeeType) => {
    setSelectedEmployee(employee);
    setFormValues({
      ...employee,
      company: employee.company || { name: "" },
      department: employee.department || { name: "" },
      joinDate: employee.joinDate
        ? dayjs(employee.joinDate, "YYYY-MM-DD").format("YYYY-MM-DD")
        : "",
      startDate: employee.startDate
        ? dayjs(employee.startDate, "YYYY-MM-DD").format("YYYY-MM-DD")
        : "",
      auth: employee.auth,
    });
    setIsModalVisible(true);
    setIsEditing(false);
  };

  const handleEdit = () => setIsEditing(true);
  const handleCancelEdit = () => {
    setIsEditing(false);
    if (selectedEmployee) {
      setFormValues({
        ...selectedEmployee,
        company: selectedEmployee.company || { name: "" },
        department: selectedEmployee.department || { name: "" },
        joinDate: selectedEmployee.joinDate
          ? dayjs(selectedEmployee.joinDate, "YYYY-MM-DD").format("YYYY-MM-DD")
          : "",
        startDate: selectedEmployee.startDate
          ? dayjs(selectedEmployee.startDate, "YYYY-MM-DD").format("YYYY-MM-DD")
          : "",
        auth: selectedEmployee.auth,
      });
    }
  };

  const handleFormChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setFormValues({ ...formValues, [name]: value });
  };

  const handleSelectChange = (event: any) => {
    const { name, value } = event.target;

    if (name === "company") {
      const selectedCompany = companies.find(c => c.name === value);
      setFormValues({ ...formValues, company: selectedCompany || { name: value } });
    } else if (name === "department") {
      const selectedDepartment = departments.find(d => d.name === value);
      setFormValues({ ...formValues, department: selectedDepartment || { name: value } });
    } else {
      setFormValues({ ...formValues, [name]: value });
    }
  };

  const handleDateChange = (name: string, date: dayjs.Dayjs | null) => {
    setFormValues({
      ...formValues,
      [name]: date ? date.format("YYYY-MM-DD") : null,
    });
  };

  const updateUser = async (userData: any, userId: string, token: string): Promise<any> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update user");
      }
      return await response.json();
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  };

  const handleSave = async () => {
    if (!selectedEmployee) return;

    try {
      setLoading(true);
      if (
        !formValues.name ||
        !formValues.company?.name ||
        !formValues.department?.name ||
        !formValues.title ||
        !formValues.contract ||
        !formValues.status ||
        !formValues.level ||
        formValues.auth === undefined
      ) {
        showSnackbar("Please fill in all required fields", "error");
        setLoading(false);
        return;
      }

      const userData = {
        username: selectedEmployee.id,
        email: formValues.email,
        name: formValues.name,
        phone: formValues.phone,
        company: formValues.company,
        department: formValues.department,
        title: formValues.title,
        employmentType: formValues.employmentType,
        startDate: formValues.startDate,
        joinDate: formValues.joinDate,
        contract: formValues.contract,
        status: formValues.status,
        level: formValues.level,
        auth: Number(formValues.auth),
      };

      const updatedUser = await updateUser(userData, selectedEmployee.id, currentUserToken);

      setEmployeeData(
        employeeData.map((emp) =>
          emp.id === selectedEmployee.id
            ? {
                ...emp,
                ...updatedUser,
                name: updatedUser.name,
                company: updatedUser.company || {name: ""},
                department: updatedUser.department || {name: ""},
                phone: updatedUser.phone,
                email: updatedUser.email,
                title: updatedUser.title,
                employmentType: updatedUser.employmentType,
                startDate: updatedUser.startDate,
                joinDate: updatedUser.joinDate,
                contract: updatedUser.contract,
                status: updatedUser.status,
                level: updatedUser.level,
                auth: updatedUser.auth,
              }
            : emp
        )
      );

      showSnackbar("Employee information updated successfully", "success");
      setIsEditing(false);
      setIsModalVisible(false);
    } catch (error: any) {
      console.error("Error updating user:", error);
      showSnackbar(error.message || "Error updating employee information", "error");
    } finally {
      setLoading(false);
    }
  };

  const showResetPasswordModal = (employee: EmployeeType) => {
    setSelectedEmployee(employee);
    setIsResetPasswordModalVisible(true);
    setResetPasswordValue("");
  };

  const handleResetPasswordSubmit = async () => {
    if (!selectedEmployee) return;

    try {
      setLoading(true);
      if (!resetPasswordValue || resetPasswordValue.length < 6) {
        showSnackbar("New password must be at least 6 characters long", "error");
        setLoading(false);
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/auth/users/${selectedEmployee.id}/reset-password`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${currentUserToken}`,
          },
          body: JSON.stringify({ password: resetPasswordValue }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to reset password");
      }

      showSnackbar("Password reset successfully", "success");
      setIsResetPasswordModalVisible(false);
    } catch (error: any) {
      console.error("Error resetting password:", error);
      showSnackbar(error.message || "Error resetting password", "error");
    } finally {
      setLoading(false);
    }
  };

  const renderModalContent = () => {
    if (!selectedEmployee) return null;

    if (isEditing) {
      return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Full Name"
                name="name"
                value={formValues.name || ""}
                onChange={handleFormChange}
                fullWidth
                required
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="ID"
                name="id"
                value={formValues.id || ""}
                fullWidth
                disabled
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required margin="normal">
                <InputLabel>Company</InputLabel>
                <Select
                  label="Company"
                  name="company"
                  value={formValues.company?.name || ""}
                  onChange={handleSelectChange}
                >
                  <MenuItem value="">Select Company</MenuItem>
                  {companies.map((comp) => (
                    <MenuItem key={comp.id || comp.name} value={comp.name}>
                      {comp.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required margin="normal">
                <InputLabel>Department</InputLabel>
                <Select
                  label="Department"
                  name="department"
                  value={formValues.department?.name || ""}
                  onChange={handleSelectChange}
                >
                  <MenuItem value="">Select Department</MenuItem>
                  {departments.map((dept) => (
                    <MenuItem key={dept.id || dept.name} value={dept.name}>
                      {dept.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Title"
                name="title"
                value={formValues.title || ""}
                onChange={handleFormChange}
                fullWidth
                required
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Phone Number"
                name="phone"
                value={formValues.phone || ""}
                onChange={handleFormChange}
                fullWidth
                margin="normal"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Email"
                name="email"
                type="email"
                value={formValues.email || ""}
                onChange={handleFormChange}
                fullWidth
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="Join Date"
                value={formValues.joinDate ? dayjs(formValues.joinDate) : null}
                onChange={(date) => handleDateChange("joinDate", date)}
                format="YYYY-MM-DD"
                slotProps={{ textField: { fullWidth: true, required: true, margin: "normal" } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="Start Date"
                value={formValues.startDate ? dayjs(formValues.startDate) : null}
                onChange={(date) => handleDateChange("startDate", date)}
                format="YYYY-MM-DD"
                slotProps={{ textField: { fullWidth: true, required: true, margin: "normal" } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required margin="normal">
                <InputLabel>Contract Type</InputLabel>
                <Select
                  label="Contract Type"
                  name="contract"
                  value={formValues.contract || ""}
                  onChange={handleSelectChange}
                >
                  {contractTypeOptions.map((contract) => (
                    <MenuItem key={contract} value={contract}>
                      {contract}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required margin="normal">
                <InputLabel>Status</InputLabel>
                <Select
                  label="Status"
                  name="status"
                  value={formValues.status || ""}
                  onChange={handleSelectChange}
                >
                  {employeeStatusOptions.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required margin="normal">
                <InputLabel>Level</InputLabel>
                <Select
                  label="Level"
                  name="level"
                  value={formValues.level || ""}
                  onChange={handleSelectChange}
                >
                  {employeeLevelOptions.map((level) => (
                    <MenuItem key={level} value={level}>
                      {level}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required margin="normal">
                <InputLabel>Auth Level</InputLabel>
                <Select
                  label="Auth Level"
                  name="auth"
                  value={formValues.auth === undefined ? "" : formValues.auth}
                  onChange={handleSelectChange}
                >
                  {authOptions.map((level) => (
                    <MenuItem key={level} value={level}>
                      {level}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </LocalizationProvider>
      );
    }

    return (
      <Box sx={{ p: 2 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <Avatar sx={{ bgcolor: "primary.main", mr: 2, width: 60, height: 60, fontSize: '2rem' }}>
            {selectedEmployee.name.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="h5" component="div" fontWeight="bold">
              {selectedEmployee.name}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {selectedEmployee.title}
            </Typography>
          </Box>
        </Box>

        <Grid container spacing={4}>
          {/* Personal Information */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>Personal Information</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">Employee ID</Typography>
                <Typography variant="body1">{selectedEmployee.id}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                <Typography variant="body1">{selectedEmployee.email || "N/A"}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">Phone Number</Typography>
                <Typography variant="body1">{selectedEmployee.phone || "N/A"}</Typography>
              </Grid>
            </Grid>
          </Grid>

          {/* Company & Department */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>Organization Details</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">Company</Typography>
                <Typography variant="body1">{selectedEmployee.company?.name || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">Department</Typography>
                <Typography variant="body1">{selectedEmployee.department?.name || 'N/A'}</Typography>
              </Grid>
            </Grid>
          </Grid>

          {/* Employment Details */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>Employment Details</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">Join Date</Typography>
                <Typography variant="body1">{selectedEmployee.joinDate}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">Start Date</Typography>
                <Typography variant="body1">{selectedEmployee.startDate}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">Contract Type</Typography>
                <Typography variant="body1">{selectedEmployee.contract}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                <Box
                  display="inline-block"
                  px={1}
                  borderRadius={1}
                  color={
                    selectedEmployee.status === "Employed" ? "success.main" :
                    selectedEmployee.status === "On Leave" ? "warning.main" :
                    "error.main"
                  }
                  bgcolor={
                    selectedEmployee.status === "Employed" ? "success.light" :
                    selectedEmployee.status === "On Leave" ? "warning.light" :
                    "error.light"
                  }
                >
                  <Typography variant="body1" component="span">{selectedEmployee.status}</Typography>
                </Box>
              </Grid>
            </Grid>
          </Grid>

          {/* Access & Level */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>Access & Level</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">Level</Typography>
                <Typography variant="body1">{selectedEmployee.level}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">Authorization Level</Typography>
                <Typography variant="body1">{selectedEmployee.auth}</Typography>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Box>
    );
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Card elevation={3} sx={{ borderRadius: 2 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h5" fontWeight="bold">
                Employee Management
              </Typography>
            </Box>

            <TableContainer component={Paper} sx={{ maxHeight: 'calc(100vh - 200px)', overflowX: 'auto' }}>
              <Table stickyHeader aria-label="employee table" size={isMobile ? "small" : "medium"}>
                <TableHead>
                  <TableRow>
                    <HeaderTableCell>No</HeaderTableCell>
                    {!isMobile && <HeaderTableCell>ID</HeaderTableCell>}
                    <HeaderTableCell>Name</HeaderTableCell>
                    {!isMobile && <HeaderTableCell>Company</HeaderTableCell>}
                    {!isTablet && <HeaderTableCell>Department</HeaderTableCell>}
                    {!isMobile && <HeaderTableCell>Title</HeaderTableCell>}
                    <HeaderTableCell>Status</HeaderTableCell>
                    {!isMobile && <HeaderTableCell>Auth</HeaderTableCell>}
                    <HeaderTableCell align="center">Actions</HeaderTableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {employeeData
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((employee) => (
                      <StyledTableRow key={employee.key} hover onClick={() => showEmployeeDetails(employee)}>
                        <StyledTableCell>{employee.no}</StyledTableCell>
                        {!isMobile && <StyledTableCell>{employee.id}</StyledTableCell>}
                        <StyledTableCell>
                          <Box display="flex" alignItems="center">
                            <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: 'primary.main' }}>
                              {employee.name.charAt(0)}
                            </Avatar>
                            {employee.name}
                          </Box>
                        </StyledTableCell>
                        {!isMobile && <StyledTableCell>{employee.company?.name || 'N/A'}</StyledTableCell>}
                        {!isTablet && <StyledTableCell>{employee.department?.name || 'N/A'}</StyledTableCell>}
                        {!isMobile && <StyledTableCell>{employee.title}</StyledTableCell>}
                        <StyledTableCell>
                          <Box
                            display="inline-block"
                            px={1}
                            borderRadius={1}
                            color={
                              employee.status === "Employed" ? "success.main" :
                              employee.status === "On Leave" ? "warning.main" :
                              "error.main"
                            }
                            bgcolor={
                              employee.status === "Employed" ? "success.light" :
                              employee.status === "On Leave" ? "warning.light" :
                              "error.light"
                            }
                          >
                            {employee.status}
                          </Box>
                        </StyledTableCell>
                        {!isMobile && <StyledTableCell>{employee.auth}</StyledTableCell>}
                        <StyledTableCell align="center">
                          <Box display="flex" justifyContent="center" gap={1}>
                            <Tooltip title="View details">
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  showEmployeeDetails(employee);
                                }}
                                color="primary"
                              >
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Reset password">
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  showResetPasswordModal(employee);
                                }}
                                color="secondary"
                              >
                                <KeyIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </StyledTableCell>
                      </StyledTableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              rowsPerPageOptions={[10, 25, 50]}
              component="div"
              count={employeeData.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Rows per page:"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} of ${count} employees`}
              sx={{ mt: 2 }}
            />
          </CardContent>
        </Card>

        {/* Employee Details/Edit Dialog */}
        <Dialog
          open={isModalVisible}
          onClose={() => {
            setIsModalVisible(false);
            setIsEditing(false);
            setFormValues({ company: { name: "" }, department: { name: "" } });
          }}
          maxWidth="md"
          fullWidth
          fullScreen={isMobile}
        >
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {isEditing ? "Edit Employee" : "Employee Details"}
            <IconButton
              onClick={() => {
                setIsModalVisible(false);
                setIsEditing(false);
              }}
              sx={{ color: (theme) => theme.palette.grey[500] }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers sx={{ pt: 2 }}>
            {renderModalContent()}
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            {isEditing ? (
              <>
                <Button
                  onClick={handleCancelEdit}
                  variant="outlined"
                  color="inherit"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  variant="contained"
                  disabled={loading}
                  sx={{ ml: 1 }}
                >
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={() => setIsModalVisible(false)}
                  variant="outlined"
                  color="inherit"
                >
                  Close
                </Button>
                <Button
                  onClick={handleEdit}
                  variant="contained"
                  sx={{ ml: 1 }}
                  startIcon={<EditIcon />}
                >
                  Edit
                </Button>
              </>
            )}
          </DialogActions>
        </Dialog>

        {/* Reset Password Dialog */}
        <Dialog
          open={isResetPasswordModalVisible}
          onClose={() => setIsResetPasswordModalVisible(false)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>Reset Password for {selectedEmployee?.name}</DialogTitle>
          <DialogContent dividers>
            <TextField
              label="New Password"
              type="password"
              fullWidth
              value={resetPasswordValue}
              onChange={(e) => setResetPasswordValue(e.target.value)}
              required
              margin="normal"
              helperText="Password must be at least 6 characters long"
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button
              onClick={() => setIsResetPasswordModalVisible(false)}
              variant="outlined"
              color="inherit"
            >
              Cancel
            </Button>
            <Button
              onClick={handleResetPasswordSubmit}
              variant="contained"
              disabled={loading}
              sx={{ ml: 1 }}
              color="secondary"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            onClose={handleSnackbarClose}
            severity={snackbarSeverity}
            sx={{ width: "100%" }}
            elevation={6}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Container>
    </LocalizationProvider>
  );
};

const ThemedEmployeesPage = () => (
  <ThemeProvider theme={theme}>
    <EmployeesPage />
  </ThemeProvider>
);

export default ThemedEmployeesPage;