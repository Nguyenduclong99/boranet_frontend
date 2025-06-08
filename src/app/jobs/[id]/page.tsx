"use client";
import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
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
  CircularProgress,
  Box,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Button,
  Paper,
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import { useAppContext } from "@/app/app-provider";
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import AddIcon from "@mui/icons-material/Add";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import PersonIcon from "@mui/icons-material/Person";
import WorkIcon from "@mui/icons-material/Work";
import DescriptionIcon from "@mui/icons-material/Description";
import CommentIcon from "@mui/icons-material/Comment";
import AttachmentIcon from "@mui/icons-material/Attachment";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PriorityHighIcon from "@mui/icons-material/PriorityHigh";
import CategoryIcon from "@mui/icons-material/Category";

interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  title: string;
}

interface Comment {
  id: number;
  body: string;
  email: string;
  name: string;
  jobId: number;
  userId: number;
  createdAt: string;
  updatedAt: string;
  attachments?: CommentAttachment[];
}

interface CommentAttachment {
  id: number;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
}

interface Job {
  id: number;
  title: string;
  description: string;
  customer: string;
  requesterBy: string;
  category: string;
  categoryId: number;
  priority: string;
  status: string;
  statusId: number;
  cd: string;
  assignees?: User[];
  region: string;
  dueDate: string;
  createdAt: string;
  completedAt: string | null;
  assigneeIds?: number[];
  comments: Comment[];
  attachments: JobAttachment[];
}

interface StatusOption {
  statusId: number;
  statusName: string;
}

interface JobAttachment {
  id: number;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
  createdBy: number;
  createdByName: string;
}

interface CategoryOption {
  id: number;
  categoryName: string;
}

const priorityColors: Record<string, string> = {
  High: "error",
  Medium: "warning",
  Low: "success",
};

const statusColors: Record<string, string> = {
  Open: "primary",
  "In Progress": "info",
  Completed: "success",
};

const JobDetailPage = () => {
  const { id } = useParams();
  const router = useRouter();
  const [commentInput, setCommentInput] = useState<string>("");
  const [commentAttachments, setCommentAttachments] = useState<File[]>([]);
  const commentFileInputRef = useRef<HTMLInputElement>(null);
  const userRolesCookie = Cookies.get("userRoles");
  let roles: string[] = [];
  if (userRolesCookie) {
    try {
      roles = JSON.parse(userRolesCookie);
    } catch (e) {
      console.error("Error parsing user roles from cookie:", e);
    }
  }
  const isAdmin = roles.includes("ROLE_ADMIN");
  const isUser = roles.includes("ROLE_USER");
  const canEdit = isAdmin || isUser;

  const [job, setJob] = useState<Job | null>(null);
  const [newAttachments, setNewAttachments] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedJob, setEditedJob] = useState<Partial<Job>>({});
  const [statusOptions, setStatusOptions] = useState<StatusOption[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [commentText, setCommentText] = useState<string>("");
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingCommentBody, setEditingCommentBody] = useState<string>("");
  const [editingCommentAttachments, setEditingCommentAttachments] = useState<
    File[]
  >([]);
  const editingCommentFileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAppContext();
  const token = Cookies.get("accessToken");

  useEffect(() => {
    const fetchJobDetails = async () => {
      if (!token) {
        setError("User not authenticated.");
        setLoading(false);
        return;
      }

      if (isTokenExpired()) {
        toast({
          title: "Session Expired",
          description: "Your session has expired. Please log in again.",
          variant: "destructive",
        });
        Cookies.remove("token");
        Cookies.remove("userRoles");
        router.push("/login");
        return;
      }

      try {
        const response = await fetch(`http://localhost:8081/api/jobs/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: Job = await response.json();
        setJob(data);
        setEditedJob({
          ...data,
          assignees: data.assignees || [],
          categoryId: data.categoryId || undefined,
          statusId: data.statusId || undefined,
        });
        setLoading(false);
      } catch (e: any) {
        setError(e.message);
        setLoading(false);
      }
    };

    const fetchStatusOptions = async () => {
      if (!token) return;
      try {
        const response = await fetch(`http://localhost:8081/api/job-statuses`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: StatusOption[] = await response.json();
        setStatusOptions(data);
      } catch (e) {
        console.error("Error fetching status options:", e);
      }
    };

    const fetchCategoryOptions = async () => {
      if (!token) return;
      try {
        const response = await fetch(`http://localhost:8081/api/categories`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: CategoryOption[] = await response.json();
        setCategoryOptions(data);
      } catch (e) {
        console.error("Error fetching category options:", e);
      }
    };

    const fetchUsers = async () => {
      if (!token) return;
      try {
        const response = await fetch(`http://localhost:8081/api/users`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: User[] = await response.json();
        setUsers(data);
      } catch (e) {
        console.error("Error fetching users:", e);
      }
    };

    if (id) {
      fetchJobDetails();
      fetchStatusOptions();
      fetchCategoryOptions();
      fetchUsers();
    }
  }, [id, token, router]);

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    if (!isEditing && job) {
      setEditedJob({
        ...job,
        assignees: job.assignees || [],
      });
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | { name?: string; value: unknown }
    >
  ) => {
    const { name, value } = e.target;
    setEditedJob((prev) => ({ ...prev, [name as string]: value }));
  };

  const handleCategoryChange = (
    e: React.ChangeEvent<{ name?: string; value: unknown }>
  ) => {
    const selectedCategoryId = Number(e.target.value);
    const selectedCategory = categoryOptions.find(
      (category) => category.id === selectedCategoryId
    );
    setEditedJob((prev) => ({
      ...prev,
      category: selectedCategory?.categoryName || "",
      categoryId: selectedCategoryId,
    }));
  };

  const handleAutocompleteChange =
    (name: string) =>
    (_event: React.SyntheticEvent, value: User[] | User | null) => {
      if (name === "assignees") {
        setEditedJob((prev) => ({ ...prev, assignees: value as User[] }));
      } else if (name === "cd") {
        setEditedJob((prev) => ({ ...prev, cd: (value as User)?.name || "" }));
      }
    };

  const handleStatusChange = (
    e: React.ChangeEvent<{ name?: string; value: unknown }>
  ) => {
    const selectedStatusId = e.target.value as number;
    const selectedStatus = statusOptions.find(
      (status) => status.statusId === selectedStatusId
    );
    setEditedJob((prev) => ({
      ...prev,
      status: selectedStatus?.statusName || "",
      statusId: selectedStatusId,
    }));
  };

  const handleDateChange =
    (name: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setEditedJob((prev) => ({ ...prev, [name]: e.target.value }));
    };

  const handleSave = async () => {
    debugger
    if (!token || !job?.id) return;

    if (isTokenExpired()) {
      toast({
        title: "Session Expired",
        description: "Your session has expired. Please log in again.",
        variant: "destructive",
      });
      Cookies.remove("token");
      Cookies.remove("userRoles");
      router.push("/login");
      return;
    }

    try {
      const formData = new FormData();
      const assignees = editedJob.assignees || [];
      const assigneeIds = assignees.map((assignee) => assignee.id);

      const jobRequestPayload = {
        title: editedJob.title,
        description: editedJob.description,
        dueDate: editedJob.dueDate,
        status: editedJob.statusId,
        assigneeIds: assigneeIds,
        customer: editedJob.customer,
        category: editedJob.categoryId,
        priority: editedJob.priority,
        cdId: users.find((user) => user.name === editedJob.cd)?.id || null,
        completedAt: editedJob.completedAt,
        region: editedJob.region,
      };

      const jobRequestJsonString = JSON.stringify(jobRequestPayload);
      const jobRequestBlob = new Blob([jobRequestJsonString], {
        type: "application/json",
      });
      formData.append("jobRequest", jobRequestBlob, "jobRequest.json");
      newAttachments.forEach((file) => {
        formData.append("attachments", file);
      });

      const response = await fetch(`http://localhost:8081/api/jobs/${job.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const updatedJobData: Job = await response.json();
      setJob(updatedJobData);
      setIsEditing(false);
      setNewAttachments([]);
      toast({
        title: "Success",
        description: "Job updated successfully.",
      });
    } catch (e: any) {
      toast({
        title: "Error",
        description: `Failed to update job: ${e.message}`,
        variant: "destructive",
      });
      console.error("Error updating job:", e);
    }
  };
  const handleDeleteCommentAttachment = async (
    commentId: number,
    attachmentId: number
  ) => {
    if (!token || !job?.id) return;

    if (isTokenExpired()) {
      toast({
        title: "Session Expired",
        description: "Your session has expired. Please log in again.",
        variant: "destructive",
      });
      Cookies.remove("token");
      Cookies.remove("userRoles");
      router.push("/login");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this attachment?")) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8081/api/jobs/${job.id}/comments/${commentId}/attachments/${attachmentId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setJob((prevJob) => {
        if (prevJob) {
          return {
            ...prevJob,
            comments: prevJob.comments.map((comment) => {
              if (comment.id === commentId) {
                return {
                  ...comment,
                  attachments:
                    comment.attachments?.filter(
                      (att) => att.id !== attachmentId
                    ) || [],
                };
              }
              return comment;
            }),
          };
        }
        return prevJob;
      });
      toast({
        title: "Success",
        description: "Attachment deleted successfully.",
      });
    } catch (e: any) {
      toast({
        title: "Error",
        description: `Failed to delete attachment: ${e.message}`,
        variant: "destructive",
      });
      console.error("Error deleting attachment:", e);
    }
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setNewAttachments(Array.from(e.target.files));
    }
  };

  const handleDeleteAttachment = async (attachmentId: number) => {
    if (!token || !job?.id) return;

    if (isTokenExpired()) {
      toast({
        title: "Session Expired",
        description: "Your session has expired. Please log in again.",
        variant: "destructive",
      });
      Cookies.remove("token");
      Cookies.remove("userRoles");
      router.push("/login");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this attachment?")) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8081/api/jobs/${job.id}/attachments/${attachmentId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setJob((prevJob) => {
        if (prevJob) {
          return {
            ...prevJob,
            attachments: prevJob.attachments.filter(
              (att) => att.id !== attachmentId
            ),
          };
        }
        return prevJob;
      });
      toast({
        title: "Success",
        description: "Attachment deleted successfully.",
      });
    } catch (e: any) {
      toast({
        title: "Error",
        description: `Failed to delete attachment: ${e.message}`,
        variant: "destructive",
      });
      console.error("Error deleting attachment:", e);
    }
  };

  const handleDeleteJob = async () => {
    if (!token || !job?.id) return;

    if (isTokenExpired()) {
      toast({
        title: "Session Expired",
        description: "Your session has expired. Please log in again.",
        variant: "destructive",
      });
      Cookies.remove("token");
      Cookies.remove("userRoles");
      router.push("/login");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this job?")) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:8081/api/jobs/${job.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      toast({
        title: "Success",
        description: "Job deleted successfully.",
      });
      router.push("/jobs/order-list");
    } catch (e: any) {
      toast({
        title: "Error",
        description: `Failed to delete job: ${e.message}`,
        variant: "destructive",
      });
      console.error("Error deleting job:", e);
    }
  };

  const handleCommentFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (event.target.files) {
      setCommentAttachments(Array.from(event.target.files));
    }
  };

  const handleAddComment = async () => {
    if (!token || !job?.id || !commentText.trim()) return;

    if (isTokenExpired()) {
      toast({
        title: "Session Expired",
        description: "Your session has expired. Please log in again.",
        variant: "destructive",
      });
      Cookies.remove("token");
      Cookies.remove("userRoles");
      router.push("/login");
      return;
    }

    const userEmail = user?.username;
    const userName = user?.email;

    try {
      const formData = new FormData();
      const commentRequestPayload = {
        body: commentText,
        name: userEmail || "",
        email: userEmail || "",
      };
      const commentRequestBlob = new Blob(
        [JSON.stringify(commentRequestPayload)],
        { type: "application/json" }
      );
      formData.append("commentRequest", commentRequestBlob);
      commentAttachments.forEach((file) => {
        formData.append("attachments", file);
      });
      const response = await fetch(
        `http://localhost:8081/api/jobs/${job.id}/comments`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const newComment: Comment = await response.json();
      setJob((prevJob) => {
        if (prevJob) {
          return {
            ...prevJob,
            comments: prevJob.comments
              ? [...prevJob.comments, newComment]
              : [newComment],
          };
        }
        return prevJob;
      });
      setCommentText("");
      setCommentAttachments([]);
      if (commentFileInputRef.current) {
        commentFileInputRef.current.value = "";
      }
      toast({
        title: "Success",
        description: "Comment added successfully.",
      });
    } catch (e: any) {
      toast({
        title: "Error",
        description: `Failed to add comment: ${e.message}`,
        variant: "destructive",
      });
      console.error("Error adding comment:", e);
    }
  };

  const handleEditComment = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditingCommentBody(comment.body);
    setEditingCommentAttachments([]);
  };

  const handleEditingCommentFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (event.target.files) {
      setEditingCommentAttachments(Array.from(event.target.files));
    }
  };

  const handleSaveComment = async (commentId: number) => {
    if (!token || !job?.id || !editingCommentBody.trim()) return;

    if (isTokenExpired()) {
      toast({
        title: "Session Expired",
        description: "Your session has expired. Please log in again.",
        variant: "destructive",
      });
      Cookies.remove("token");
      Cookies.remove("userRoles");
      router.push("/login");
      return;
    }
    const userName = user?.username;
    const email = user?.email;
    try {
      const formData = new FormData();
      const commentRequestPayload = {
        body: editingCommentBody,
        email: email,
        name: userName,
      };
      const commentRequestBlob = new Blob(
        [JSON.stringify(commentRequestPayload)],
        { type: "application/json" }
      );
      formData.append("commentRequest", commentRequestBlob);

      editingCommentAttachments.forEach((file) => {
        formData.append("attachments", file);
      });

      const response = await fetch(
        `http://localhost:8081/api/jobs/${job.id}/comments/${commentId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const updatedComment: Comment = await response.json();
      setJob((prevJob) => {
        if (prevJob) {
          return {
            ...prevJob,
            comments: prevJob.comments.map((c) =>
              c.id === updatedComment.id ? updatedComment : c
            ),
          };
        }
        return prevJob;
      });
      setEditingCommentId(null);
      setEditingCommentBody("");
      setEditingCommentAttachments([]);
      if (editingCommentFileInputRef.current) {
        editingCommentFileInputRef.current.value = "";
      }
      toast({
        title: "Success",
        description: "Comment updated successfully.",
      });
    } catch (e: any) {
      toast({
        title: "Error",
        description: `Failed to update comment: ${e.message}`,
        variant: "destructive",
      });
      console.error("Error updating comment:", e);
    }
  };

  const handleCancelEditComment = () => {
    setEditingCommentId(null);
    setEditingCommentBody("");
    setEditingCommentAttachments([]);
    if (editingCommentFileInputRef.current) {
      editingCommentFileInputRef.current.value = "";
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!token || !job?.id) return;

    if (isTokenExpired()) {
      toast({
        title: "Session Expired",
        description: "Your session has expired. Please log in again.",
        variant: "destructive",
      });
      Cookies.remove("token");
      Cookies.remove("userRoles");
      router.push("/login");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this comment?")) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8081/api/jobs/${job.id}/comments/${commentId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setJob((prevJob) => {
        if (prevJob) {
          return {
            ...prevJob,
            comments: prevJob.comments.filter((c) => c.id !== commentId),
          };
        }
        return prevJob;
      });
      toast({
        title: "Success",
        description: "Comment deleted successfully.",
      });
    } catch (e: any) {
      toast({
        title: "Error",
        description: `Failed to delete comment: ${e.message}`,
        variant: "destructive",
      });
      console.error("Error deleting comment:", e);
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="80vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Typography color="error">Error: {error}</Typography>;
  }

  if (!job) {
    return <Typography>No job found.</Typography>;
  }

  return (
    <div className="container mx-auto p-4">
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={4}
      >
        <Typography variant="h4" component="h1" fontWeight="bold">
          Job Details
        </Typography>
        {canEdit && (
          <Box display="flex" gap={2}>
            <Button
              onClick={handleEditToggle}
              variant={isEditing ? "outlined" : "contained"}
              color="primary"
              startIcon={isEditing ? <CancelIcon /> : <EditIcon />}
            >
              {isEditing ? "Cancel" : "Edit Job"}
            </Button>
            {isEditing ? (
              <Button
                onClick={handleSave}
                variant="contained"
                color="success"
                startIcon={<SaveIcon />}
              >
                Save Changes
              </Button>
            ) : (
              isAdmin && (
                <Button
                  onClick={handleDeleteJob}
                  variant="contained"
                  color="error"
                  startIcon={<DeleteIcon />}
                >
                  Delete Job
                </Button>
              )
            )}
          </Box>
        )}
      </Box>

      {/* Job Details Section */}
      <Grid container spacing={3}>
        {/* Left Column - Basic Info */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardHeader
              title="Basic Information"
              avatar={
                <Avatar sx={{ bgcolor: "primary.main" }}>
                  <WorkIcon />
                </Avatar>
              }
            />
            <CardContent sx={{ flexGrow: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box mb={2}>
                    <Typography
                      variant="subtitle2"
                      color="textSecondary"
                      gutterBottom
                    >
                      Title
                    </Typography>
                    {isEditing ? (
                      <TextField
                        name="title"
                        value={editedJob.title || ""}
                        onChange={handleChange}
                        fullWidth
                        variant="outlined"
                        size="small"
                      />
                    ) : (
                      <Typography variant="body1">{job.title}</Typography>
                    )}
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box mb={2}>
                    <Typography
                      variant="subtitle2"
                      color="textSecondary"
                      gutterBottom
                    >
                      Status
                    </Typography>
                    {isEditing ? (
                      <FormControl fullWidth variant="outlined" size="small">
                        <InputLabel>Status</InputLabel>
                        <Select
                          name="status"
                          value={editedJob.statusId || ""}
                          onChange={handleStatusChange}
                          label="Status"
                        >
                          {statusOptions.map((status) => (
                            <MenuItem
                              key={status.statusId}
                              value={status.statusId}
                            >
                              {status.statusName}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    ) : (
                      <Chip
                        label={job.status || "N/A"}
                        color={
                          job.status === "Open"
                            ? "primary"
                            : job.status === "In Progress"
                            ? "info"
                            : job.status === "Completed"
                            ? "success"
                            : "default"
                        }
                      />
                    )}
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box mb={2}>
                    <Typography
                      variant="subtitle2"
                      color="textSecondary"
                      gutterBottom
                    >
                      Category
                    </Typography>
                    {isEditing ? (
                      <FormControl fullWidth variant="outlined" size="small">
                        <InputLabel>Category</InputLabel>
                        <Select
                          name="category"
                          value={editedJob.categoryId || ""}
                          onChange={handleCategoryChange}
                          label="Category"
                        >
                          {categoryOptions.map((category) => (
                            <MenuItem key={category.id} value={category.id}>
                              {category.categoryName}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    ) : (
                      <Typography variant="body1">
                        {job.category || "N/A"}
                      </Typography>
                    )}
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box mb={2}>
                    <Typography
                      variant="subtitle2"
                      color="textSecondary"
                      gutterBottom
                    >
                      Priority
                    </Typography>
                    {isEditing ? (
                      <TextField
                        name="priority"
                        value={editedJob.priority || ""}
                        onChange={handleChange}
                        fullWidth
                        variant="outlined"
                        size="small"
                      />
                    ) : (
                      <Chip
                        label={job.priority || "N/A"}
                        color={
                          job.priority === "High"
                            ? "error"
                            : job.priority === "Medium"
                            ? "warning"
                            : job.priority === "Low"
                            ? "success"
                            : "default"
                        }
                      />
                    )}
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Box mb={2}>
                    <Typography
                      variant="subtitle2"
                      color="textSecondary"
                      gutterBottom
                    >
                      Description
                    </Typography>
                    {isEditing ? (
                      <TextField
                        name="description"
                        value={editedJob.description || ""}
                        onChange={handleChange}
                        multiline
                        rows={4}
                        fullWidth
                        variant="outlined"
                      />
                    ) : (
                      <Typography variant="body1" paragraph>
                        {job.description}
                      </Typography>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* People Section */}
          <Card variant="outlined" sx={{ mt: 3 }}>
            <CardHeader
              title="People"
              avatar={
                <Avatar sx={{ bgcolor: "secondary.main" }}>
                  <PersonIcon />
                </Avatar>
              }
            />
            <CardContent sx={{ flexGrow: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box mb={2}>
                    <Typography
                      variant="subtitle2"
                      color="textSecondary"
                      gutterBottom
                    >
                      Requester
                    </Typography>
                    {isEditing ? (
                      <TextField
                        name="requesterBy"
                        value={editedJob.requesterBy || ""}
                        onChange={handleChange}
                        fullWidth
                        variant="outlined"
                        size="small"
                      />
                    ) : (
                      <Typography variant="body1">{job.requesterBy}</Typography>
                    )}
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box mb={2}>
                    <Typography
                      variant="subtitle2"
                      color="textSecondary"
                      gutterBottom
                    >
                      Customer
                    </Typography>
                    {isEditing ? (
                      <TextField
                        name="customer"
                        value={editedJob.customer || ""}
                        onChange={handleChange}
                        fullWidth
                        variant="outlined"
                        size="small"
                      />
                    ) : (
                      <Typography variant="body1">{job.customer}</Typography>
                    )}
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box mb={2}>
                    <Typography
                      variant="subtitle2"
                      color="textSecondary"
                      gutterBottom
                    >
                      CD
                    </Typography>
                    {isEditing ? (
                      <Autocomplete
                        options={users}
                        getOptionLabel={(option) => option.name}
                        value={
                          users.find((user) => user.name === editedJob.cd) ||
                          null
                        }
                        onChange={handleAutocompleteChange("cd")}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            variant="outlined"
                            size="small"
                            fullWidth
                          />
                        )}
                      />
                    ) : (
                      <Typography variant="body1">{job.cd || "N/A"}</Typography>
                    )}
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box mb={2}>
                    <Typography
                      variant="subtitle2"
                      color="textSecondary"
                      gutterBottom
                    >
                      Assignees
                    </Typography>
                    {isEditing ? (
                      <Autocomplete
                        multiple
                        options={users}
                        getOptionLabel={(option) => option.name}
                        value={editedJob.assignees || []}
                        onChange={handleAutocompleteChange("assignees")}
                        filterSelectedOptions
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            variant="outlined"
                            size="small"
                            fullWidth
                          />
                        )}
                      />
                    ) : (
                      <Box display="flex" flexWrap="wrap" gap={1}>
                        {job.assignees && job.assignees.length > 0 ? (
                          job.assignees.map((assignee) => (
                            <Chip
                              key={assignee.id}
                              label={assignee.name}
                              size="small"
                              avatar={
                                <Avatar>{assignee.name.charAt(0)}</Avatar>
                              }
                            />
                          ))
                        ) : (
                          <Typography variant="body1">N/A</Typography>
                        )}
                      </Box>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column - Dates & Attachments */}
        <Grid item xs={12} md={6}>
          {/* Dates Section */}
          <Card variant="outlined">
            <CardHeader
              title="Dates"
              avatar={
                <Avatar sx={{ bgcolor: "info.main" }}>
                  <CalendarTodayIcon />
                </Avatar>
              }
            />
            <CardContent sx={{ flexGrow: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box mb={2}>
                    <Typography
                      variant="subtitle2"
                      color="textSecondary"
                      gutterBottom
                    >
                      Due Date
                    </Typography>
                    {isEditing ? (
                      <TextField
                        name="dueDate"
                        type="datetime-local"
                        value={
                          editedJob.dueDate
                            ? format(
                                new Date(editedJob.dueDate),
                                "yyyy-MM-dd'T'HH:mm"
                              )
                            : ""
                        }
                        onChange={handleDateChange("dueDate")}
                        fullWidth
                        variant="outlined"
                        size="small"
                        InputLabelProps={{ shrink: true }}
                      />
                    ) : (
                      <Typography variant="body1">
                        {job.dueDate
                          ? format(new Date(job.dueDate), "MMM d, yyyy HH:mm")
                          : "N/A"}
                      </Typography>
                    )}
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box mb={2}>
                    <Typography
                      variant="subtitle2"
                      color="textSecondary"
                      gutterBottom
                    >
                      Registered Date
                    </Typography>
                    <Typography variant="body1">
                      {job.createdAt
                        ? format(new Date(job.createdAt), "MMM d, yyyy HH:mm")
                        : "N/A"}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box mb={2}>
                    <Typography
                      variant="subtitle2"
                      color="textSecondary"
                      gutterBottom
                    >
                      Completed At
                    </Typography>
                    {isEditing ? (
                      <TextField
                        name="completedAt"
                        type="datetime-local"
                        value={
                          editedJob.completedAt
                            ? format(
                                new Date(editedJob.completedAt),
                                "yyyy-MM-dd'T'HH:mm"
                              )
                            : ""
                        }
                        onChange={handleDateChange("completedAt")}
                        fullWidth
                        variant="outlined"
                        size="small"
                        InputLabelProps={{ shrink: true }}
                      />
                    ) : (
                      <Typography variant="body1">
                        {job.completedAt
                          ? format(
                              new Date(job.completedAt),
                              "MMM d, yyyy HH:mm"
                            )
                          : "N/A"}
                      </Typography>
                    )}
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box mb={2}>
                    <Typography
                      variant="subtitle2"
                      color="textSecondary"
                      gutterBottom
                    >
                      Region
                    </Typography>
                    {isEditing ? (
                      <TextField
                        name="region"
                        value={editedJob.region || ""}
                        onChange={handleChange}
                        fullWidth
                        variant="outlined"
                        size="small"
                      />
                    ) : (
                      <Typography variant="body1">
                        {job.region || "N/A"}
                      </Typography>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Attachments Section */}
          <Card variant="outlined" sx={{ mt: 3 }}>
            <CardHeader
              title={`Attachments (${job.attachments?.length || 0})`}
              avatar={
                <Avatar sx={{ bgcolor: "warning.main" }}>
                  <FileDownloadIcon />
                </Avatar>
              }
            />
            <CardContent sx={{ flexGrow: 1 }}>
              {isEditing && (
                <Box mb={3}>
                  <input
                    type="file"
                    id="attachments-upload"
                    multiple
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                  />
                  <label htmlFor="attachments-upload">
                    <Button component="span" variant="outlined" fullWidth>
                      Upload Files
                    </Button>
                  </label>
                  {newAttachments.length > 0 && (
                    <Box mt={2}>
                      <Typography
                        variant="body2"
                        color="textSecondary"
                        gutterBottom
                      >
                        Selected files:
                      </Typography>
                      <Box component="ul" sx={{ pl: 2 }}>
                        {newAttachments.map((file, index) => (
                          <Box
                            component="li"
                            key={index}
                            display="flex"
                            justifyContent="space-between"
                          >
                            <Typography variant="body2">
                              {file.name} (
                              {(file.size / 1024 / 1024).toFixed(2)} MB)
                            </Typography>
                            <IconButton
                              onClick={() => {
                                const newFiles = [...newAttachments];
                                newFiles.splice(index, 1);
                                setNewAttachments(newFiles);
                              }}
                              size="small"
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}
                </Box>
              )}

              {job.attachments && job.attachments.length > 0 ? (
                <Box component="ul" sx={{ pl: 0 }}>
                  {job.attachments.map((attachment) => (
                    <Paper
                      key={attachment.id}
                      component="li"
                      variant="outlined"
                      sx={{
                        p: 2,
                        mb: 1,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Box>
                        <Typography variant="body2">
                          <a
                            href={`http://localhost:8081/api/files/${attachment.filePath}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ textDecoration: "none", color: "inherit" }}
                          >
                            {attachment.fileName}
                          </a>
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {(attachment.fileSize / 1024 / 1024).toFixed(2)} MB
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center">
                        <IconButton
                          href={`http://localhost:8081/api/files/${attachment.filePath}`}
                          target="_blank"
                          size="small"
                          sx={{ mr: 1 }}
                        >
                          <FileDownloadIcon fontSize="small" />
                        </IconButton>
                        {isEditing && (
                          <IconButton
                            onClick={() =>
                              handleDeleteAttachment(attachment.id)
                            }
                            size="small"
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                    </Paper>
                  ))}
                </Box>
              ) : (
                <Typography
                  variant="body2"
                  color="textSecondary"
                  textAlign="center"
                  py={2}
                >
                  No attachments yet
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Comments Section */}
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mt-6">
        {/* Comments Section */}
        <Card variant="outlined" sx={{ mt: 3 }}>
          <CardHeader
            title={`Threads (${job.comments?.length || 0})`}
            avatar={
              <Avatar sx={{ bgcolor: "success.main" }}>
                <CommentIcon />
              </Avatar>
            }
          />
          <CardContent>
            {/* Comment Input */}
            <Box mb={3}>
              <TextField
                fullWidth
                multiline
                rows={3}
                variant="outlined"
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
              <Box
                mt={1}
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Box>
                  <input
                    type="file"
                    id="comment-attachments-upload"
                    multiple
                    onChange={handleCommentFileChange}
                    ref={commentFileInputRef}
                    style={{ display: "none" }}
                  />
                  <label htmlFor="comment-attachments-upload">
                    <Button
                      component="span"
                      variant="outlined"
                      startIcon={<AttachmentIcon />}
                      size="small"
                    >
                      Attach Files
                    </Button>
                  </label>
                  {commentAttachments.length > 0 && (
                    <Box component="span" ml={2}>
                      <Typography variant="caption">
                        {commentAttachments.length} file(s) selected
                      </Typography>
                    </Box>
                  )}
                </Box>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleAddComment}
                  disabled={!commentText.trim()}
                  startIcon={<AddIcon />}
                >
                  Add Comment
                </Button>
              </Box>
            </Box>

            {/* Comments List */}
            {job.comments && job.comments.length > 0 ? (
              <List>
                {job.comments.map((comment) => (
                  <React.Fragment key={comment.id}>
                    <ListItem alignItems="flex-start">
                      <ListItemAvatar>
                        <Avatar>
                          <PersonIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box display="flex" justifyContent="space-between">
                            <Typography fontWeight="bold">
                              {comment.name || "Anonymous"}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {format(
                                new Date(comment.createdAt),
                                "MMM d, yyyy HH:mm"
                              )}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box>
                            {editingCommentId === comment.id ? (
                              <Box>
                                <TextField
                                  fullWidth
                                  multiline
                                  value={editingCommentBody}
                                  onChange={(e) =>
                                    setEditingCommentBody(e.target.value)
                                  }
                                  variant="outlined"
                                  sx={{ mb: 1 }}
                                />
                                <Box
                                  display="flex"
                                  justifyContent="space-between"
                                >
                                  <Box>
                                    <input
                                      type="file"
                                      id="edit-comment-attachments"
                                      multiple
                                      onChange={handleEditingCommentFileChange}
                                      ref={editingCommentFileInputRef}
                                      style={{ display: "none" }}
                                    />
                                    <label htmlFor="edit-comment-attachments">
                                      <Button
                                        component="span"
                                        variant="outlined"
                                        size="small"
                                        startIcon={<AttachmentIcon />}
                                      >
                                        Add Files
                                      </Button>
                                    </label>
                                  </Box>
                                  <Box>
                                    <Button
                                      variant="outlined"
                                      onClick={handleCancelEditComment}
                                      sx={{ mr: 1 }}
                                      startIcon={<CancelIcon />}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      variant="contained"
                                      onClick={() =>
                                        handleSaveComment(comment.id)
                                      }
                                      disabled={!editingCommentBody.trim()}
                                      startIcon={<SaveIcon />}
                                    >
                                      Save
                                    </Button>
                                  </Box>
                                </Box>
                              </Box>
                            ) : (
                              <Typography>{comment.body}</Typography>
                            )}
                            {comment.attachments &&
                              comment.attachments.length > 0 && (
                                <Box mt={1}>
                                  {comment.attachments.map((attachment) => (
                                    <Paper
                                      key={attachment.id}
                                      variant="outlined"
                                      sx={{
                                        p: 1,
                                        mb: 1,
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                      }}
                                    >
                                      <Box>
                                        <Typography variant="body2">
                                          <a
                                            href={`http://localhost:8081/api/files/${attachment.filePath}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                              textDecoration: "none",
                                              color: "inherit",
                                            }}
                                          >
                                            {attachment.fileName}
                                          </a>
                                        </Typography>
                                        <Typography
                                          variant="caption"
                                          color="textSecondary"
                                        >
                                          {(
                                            attachment.fileSize /
                                            1024 /
                                            1024
                                          ).toFixed(2)}{" "}
                                          MB
                                        </Typography>
                                      </Box>
                                      <Box display="flex" alignItems="center">
                                        <IconButton
                                          href={`http://localhost:8081/api/files/${attachment.filePath}`}
                                          target="_blank"
                                          size="small"
                                          sx={{ mr: 1 }}
                                        >
                                          <FileDownloadIcon fontSize="small" />
                                        </IconButton>
                                        {canEdit && (
                                          <IconButton
                                            onClick={() =>
                                              handleDeleteCommentAttachment(
                                                comment.id,
                                                attachment.id
                                              )
                                            }
                                            size="small"
                                            color="error"
                                          >
                                            <DeleteIcon fontSize="small" />
                                          </IconButton>
                                        )}
                                      </Box>
                                    </Paper>
                                  ))}
                                </Box>
                              )}
                          </Box>
                        }
                      />
                      {canEdit && editingCommentId !== comment.id && (
                        <Box ml={2}>
                          <IconButton
                            onClick={() => handleEditComment(comment)}
                            size="small"
                            sx={{ mr: 1 }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            onClick={() => handleDeleteComment(comment.id)}
                            size="small"
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      )}
                    </ListItem>
                    <Divider variant="inset" component="li" />
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Typography
                variant="body2"
                color="textSecondary"
                textAlign="center"
                py={2}
              >
                No comments yet
              </Typography>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default JobDetailPage;
