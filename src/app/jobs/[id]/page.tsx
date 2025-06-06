"use client";
import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
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
  CircularProgress,
  Box,
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import { useAppContext } from "@/app/app-provider";
import IconButton from "@mui/material/IconButton"; // Import IconButton
import EditIcon from "@mui/icons-material/Edit"; // Import Edit icon
import DeleteIcon from "@mui/icons-material/Delete"; // Import Delete icon
import FileDownloadIcon from "@mui/icons-material/FileDownload"; // Import Download icon

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
  priority: string;
  status: string;
  statusId: number;
  cd: string;
  assignees?: User[];
  region: string;
  dueDate: string;
  createdAt: string;
  completedAt: string | null;
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
        setEditedJob(data);
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
      fetchUsers();
    }
  }, [id, token, router]);

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    if (!isEditing && job) {
      setEditedJob(job);
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

  const handleAutocompleteChange =
    (name: string) =>
    (event: React.SyntheticEvent, value: User[] | User | null) => {
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
      const assigneeIds =
        editedJob.assignees?.map((assignee) => assignee.id) || [];
      const jobRequestPayload = {
        title: editedJob.title,
        description: editedJob.description,
        dueDate: editedJob.dueDate,
        status: editedJob.statusId,
        assigneeIds: assigneeIds,
        customer: editedJob.customer,
        category: editedJob.category,
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
const handleDeleteCommentAttachment = async (commentId: number, attachmentId: number) => {
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
          comments: prevJob.comments.map(comment => {
            if (comment.id === commentId) {
              return {
                ...comment,
                attachments: comment.attachments?.filter(att => att.id !== attachmentId) || []
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
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        className="text-center mb-6"
      >
        Job Detail
      </Typography>

      {/* Job Details Card */}
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-6">
        <Typography
          variant="h5"
          component="h2"
          gutterBottom
          className="mb-4 text-center"
        >
          Job Information
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <div className="font-bold text-lg mb-2">Requester</div>
            {isEditing ? (
              <TextField
                name="requesterBy"
                value={editedJob.requesterBy || ""}
                onChange={handleChange}
                fullWidth
                variant="outlined"
              />
            ) : (
              <Typography className="text-gray-700 dark:text-gray-300">
                {job.requesterBy}
              </Typography>
            )}
          </Grid>
          <Grid item xs={12} md={6}>
            <div className="font-bold text-lg mb-2">Customer</div>
            {isEditing ? (
              <TextField
                name="customer"
                value={editedJob.customer || ""}
                onChange={handleChange}
                fullWidth
                variant="outlined"
              />
            ) : (
              <Typography className="text-gray-700 dark:text-gray-300">
                {job.customer}
              </Typography>
            )}
          </Grid>
          <Grid item xs={12} md={6}>
            <div className="font-bold text-lg mb-2">Category</div>
            {isEditing ? (
              <TextField
                name="category"
                value={editedJob.category || ""}
                onChange={handleChange}
                fullWidth
                variant="outlined"
              />
            ) : (
              <Typography className="text-gray-700 dark:text-gray-300">
                {job.category || "N/A"}
              </Typography>
            )}
          </Grid>
          <Grid item xs={12} md={6}>
            <div className="font-bold text-lg mb-2">Priority</div>
            {isEditing ? (
              <TextField
                name="priority"
                value={editedJob.priority || ""}
                onChange={handleChange}
                fullWidth
                variant="outlined"
              />
            ) : (
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold 
                ${
                  job.priority === "High"
                    ? "bg-red-100 text-red-800"
                    : job.priority === "Medium"
                    ? "bg-yellow-100 text-yellow-800"
                    : job.priority === "Low"
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }
              `}
              >
                {job.priority || "N/A"}
              </span>
            )}
          </Grid>
          <Grid item xs={12} md={6}>
            <div className="font-bold text-lg mb-2">CD</div>
            {isEditing ? (
              <Autocomplete
                options={users}
                getOptionLabel={(option) => option.name}
                value={users.find((user) => user.name === editedJob.cd) || null}
                onChange={handleAutocompleteChange("cd")}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="CD"
                    variant="outlined"
                    fullWidth
                  />
                )}
              />
            ) : (
              <Typography className="text-gray-700 dark:text-gray-300">
                {job.cd || "N/A"}
              </Typography>
            )}
          </Grid>
          <Grid item xs={12} md={6}>
            <div className="font-bold text-lg mb-2">Assignees</div>
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
                    label="Assignees"
                    variant="outlined"
                    fullWidth
                  />
                )}
              />
            ) : (
              <Typography className="text-gray-700 dark:text-gray-300">
                {job.assignees && job.assignees.length > 0
                  ? job.assignees.map((assignee) => assignee.name).join(", ")
                  : "N/A"}
              </Typography>
            )}
          </Grid>
          <Grid item xs={12} md={6}>
            <div className="font-bold text-lg mb-2">Status</div>
            {isEditing ? (
              <FormControl fullWidth variant="outlined">
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={editedJob.statusId || ""}
                  onChange={handleStatusChange}
                  label="Status"
                >
                  {statusOptions.map((status) => (
                    <MenuItem key={status.statusId} value={status.statusId}>
                      {status.statusName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : (
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold 
                ${
                  job.status === "Open"
                    ? "bg-blue-100 text-blue-800"
                    : job.status === "In Progress"
                    ? "bg-yellow-100 text-yellow-800"
                    : job.status === "Completed"
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }
              `}
              >
                {job.status || "N/A"}
              </span>
            )}
          </Grid>
          <Grid item xs={12} md={6}>
            <div className="font-bold text-lg mb-2">Title</div>
            {isEditing ? (
              <TextField
                name="title"
                value={editedJob.title || ""}
                onChange={handleChange}
                fullWidth
                variant="outlined"
              />
            ) : (
              <Typography className="text-gray-700 dark:text-gray-300">
                {job.title}
              </Typography>
            )}
          </Grid>
          <Grid item xs={12} md={6}>
            <div className="font-bold text-lg mb-2">Due Date</div>
            {isEditing ? (
              <TextField
                name="dueDate"
                type="datetime-local"
                value={
                  editedJob.dueDate
                    ? format(new Date(editedJob.dueDate), "yyyy-MM-dd'T'HH:mm")
                    : ""
                }
                onChange={handleDateChange("dueDate")}
                fullWidth
                variant="outlined"
                InputLabelProps={{ shrink: true }}
              />
            ) : (
              <Typography className="text-gray-700 dark:text-gray-300">
                {job.dueDate
                  ? format(new Date(job.dueDate), "MMM d, yyyy HH:mm")
                  : "N/A"}
              </Typography>
            )}
          </Grid>
          <Grid item xs={12} md={6}>
            <div className="font-bold text-lg mb-2">Registered Date</div>
            <Typography className="text-gray-700 dark:text-gray-300">
              {job.createdAt
                ? format(new Date(job.createdAt), "MMM d, yyyy HH:mm")
                : "N/A"}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <div className="font-bold text-lg mb-2">Completed At</div>
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
                InputLabelProps={{ shrink: true }}
              />
            ) : (
              <Typography className="text-gray-700 dark:text-gray-300">
                {job.completedAt
                  ? format(new Date(job.completedAt), "MMM d, yyyy HH:mm")
                  : "N/A"}
              </Typography>
            )}
          </Grid>
          <Grid item xs={12} md={6}>
            <div className="font-bold text-lg mb-2">Region</div>
            {isEditing ? (
              <TextField
                name="region"
                value={editedJob.region || ""}
                onChange={handleChange}
                fullWidth
                variant="outlined"
              />
            ) : (
              <Typography className="text-gray-700 dark:text-gray-300">
                {job.region || "N/A"}
              </Typography>
            )}
          </Grid>
          <Grid item xs={12}>
            <div className="font-bold text-lg mb-2">Description</div>
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
              <Typography className="text-gray-800 dark:text-gray-200">
                {job.description}
              </Typography>
            )}
          </Grid>
        </Grid>
        <div className="mt-6 flex space-x-2 justify-end">
          {canEdit && (
            <>
              <Button onClick={handleEditToggle} variant="outline">
                {isEditing ? "Cancel" : "Edit Job"}
              </Button>
              {isEditing && (
                <Button
                  onClick={handleSave}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  Save Changes
                </Button>
              )}
              {isAdmin && !isEditing && (
                <Button onClick={handleDeleteJob} variant="destructive">
                  Delete Job
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Attachments Card */}
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-6">
        <Typography variant="h5" component="h2" gutterBottom className="mb-4">
          Job Attachments ({job.attachments?.length || 0})
        </Typography>
        {isEditing ? (
          <div className="mb-4">
            <InputLabel htmlFor="attachments-upload">
              Upload New Attachments
            </InputLabel>
            <input
              type="file"
              id="attachments-upload"
              multiple
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400"
            />
            {newAttachments.length > 0 && (
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Selected files: {newAttachments.map((f) => f.name).join(", ")}
              </div>
            )}
          </div>
        ) : null}

        {job.attachments && job.attachments.length > 0 ? (
          <ul className="list-disc pl-5 space-y-2">
            {job.attachments.map((attachment) => (
              <li
                key={attachment.id}
                className="flex items-center justify-between text-gray-700 dark:text-gray-300"
              >
                <a
                  href={`http://localhost:8081/api/files/${attachment.filePath}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline flex items-center"
                >
                  {attachment.fileName} (
                  {(attachment.fileSize / 1024 / 1024).toFixed(2)} MB)
                  <FileDownloadIcon className="ml-2" fontSize="small" />
                </a>
                {isEditing && (
                  <Button
                    onClick={() => handleDeleteAttachment(attachment.id)}
                    size="sm"
                    variant="destructive"
                    className="ml-4"
                  >
                    Delete
                  </Button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <Typography className="text-gray-600 dark:text-gray-400">
            No attachments yet.
          </Typography>
        )}
      </div>

      {/* Comments Card */}
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
        <Typography variant="h5" component="h2" gutterBottom className="mb-4">
          Comments ({job.comments?.length || 0})
        </Typography>

        {canEdit && (
          <div className="mb-6 border-b pb-4 border-gray-200 dark:border-gray-700">
            <TextField
              label="Add a comment"
              multiline
              rows={3}
              fullWidth
              variant="outlined"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="mb-2"
            />
            <input
              type="file"
              multiple
              onChange={handleCommentFileChange}
              ref={commentFileInputRef}
              className="mb-4 block text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400"
            />
            {commentAttachments.length > 0 && (
              <div className="mb-4">
                <Typography variant="body2" className="text-gray-600 dark:text-gray-300">
                  Files to upload:
                </Typography>
                <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
                  {commentAttachments.map((file, index) => {
                    const isImage = file.type.startsWith("image/");
                    return (
                      <li key={index} className="flex flex-col items-start bg-white dark:bg-gray-700 p-2 rounded-md border border-gray-200 dark:border-gray-600">
                        {isImage && (
                          <img
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            className="max-w-full h-24 object-contain mb-2 rounded-sm"
                            style={{ maxWidth: '100%', height: '96px', objectFit: 'contain' }}
                          />
                        )}
                        <div className="flex items-center w-full justify-between">
                          <span className="text-sm text-gray-700 dark:text-gray-200 break-words">
                            {file.name}
                          </span>
                          <IconButton
                            onClick={() => {
                              const newAttachments = [...commentAttachments];
                              newAttachments.splice(index, 1);
                              setCommentAttachments(newAttachments);
                            }}
                            size="small"
                            color="error"
                            aria-label="remove file"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {(file.size / 1024).toFixed(2)} KB
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            <Button
              onClick={handleAddComment}
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              Add Comment
            </Button>
          </div>
        )}

        <div className="mt-6 space-y-6">
          {job.comments.length > 0 ? (
            <>
              {job.comments.map((comment) => (
                <div
                  key={comment.id}
                  className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow-sm"
                >
                  <div className="flex justify-between items-start mb-2">
                    <Typography
                      variant="subtitle1"
                      className="font-bold text-gray-900 dark:text-gray-100"
                    >
                      {comment.name} ({comment.email})
                    </Typography>
                    <Typography
                      variant="caption"
                      className="text-gray-500 dark:text-gray-400"
                    >
                      {format(new Date(comment.createdAt), "MMM d, yyyy HH:mm")}
                    </Typography>
                  </div>
                  {editingCommentId === comment.id ? (
                    <>
                      <TextField
                        value={editingCommentBody}
                        onChange={(e) => setEditingCommentBody(e.target.value)}
                        multiline
                        fullWidth
                        variant="outlined"
                        className="mb-2"
                      />
                      <input
                        type="file"
                        multiple
                        onChange={handleEditingCommentFileChange}
                        ref={editingCommentFileInputRef}
                        className="mb-4 block text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400"
                      />
                      {editingCommentAttachments.length > 0 && (
                        <div className="mb-4">
                          <Typography
                            variant="body2"
                            className="text-gray-600 dark:text-gray-300"
                          >
                            Files to upload:
                          </Typography>
                          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
                            {editingCommentAttachments.map((file, index) => {
                              const isImage = file.type.startsWith("image/");
                              return (
                                <li key={index} className="flex flex-col items-start bg-white dark:bg-gray-700 p-2 rounded-md border border-gray-200 dark:border-gray-600">
                                  {isImage && (
                                    <img
                                      src={URL.createObjectURL(file)}
                                      alt={file.name}
                                      className="max-w-full h-24 object-contain mb-2 rounded-sm"
                                      style={{ maxWidth: '100%', height: '96px', objectFit: 'contain' }}
                                    />
                                  )}
                                  <div className="flex items-center w-full justify-between">
                                    <span className="text-sm text-gray-700 dark:text-gray-200 break-words">
                                      {file.name}
                                    </span>
                                    <IconButton
                                      onClick={() => {
                                        const newAttachments = [...editingCommentAttachments];
                                        newAttachments.splice(index, 1);
                                        setEditingCommentAttachments(newAttachments);
                                      }}
                                      size="small"
                                      color="error"
                                      aria-label="remove file"
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </div>
                                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {(file.size / 1024).toFixed(2)} KB
                                  </span>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}
                    </>
                  ) : (
                    <Typography
                      variant="body1"
                      className="text-gray-800 dark:text-gray-200"
                    >
                      {comment.body}
                    </Typography>
                  )}
                  {comment.attachments && comment.attachments.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                      <Typography
                        variant="subtitle2"
                        className="text-gray-600 dark:text-gray-400 mb-1"
                      >
                        Attachments:
                      </Typography>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                        {comment.attachments.map((attachment) => {
                          const isImage =
                            attachment.fileType.startsWith("image/");
                          return (
                            <li
                              key={attachment.id}
                              className="flex flex-col items-start bg-white dark:bg-gray-800 p-2 rounded-md border border-gray-200 dark:border-gray-600"
                            >
                              {isImage && (
                                <img
                                  src={`http://localhost:8081/api/files/${attachment.filePath}`}
                                  alt={attachment.fileName}
                                  className="max-w-full h-24 object-contain mb-2 rounded-sm"
                                  style={{
                                    maxWidth: "100%",
                                    height: "96px",
                                    objectFit: "contain",
                                  }}
                                />
                              )}
                              <div className="flex items-center w-full justify-between">
                                <a
                                  href={`http://localhost:8081/api/files/${attachment.filePath}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-500 hover:underline flex items-center break-words"
                                >
                                  {attachment.fileName}
                                  <FileDownloadIcon
                                    className="ml-1"
                                    fontSize="small"
                                  />
                                </a>
                                {canEdit && (
                                  <IconButton
                                    onClick={() => handleDeleteCommentAttachment(comment.id, attachment.id)}
                                    size="small"
                                    color="error"
                                    aria-label="delete attachment"
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                )}
                              </div>
                              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {(attachment.fileSize / 1024).toFixed(2)} KB
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                  {canEdit && (
                    <div className="mt-3 flex justify-end space-x-2">
                      {editingCommentId === comment.id ? (
                        <>
                          <Button
                            onClick={() => handleSaveComment(comment.id)}
                            size="sm"
                            className="bg-blue-500 hover:bg-blue-600 text-white"
                          >
                            Save
                          </Button>
                          <Button
                            onClick={handleCancelEditComment}
                            size="sm"
                            variant="outline"
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <IconButton
                            onClick={() => handleEditComment(comment)}
                            size="small"
                            color="primary"
                            aria-label="edit comment"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            onClick={() => handleDeleteComment(comment.id)}
                            size="small"
                            color="error"
                            aria-label="delete comment"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </>
          ) : (
            <Typography className="text-gray-600 dark:text-gray-400">
              No comments yet.
            </Typography>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobDetailPage;