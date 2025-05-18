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

interface EmployeeType {
  key: React.Key;
  no: number;
  id: string;
  name: string;
  password?: string;
  company: string;
  department: string;
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
const departmentOptions = ["Sales", "Marketing", "IT", "HR", "Finance"];
const contractTypeOptions = ["Full Time Emp", "Part Time Emp", "Contractor"];

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

  // State for form fields (manual handling without Ant Design Form)
  const [formValues, setFormValues] = useState<Partial<EmployeeType>>({});
  const [resetPasswordValue, setResetPasswordValue] = useState("");

  useEffect(() => {
    setIsClient(true);
    const token = localStorage.getItem("accessToken") || "";
    setCurrentUserToken(token);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const accessToken = localStorage.getItem("accessToken");
        const response = await fetch(`${API_BASE_URL}/api/users/getList`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch data");
        }

        const data = await response.json();
        const dataWithKeys = data.map((item: any, index: number) => ({
          ...item,
          key: item.id, // Use id as key if available, otherwise index
          no: index + 1,
        }));
        setEmployeeData(dataWithKeys);
      } catch (error) {
        console.error("Error fetching data:", error);
        showSnackbar("Có lỗi xảy ra khi tải dữ liệu nhân viên", "error");
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
      joinDate: employee.joinDate
        ? dayjs(employee.joinDate, "YYYY-MM-DD").format("YYYY-MM-DD")
        : "",
      startDate: employee.startDate
        ? dayjs(employee.startDate, "YYYY-MM-DD").format("YYYY-MM-DD")
        : "",
    });
    setIsModalVisible(true);
    setIsEditing(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setFormValues({}); // Reset form values
  };

  const handleFormChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormValues({ ...formValues, [name]: value });
  };

  const handleSelectChange = (event: any) => {
    const { name, value } = event.target;
    setFormValues({ ...formValues, [name]: value });
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
      // Basic validation (can be enhanced)
      if (!formValues.name || !formValues.company || !formValues.department || !formValues.title || !formValues.contract || !formValues.status || !formValues.level) {
          showSnackbar("Vui lòng điền đầy đủ các trường bắt buộc", "error");
          setLoading(false);
          return;
      }


      const userData = {
        username: formValues.id,
        email: formValues.email,
        firstName: formValues.name?.split(" ")[0],
        lastName: formValues.name?.split(" ").slice(1).join(" "),
        phone: formValues.phone,
        company: formValues.company,
        department: formValues.department,
        title: formValues.title,
        employmentType: formValues.employmentType, // Assuming employmentType is also in formValues
        startDate: formValues.startDate,
        joinDate: formValues.joinDate, // Assuming joinDate is also in formValues
        contract: formValues.contract,
        status: formValues.status,
        level: formValues.level,
      };

      const updatedUser = await updateUser(
        userData,
        selectedEmployee.id,
        currentUserToken
      );

      // Update displayed data in the table
      setEmployeeData(employeeData.map(emp =>
          emp.id === selectedEmployee.id ? {
              ...emp,
              ...updatedUser,
              name: `${updatedUser.firstName} ${updatedUser.lastName}`,
              // Ensure other fields are updated from the form values if the API doesn't return them
              phone: formValues.phone,
              email: formValues.email,
              department: formValues.department,
              title: formValues.title,
              employmentType: formValues.employmentType,
              startDate: formValues.startDate,
              joinDate: formValues.joinDate,
              contract: formValues.contract,
              status: formValues.status,
              level: formValues.level,
          } : emp
      ));


      setSelectedEmployee({
        ...selectedEmployee,
        ...updatedUser,
        name: `${updatedUser.firstName} ${updatedUser.lastName}`,
        // Update selected employee details from form values for immediate display
        phone: formValues.phone,
        email: formValues.email,
        department: formValues.department,
        title: formValues.title,
        employmentType: formValues.employmentType,
        startDate: formValues.startDate,
        joinDate: formValues.joinDate,
        contract: formValues.contract,
        status: formValues.status,
        level: formValues.level,
      });


      showSnackbar("Cập nhật thông tin thành công", "success");
      setIsEditing(false);
      setIsModalVisible(false); // Close modal after saving
    } catch (error: any) {
      console.error("Error updating user:", error);
      showSnackbar(error.message || "Có lỗi xảy ra khi cập nhật", "error");
    } finally {
      setLoading(false);
    }
  };

  const showResetPasswordModal = (employee: EmployeeType) => {
    setSelectedEmployee(employee);
    setIsResetPasswordModalVisible(true);
    setResetPasswordValue(""); // Reset password input
  };

  const handleResetPasswordSubmit = async () => {
    if (!selectedEmployee) return;

    try {
      setLoading(true);
      // Basic validation for password
      if (!resetPasswordValue || resetPasswordValue.length < 6) {
          showSnackbar("Mật khẩu mới phải có ít nhất 6 ký tự", "error");
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

      showSnackbar("Đặt lại mật khẩu thành công", "success");
      setIsResetPasswordModalVisible(false);
    } catch (error: any) {
      console.error("Error resetting password:", error);
      showSnackbar(error.message || "Có lỗi xảy ra khi đặt lại mật khẩu", "error");
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
                label="Họ và tên"
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
              <TextField
                label="Công ty"
                name="company"
                value={formValues.company || ""}
                onChange={handleFormChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Phòng ban</InputLabel>
                <Select
                  label="Phòng ban"
                  name="department"
                  value={formValues.department || ""}
                  onChange={handleSelectChange}
                >
                  {departmentOptions.map((dept) => (
                    <MenuItem key={dept} value={dept}>
                      {dept}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Chức vụ"
                name="title"
                value={formValues.title || ""}
                onChange={handleFormChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Số điện thoại"
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
                label="Ngày vào công ty"
                value={formValues.joinDate ? dayjs(formValues.joinDate) : null}
                onChange={(date) => handleDateChange("joinDate", date)}
                format="DD/MM/YYYY"
                slotProps={{ textField: { fullWidth: true, required: true } }}
              />
            </Grid>
            <Grid item xs={12}>
              <DatePicker
                label="Ngày bắt đầu làm việc"
                value={formValues.startDate ? dayjs(formValues.startDate) : null}
                onChange={(date) => handleDateChange("startDate", date)}
                format="YYYY-MM-DD"
                slotProps={{ textField: { fullWidth: true, required: true } }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Loại hợp đồng</InputLabel>
                <Select
                  label="Loại hợp đồng"
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
                <InputLabel>Trạng thái</InputLabel>
                <Select
                  label="Trạng thái"
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
                <InputLabel>Cấp bậc</InputLabel>
                <Select
                  label="Cấp bậc"
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
          </Grid>
        </LocalizationProvider>
      );
    }

    return (
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Thông tin chi tiết
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle1" color="text.secondary">Name</Typography>
          <Typography variant="body1" fontWeight="bold">{selectedEmployee.name}</Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle1" color="text.secondary">ID</Typography>
          <Typography variant="body1">{selectedEmployee.id}</Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle1" color="text.secondary">Company</Typography>
          <Typography variant="body1">{selectedEmployee.company}</Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle1" color="text.secondary">Department</Typography>
          <Typography variant="body1">{selectedEmployee.department}</Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle1" color="text.secondary">Title</Typography>
          <Typography variant="body1">{selectedEmployee.title}</Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle1" color="text.secondary">Phone</Typography>
          <Typography variant="body1">{selectedEmployee.phone || "N/A"}</Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle1" color="text.secondary">Email</Typography>
          <Typography variant="body1">{selectedEmployee.email || "N/A"}</Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle1" color="text.secondary">Join Date</Typography>
          <Typography variant="body1">{selectedEmployee.joinDate}</Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle1" color="text.secondary">Start Date</Typography>
          <Typography variant="body1">{selectedEmployee.startDate}</Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle1" color="text.secondary">Contract</Typography>
          <Typography variant="body1">{selectedEmployee.contract}</Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle1" color="text.secondary">Status</Typography>
          <Typography variant="body1">{selectedEmployee.status}</Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle1" color="text.secondary">Level</Typography>
          <Typography variant="body1">{selectedEmployee.level}</Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle1" color="text.secondary">Auth Level</Typography>
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
              Quản lý nhân viên
            </Typography>
            <TableContainer component={Paper}>
              <Table sx={{ minWidth: 650 }} aria-label="employee table">
                <TableHead>
                  <TableRow>
                    <TableCell>No</TableCell>
                    <TableCell>ID</TableCell>
                    <TableCell>Company</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Tel</TableCell>
                    <TableCell>Title</TableCell>
                    <TableCell>Department</TableCell>
                    <TableCell>Start Date</TableCell>
                    <TableCell>Employment Type</TableCell>
                    <TableCell>Auth</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {employeeData
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((employee) => (
                      <TableRow
                        key={employee.key}
                        sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                      >
                        <TableCell component="th" scope="row">
                          {employee.no}
                        </TableCell>
                        <TableCell>
                          <Button onClick={() => showEmployeeDetails(employee)}>
                            {employee.id}
                          </Button>
                        </TableCell>
                        <TableCell>{employee.company}</TableCell>
                        <TableCell>{employee.name}</TableCell>
                        <TableCell>{employee.phone || "N/A"}</TableCell>
                        <TableCell>{employee.title}</TableCell>
                        <TableCell>{employee.department}</TableCell>
                        <TableCell>
                          {employee.startDate
                            ? dayjs(employee.startDate).format("YYYY-MM-DD")
                            : "N/A"}
                        </TableCell>
                        <TableCell>{employee.employmentType}</TableCell>
                        <TableCell>{employee.auth}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
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
              labelRowsPerPage="Số hàng mỗi trang:"
              labelDisplayedRows={({ from, to, count }) =>
                `Tổng ${count} nhân viên`
              }
            />
          </CardContent>
        </Card>

        {/* Employee Details/Edit Dialog */}
        <Dialog
          open={isModalVisible}
          onClose={() => {
            setIsModalVisible(false);
            setIsEditing(false);
            setFormValues({}); // Reset form values on close
          }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {isEditing ? "Chỉnh sửa thông tin nhân viên" : "Thông tin chi tiết"}
          </DialogTitle>
          <DialogContent dividers>{renderModalContent()}</DialogContent>
          <DialogActions>
            {isEditing ? (
              <>
                <Button onClick={handleCancelEdit}>Hủy</Button>
                <Button
                  onClick={handleSave}
                  variant="contained"
                  disabled={loading}
                >
                  {loading ? "Đang lưu..." : "Lưu thay đổi"}
                </Button>
              </>
            ) : (
              <>
                <Button onClick={() => setIsModalVisible(false)}>Đóng</Button>
                <Button onClick={handleEdit} variant="contained">
                  Chỉnh sửa
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
          <DialogTitle>Đặt lại mật khẩu</DialogTitle>
          <DialogContent dividers>
            <TextField
              label="Mật khẩu mới"
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
              Hủy
            </Button>
            <Button
              onClick={handleResetPasswordSubmit}
              variant="contained"
              disabled={loading}
            >
              {loading ? "Đang đặt lại..." : "Đặt lại"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar for messages */}
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
