"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation"; // or 'next/router' in pages dir
import { format } from "date-fns"; // For date formatting
import { Button } from "@/components/ui/button"; // Assuming you have a button component
import { toast } from "@/components/ui/use-toast"; // Assuming you have a toast component
import { isTokenExpired } from "@/lib/utils";
import Cookies from "js-cookie";
import { useAppContext } from "@/app/app-provider";
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
} from "@mui/material";

interface Job {
  id: number;
  title: string;
  description: string;
  customer: string;
  requesterBy?: any;
  assignerBy?: any;
  status: string;
  statusId: number;
  dueDate: string;
  createdAt: string;
}

interface StatusOption {
  statusId: number;
  statusName: string;
}

const JobDetailPage = () => {
  const { id } = useParams();
  const router = useRouter();
  const { user, roles } = useAppContext();
  const username = user?.username || user?.email || null;
  useEffect(() => {
    if (isTokenExpired()) {
      Cookies.remove("accessToken");
      Cookies.remove("accessTokenExpiresAt");
      router.push("/login");
    }
  }, [router]);
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState<number | null>(null);
  const token = Cookies.get("accessToken");
  const [statusOptions, setStatusOptions] = useState<StatusOption[]>([]);

  const API_JOBS_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL
    ? `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/jobs`
    : "http://localhost:8081/api/jobs";

  const API_STATUSES_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL
    ? `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/job-statuses`
    : "http://localhost:8081/api/job-statuses";

  useEffect(() => {
    const fetchJobDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_JOBS_URL}/${id}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data: Job = await response.json();
        setJob(data);
        setEditTitle(data.title);
        setEditDescription(data.description);
        setEditStatus(data.statusId || null);
        console.log("Initial editStatus:", data.statusId);
      } catch (err: any) {
        console.error("Error fetching job details:", err);
        setError(err.message || "Could not fetch job details.");
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load job details.",
        });
      } finally {
        setLoading(false);
      }
    };

    const fetchStatusOptions = async () => {
      try {
        const response = await fetch(API_STATUSES_URL, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data: StatusOption[] = await response.json();
          setStatusOptions(data);
        } else {
          console.error("Failed to fetch status options");
        }
      } catch (error) {
        console.error("Error fetching status options:", error);
      }
    };

    if (id) {
      fetchJobDetails();
      fetchStatusOptions();
    }
  }, [id, token, API_JOBS_URL, API_STATUSES_URL]);

  const handleModifyClick = () => {
    setIsEditing(true);
  };

  const handleSaveClick = async () => {
    if (!job) return;
    debugger
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_JOBS_URL}/${job.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: job.id,
          title: editTitle,
          description: editDescription,
          status: editStatus,
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const updatedJob: Job = await response.json();
      setJob(updatedJob);
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Job updated successfully.",
      });
      router.push(`/jobs/${job.id}`);
    } catch (err: any) {
      console.error("Error updating job:", err);
      setError(err.message || "Could not update job.");
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update job.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClick = () => {
    setIsEditing(false);
    setEditTitle(job?.title || "");
    setEditDescription(job?.description || "");
    setEditStatus(job?.statusId || null);
  };

  if (loading) {
    return <div>Loading job details...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!job) {
    return <div>Job not found.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <Button onClick={() => router.push("/jobs/order-list")}>
          &lt; List
        </Button>
        <div className="flex items-center space-x-2">
          <Button>Prev</Button>
          <Button>Next</Button>
        </div>
      </div>

      {isEditing ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextField
            label="Title"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Description"
            multiline
            rows={4}
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            fullWidth
            margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel id="status-label">Status</InputLabel>
            <Select
              labelId="status-label"
              id="status"
              value={editStatus}
              onChange={(e) =>
                {const newValue = Number(e.target.value);
                console.log("Selected Status ID:", newValue);
                 setEditStatus(Number(e.target.value))}
                }
              label="Status"
            >
              {statusOptions.map((option) => (
                <MenuItem key={option.statusId} value={option.statusId}>
                  {option.statusName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <div className="flex space-x-2 mt-4">
            <Button onClick={handleSaveClick} variant="default" color="primary">
              Save
            </Button>
            <Button onClick={handleCancelClick}>Cancel</Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-1">
            <div className="font-bold text-lg mb-2">Order Number</div>
            <div className="text-gray-700">{job.id}</div>
          </div>
          <div className="col-span-1">
            <div className="font-bold text-lg mb-2">Customer</div>
            <div className="text-gray-700">{job.customer}</div>
          </div>
          <div className="col-span-1">
            <div className="font-bold text-lg mb-2">Order</div>
            <div className="text-gray-700">
              {job.requesterBy?.name || "N/A"}
            </div>
          </div>
          <div className="col-span-1">
            <div className="font-bold text-lg mb-2">Worker</div>
            <div className="text-gray-700">{job.assignerBy?.name || "N/A"}</div>
          </div>
          <div className="col-span-1">
            <div className="font-bold text-lg mb-2">Status</div>
            <div className="text-gray-700">
              {job.status || "N/A"}
            </div>
          </div>
          <div className="col-span-1">
            <div className="font-bold text-lg mb-2">Title</div>
            <div className="text-gray-700">{job.title}</div>
          </div>
          <div className="col-span-1">
            <div className="font-bold text-lg mb-2">due date</div>
            <div className="text-gray-700">
              {format(new Date(job.dueDate), "MMM d, yyyy")}
            </div>
          </div>
          <div className="col-span-1">
            <div className="font-bold text-lg mb-2">reg dt</div>
            <div className="text-gray-700">
              {format(new Date(job.createdAt), "MMM d, yyyy")}
            </div>
          </div>

          <div className="mt-4 col-span-2">
            <div className="font-bold text-lg mb-2">Description</div>
            <div className="text-gray-800">{job.description}</div>
          </div>

          <div className="mt-4 flex space-x-2 col-span-2">
            <Button variant="destructive">Delete</Button>
            <Button onClick={handleModifyClick}>Modify</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobDetailPage;
