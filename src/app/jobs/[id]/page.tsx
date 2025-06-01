"use client";
import React, { useState, useEffect } from "react";
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
interface User {
  id: number;
  username: string;
  name: string;
  email: string;
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

      formData.append("jobRequest", JSON.stringify(jobRequestPayload));

      newAttachments.forEach((file) => {
        formData.append("attachments", file);
      });

      const response = await fetch(`http://localhost:8081/api/jobs/${job.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`
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
      const response = await fetch(
        `http://localhost:8081/api/jobs/${job.id}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            body: commentText,
            email: userEmail,
            name: userName,
          }),
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
      const response = await fetch(
        `http://localhost:8081/api/jobs/${job.id}/comments/${commentId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            body: editingCommentBody,
            email: email,
            name: userName,
          }),
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

      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="col-span-1">
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
            <div className="text-gray-700 dark:text-gray-300">
              {job.requesterBy}
            </div>
          )}
        </div>
        <div className="col-span-1">
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
            <div className="text-gray-700 dark:text-gray-300">
              {job.customer}
            </div>
          )}
        </div>
        <div className="col-span-1">
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
            <div className="text-gray-700 dark:text-gray-300">
              {job.category || "N/A"}
            </div>
          )}
        </div>
        <div className="col-span-1">
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
            <div className="text-gray-700 dark:text-gray-300">
              {job.priority || "N/A"}
            </div>
          )}
        </div>
        <div className="col-span-1">
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
            <div className="text-gray-700 dark:text-gray-300">
              {job.cd || "N/A"}
            </div>
          )}
        </div>
        <div className="col-span-1">
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
            <div className="text-gray-700 dark:text-gray-300">
              {job.assignees && job.assignees.length > 0
                ? job.assignees.map((assignee) => assignee.name).join(", ")
                : "N/A"}
            </div>
          )}
        </div>
        <div className="col-span-1">
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
            <div className="text-gray-700 dark:text-gray-300">
              {job.status || "N/A"}
            </div>
          )}
        </div>
        <div className="col-span-1">
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
            <div className="text-gray-700 dark:text-gray-300">{job.title}</div>
          )}
        </div>
        <div className="col-span-1">
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
            <div className="text-gray-700 dark:text-gray-300">
              {job.dueDate
                ? format(new Date(job.dueDate), "MMM d, yyyy HH:mm")
                : "N/A"}
            </div>
          )}
        </div>
        <div className="col-span-1">
          <div className="font-bold text-lg mb-2">Registered Date</div>
          <div className="text-gray-700 dark:text-gray-300">
            {job.createdAt
              ? format(new Date(job.createdAt), "MMM d, yyyy HH:mm")
              : "N/A"}
          </div>
        </div>
        <div className="col-span-1">
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
            <div className="text-gray-700 dark:text-gray-300">
              {job.completedAt
                ? format(new Date(job.completedAt), "MMM d, yyyy HH:mm")
                : "N/A"}
            </div>
          )}
        </div>
        <div className="col-span-1">
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
            <div className="text-gray-700 dark:text-gray-300">
              {job.region || "N/A"}
            </div>
          )}
        </div>
        <div className="mt-4 col-span-full">
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
            <div className="text-gray-800 dark:text-gray-200">
              {job.description}
            </div>
          )}
        </div>
        <div className="mt-4 col-span-full">
          <Typography
            variant="h6"
            component="h3"
            gutterBottom
            className="mt-4 mb-2"
          >
            Attachments ({job.attachments?.length || 0})
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
            <ul className="list-disc pl-5 space-y-1">
              {job.attachments.map((attachment) => (
                <li
                  key={attachment.id}
                  className="flex items-center justify-between text-gray-700 dark:text-gray-300"
                >
                  <a
                    href={`http://localhost:8081/api/files/${attachment.filePath}`} // Hoặc đường dẫn trực tiếp đến file
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center"
                  >
                    {attachment.fileName} (
                    {(attachment.fileSize / 1024 / 1024).toFixed(2)} MB)
                    {/* Biểu tượng file, ví dụ: */}
                    <svg
                      className="ml-2 w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      ></path>
                    </svg>
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
        <div className="mt-4 flex space-x-2 col-span-full">
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

      {/* Comments Section */}
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
        <Typography variant="h5" component="h2" gutterBottom className="mb-4">
          Comments ({job.comments?.length || 0})
        </Typography>

        {canEdit && (
          <div className="mb-6">
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
            <Button
              onClick={handleAddComment}
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              Add Comment
            </Button>
          </div>
        )}

        {job.comments && job.comments.length > 0 ? (
          <div className="space-y-4">
            {job.comments.map((comment) => (
              <div
                key={comment.id}
                className="border-b border-gray-200 dark:border-gray-700 pb-4 last:pb-0 last:border-b-0"
              >
                <div className="flex justify-between items-center mb-1">
                  <Typography
                    variant="subtitle2"
                    className="font-bold text-gray-900 dark:text-gray-100"
                  >
                    {comment.name}
                  </Typography>
                  <Typography
                    variant="caption"
                    className="text-gray-500 dark:text-gray-400"
                  >
                    {format(new Date(comment.createdAt), "MMM d, yyyy HH:mm")}
                  </Typography>
                </div>
                {editingCommentId === comment.id ? (
                  <TextField
                    value={editingCommentBody}
                    onChange={(e) => setEditingCommentBody(e.target.value)}
                    multiline
                    fullWidth
                    variant="outlined"
                    className="mb-2"
                  />
                ) : (
                  <Typography
                    variant="body1"
                    className="text-gray-800 dark:text-gray-200"
                  >
                    {comment.body}
                  </Typography>
                )}
                {canEdit && (
                  <div className="mt-2 space-x-2">
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
                        <Button
                          onClick={() => handleEditComment(comment)}
                          size="sm"
                          variant="outline"
                        >
                          Edit
                        </Button>
                        <Button
                          onClick={() => handleDeleteComment(comment.id)}
                          size="sm"
                          variant="destructive"
                        >
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <Typography className="text-gray-600 dark:text-gray-400">
            No comments yet.
          </Typography>
        )}
      </div>
    </div>
  );
};

export default JobDetailPage;
