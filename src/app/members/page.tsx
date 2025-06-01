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
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { useRouter } from "next/navigation";
import { isTokenExpired } from "@/lib/utils";
import Cookies from "js-cookie";

dayjs.extend(customParseFormat);

const API_BASE_URL = process.env.NEXT_PUBLIC_API_ENDPOINT;

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
  useEffect(() => {
    if (isTokenExpired()) {
      Cookies.remove("accessToken");
      Cookies.remove("accessTokenExpiresAt");
      router.push("/login");
    }
  }, [router]);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeType | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [currentUserToken, setCurrentUserToken] = useState("");
  const [isResetPasswordModalVisible, setIsResetPasswordModalVisible] =
    useState(false);
  const [isClient, setIsClient] = useState(false);
  const [employeeData, setEmployeeData] = useState<EmployeeType[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">(
    "success"
  );

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
        const companiesResponse = await fetch(`${API_BASE_URL}/api/companies`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!companiesResponse.ok) {
          throw new Error("Failed to fetch companies");
        }
        const companiesData: CompanyType[] = await companiesResponse.json();
        setCompanies(companiesData);

        const departmentsResponse = await fetch(`${API_BASE_URL}/api/departments`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!departmentsResponse.ok) {
          throw new Error("Failed to fetch departments");
        }
        const departmentsData: DepartmentType[] = await departmentsResponse.json();
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
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch data");
        }

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

  const handleSnackbarClose = (
    event?: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === "clickaway") {
      return;
    }
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

  const handleEdit = () => {
    setIsEditing(true);
  };

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

  const updateUser = async (
    userData: any,
    userId: string,
    token: string
  ): Promise<any> => {
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
        auth: Number(formValues.auth), // Ensure auth is a number
      };

      const updatedUser = await updateUser(
        userData,
        selectedEmployee.id,
        currentUserToken
      );

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

      setSelectedEmployee({
        ...selectedEmployee,
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
      });

      showSnackbar("Employee information updated successfully", "success");
      setIsEditing(false);
      setIsModalVisible(false);
    } catch (error: any) {
      console.error("Error updating user:", error);
      showSnackbar(
        error.message || "Error updating employee information",
        "error"
      );
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
        showSnackbar(
          "New password must be at least 6 characters long",
          "error"
        );
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
            <Grid item xs={12}>
              <TextField
                label="Full Name"
                name="name"
                value={formValues.name || ""}
                onChange={handleFormChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="ID"
                name="id"
                value={formValues.id || ""}
                fullWidth
                disabled
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
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
            <Grid item xs={12}>
              <FormControl fullWidth required>
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
            <Grid item xs={12}>
              <TextField
                label="Title"
                name="title"
                value={formValues.title || ""}
                onChange={handleFormChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Phone Number"
                name="phone"
                value={formValues.phone || ""}
                onChange={handleFormChange}
                fullWidth
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
              />
            </Grid>
            <Grid item xs={12}>
              <DatePicker
                label="Join Date"
                value={formValues.joinDate ? dayjs(formValues.joinDate) : null}
                onChange={(date) => handleDateChange("joinDate", date)}
                format="YYYY-MM-DD" // Use YYYY-MM-DD for consistency with backend
                slotProps={{ textField: { fullWidth: true, required: true } }}
              />
            </Grid>
            <Grid item xs={12}>
              <DatePicker
                label="Start Date"
                value={
                  formValues.startDate ? dayjs(formValues.startDate) : null
                }
                onChange={(date) => handleDateChange("startDate", date)}
                format="YYYY-MM-DD" // Use YYYY-MM-DD for consistency with backend
                slotProps={{ textField: { fullWidth: true, required: true } }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
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
            <Grid item xs={12}>
              <FormControl fullWidth required>
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
            <Grid item xs={12}>
              <FormControl fullWidth required>
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
            <Grid item xs={12}>
              <TextField
                label="Auth Level"
                name="auth"
                type="number" // Set type to number for numeric input
                value={formValues.auth === undefined ? "" : formValues.auth}
                onChange={handleFormChange} // Use handleFormChange for text fields
                fullWidth
                required
                inputProps={{ min: 0 }} // Optional: Add min value constraint
              />
            </Grid>
          </Grid>
        </LocalizationProvider>
      );
    }

    // Display mode content
    return (
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Employee Details
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle1" color="text.secondary">
            Name
          </Typography>
          <Typography variant="body1" fontWeight="bold">
            {selectedEmployee.name}
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle1" color="text.secondary">
            ID
          </Typography>
          <Typography variant="body1">{selectedEmployee.id}</Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle1" color="text.secondary">
            Company
          </Typography>
          <Typography variant="body1">{selectedEmployee.company?.name || 'N/A'}</Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle1" color="text.secondary">
            Department
          </Typography>
          <Typography variant="body1">{selectedEmployee.department?.name || 'N/A'}</Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle1" color="text.secondary">
            Title
          </Typography>
          <Typography variant="body1">{selectedEmployee.title}</Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle1" color="text.secondary">
            Phone
          </Typography>
          <Typography variant="body1">
            {selectedEmployee.phone || "N/A"}
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle1" color="text.secondary">
            Email
          </Typography>
          <Typography variant="body1">
            {selectedEmployee.email || "N/A"}
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle1" color="text.secondary">
            Join Date
          </Typography>
          <Typography variant="body1">{selectedEmployee.joinDate}</Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle1" color="text.secondary">
            Start Date
          </Typography>
          <Typography variant="body1">{selectedEmployee.startDate}</Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle1" color="text.secondary">
            Contract
          </Typography>
          <Typography variant="body1">{selectedEmployee.contract}</Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle1" color="text.secondary">
            Status
          </Typography>
          <Typography variant="body1">{selectedEmployee.status}</Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle1" color="text.secondary">
            Level
          </Typography>
          <Typography variant="body1">{selectedEmployee.level}</Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle1" color="text.secondary">
            Auth Level
          </Typography>
          <Typography variant="body1">{selectedEmployee.auth}</Typography>
        </Grid>
      </Grid>
    );
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  return (
    <div>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Container maxWidth="lg" sx={{ py: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="h4" gutterBottom>
                Employee Management
              </Typography>
              <TableContainer component={Paper}>
                <Table sx={{ minWidth: 650 }} aria-label="employee table">
                  <TableHead sx={{ backgroundColor: "black" }}>
                    <TableRow>
                      <TableCell sx={{ color: "white" }}>No</TableCell>
                      <TableCell sx={{ color: "white" }}>ID</TableCell>
                      <TableCell sx={{ color: "white" }}>Company</TableCell>
                      <TableCell sx={{ color: "white" }}>Name</TableCell>
                      <TableCell sx={{ color: "white" }}>Tel</TableCell>
                      <TableCell sx={{ color: "white" }}>Title</TableCell>
                      <TableCell sx={{ color: "white" }}>Department</TableCell>
                      <TableCell sx={{ color: "white" }}>Start Date</TableCell>
                      <TableCell sx={{ color: "white" }}>
                        Employment Type
                      </TableCell>
                      <TableCell sx={{ color: "white" }}>Auth</TableCell>
                      <TableCell sx={{ color: "white" }}>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {employeeData
                      .slice(
                        page * rowsPerPage,
                        page * rowsPerPage + rowsPerPage
                      )
                      .map((employee) => (
                        <TableRow
                          key={employee.key}
                          sx={{
                            "&:last-child td, &:last-child th": { border: 0 },
                          }}
                        >
                          <TableCell component="th" scope="row">
                            {employee.no}
                          </TableCell>
                          <TableCell>
                            <Button
                              onClick={() => showEmployeeDetails(employee)}
                            >
                              {employee.id}
                            </Button>
                          </TableCell>
                          <TableCell>{employee.company?.name || 'N/A'}</TableCell>
                          <TableCell>{employee.name}</TableCell>
                          <TableCell>{employee.phone || "N/A"}</TableCell>
                          <TableCell>{employee.title}</TableCell>
                          <TableCell>{employee.department?.name || 'N/A'}</TableCell>
                          <TableCell>
                            {employee.startDate
                              ? dayjs(employee.startDate).format("YYYY-MM-DD")
                              : "N/A"}
                          </TableCell>
                          <TableCell>{employee.employmentType}</TableCell>
                          <TableCell>{employee.auth}</TableCell>
                          <TableCell>
                            <Box sx={{ display: "flex", gap: 1 }}>
                              <Button
                                variant="text"
                                size="small"
                                onClick={() => showEmployeeDetails(employee)}
                              >
                                View
                              </Button>
                              <Button
                                variant="text"
                                size="small"
                                onClick={() => showResetPasswordModal(employee)}
                              >
                                Reset password
                              </Button>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[10, 20, 50]}
                component="div"
                count={employeeData.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelRowsPerPage="Rows per page:"
                labelDisplayedRows={({ from, to, count }) =>
                  `Total ${count} employees`
                }
              />
            </CardContent>
          </Card>

          <Dialog
            open={isModalVisible}
            onClose={() => {
              setIsModalVisible(false);
              setIsEditing(false);
              setFormValues({ company: { name: "" }, department: { name: "" } });
            }}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>
              {isEditing ? "Edit Employee Information" : "Employee Details"}
            </DialogTitle>
            <DialogContent dividers>{renderModalContent()}</DialogContent>
            <DialogActions>
              {isEditing ? (
                <>
                  <Button onClick={handleCancelEdit}>Cancel</Button>
                  <Button
                    onClick={handleSave}
                    variant="contained"
                    disabled={loading}
                  >
                    {loading ? "Saving..." : "Save Changes"}
                  </Button>
                </>
              ) : (
                <>
                  <Button onClick={() => setIsModalVisible(false)}>
                    Close
                  </Button>
                  <Button onClick={handleEdit} variant="contained">
                    Edit
                  </Button>
                </>
              )}
            </DialogActions>
          </Dialog>

          <Dialog
            open={isResetPasswordModalVisible}
            onClose={() => setIsResetPasswordModalVisible(false)}
            maxWidth="xs"
            fullWidth
          >
            <DialogTitle>Reset Password</DialogTitle>
            <DialogContent dividers>
              <TextField
                label="New Password"
                type="password"
                fullWidth
                value={resetPasswordValue}
                onChange={(e) => setResetPasswordValue(e.target.value)}
                required
                inputProps={{ minLength: 6 }}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setIsResetPasswordModalVisible(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleResetPasswordSubmit}
                variant="contained"
                disabled={loading}
              >
                {loading ? "Resetting..." : "Reset"}
              </Button>
            </DialogActions>
          </Dialog>

          <Snackbar
            open={snackbarOpen}
            autoHideDuration={6000}
            onClose={handleSnackbarClose}
            anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
          >
            <Alert
              onClose={handleSnackbarClose}
              severity={snackbarSeverity}
              sx={{ width: "100%" }}
            >
              {snackbarMessage}
            </Alert>
          </Snackbar>
        </Container>
      </LocalizationProvider>
    </div>
  );
};

export default EmployeesPage;