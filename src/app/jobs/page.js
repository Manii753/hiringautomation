'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import JobSkeleton from '@/components/JobSkeleton';
import { Pencil, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

export default function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewJobDialog, setShowNewJobDialog] = useState(false);
  const [name, setName] = useState('');
  const [clickupTaskId, setClickupTaskId] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/jobs');
      const data = await response.json();
      if (data.success) {
        setJobs(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const response = await fetch('/api/job', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, clickupTaskId }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Job Created', {
          description: 'The new job has been created successfully.',
        });
        setShowNewJobDialog(false);
        fetchJobs(); // Refresh the jobs list
      } else {
        toast.error('Error', {
          description: data.error || 'Failed to create job.',
        });
      }
    } catch (error) {
      toast.error('Error', {
        description: 'An unexpected error occurred.',
      });
      console.error('Failed to create job:', error);
    } finally {
      setFormLoading(false);
    }
  };

  const [showEditDialog, setShowEditDialog] = useState(false);
  const [jobToEdit, setJobToEdit] = useState(null);
  const [editedName, setEditedName] = useState('');
  const [editedClickupTaskId, setEditedClickupTaskId] = useState('');

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!jobToEdit) return;

    setFormLoading(true);
    try {
      const response = await fetch(`/api/job/${jobToEdit._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: editedName, clickupTaskId: editedClickupTaskId }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Job Updated', {
          description: 'The job has been updated successfully.',
        });
        fetchJobs(); // Refresh the jobs list
      } else {
        toast.error('Error', {
          description: data.error || 'Failed to update job.',
        });
      }
    } catch (error) {
      toast.error('Error', {
        description: 'An unexpected error occurred.',
      });
      console.error('Failed to update job:', error);
    } finally {
      setFormLoading(false);
      setShowEditDialog(false);
      setJobToEdit(null);
    }
  };

  const openEditDialog = (job) => {
    setJobToEdit(job);
    setEditedName(job.name);
    setEditedClickupTaskId(job.clickupTaskId);
    setShowEditDialog(true);
  };

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [jobToDelete, setJobToDelete] = useState(null);

  const handleDelete = async () => {
    if (!jobToDelete) return;

    try {
      const response = await fetch(`/api/job/${jobToDelete._id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Job Deleted', {
          description: 'The job has been deleted successfully.',
        });
        fetchJobs(); // Refresh the jobs list
      } else {
        toast.error('Error', {
          description: data.error || 'Failed to delete job.',
        });
      }
    } catch (error) {
      toast.error('Error', {
        description: 'An unexpected error occurred.',
      });
      console.error('Failed to delete job:', error);
    } finally {
      setShowDeleteDialog(false);
      setJobToDelete(null);
    }
  };

  return (
    <div className="container mx-auto py-10">
      {/* ... existing code ... */}
      {loading ? (
        <JobSkeleton />
      ) : jobs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map((job) => (
            <Card key={job._id}>
              <CardHeader>
                <CardTitle>{job.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">ClickUp Task ID: <Badge>{job.clickupTaskId}</Badge></p>
                <div className="flex justify-end space-x-2 mt-4">
                  <Button variant="outline" size="icon" onClick={() => openEditDialog(job)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="destructive" size="icon" onClick={() => {
                    setJobToDelete(job);
                    setShowDeleteDialog(true);
                  }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="border rounded-lg p-4 text-center">
          <p>No jobs found. Create a new one to get started!</p>
        </div>
      )}
      <AlertDialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Edit Job</AlertDialogTitle>
          </AlertDialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label htmlFor="editedName" className="block text-sm font-medium text-muted-foreground mb-1">
                Job Name
              </label>
              <Input
                id="editedName"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                placeholder="e.g., Software Engineer"
                required
              />
            </div>
            <div>
              <label htmlFor="editedClickupTaskId" className="block text-sm font-medium text-muted-foreground mb-1">
                ClickUp Task ID
              </label>
              <Input
                id="editedClickupTaskId"
                value={editedClickupTaskId}
                onChange={(e) => setEditedClickupTaskId(e.target.value)}
                placeholder="e.g., 123456"
                required
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setJobToEdit(null)}>Cancel</AlertDialogCancel>
              <Button type="submit" disabled={formLoading}>
                {formLoading ? 'Updating...' : 'Update Job'}
              </Button>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this job?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the job.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteDialog(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
