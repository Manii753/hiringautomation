'use client';

import React, { useState, useEffect } from 'react';
import { toast } from "sonner";
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from "@/components/ui/badge";
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
  LucideFileVideo,
  Loader2,
  Pencil,
  Maximize,
  X,
  RefreshCw,
  ChevronDown,
  ExternalLink,
  Check,
  Trash2,
  Send,
  Sparkles,
  FileText,
  MessageSquare,
  User as UserIcon,
  Calendar,
  Briefcase,
  Slack,
} from 'lucide-react';
import Link from 'next/link';
import CandidateDetailSkeleton from '@/components/candidateSkelton';
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

const CandidateDetailPage = () => {
  const params = useParams();
  const candidateId = params.id;
  const { data: session } = useSession();
  const [user, setUser] = useState(null);
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [manatalCandidate, setManatalCandidate] = useState(null);
  const [isManatalLoading, setIsManatalLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [managerComment, setManagerComment] = useState('');
  const [webhookResponse, setWebhookResponse] = useState(null);
  const [isSendingToSlack, setIsSendingToSlack] = useState(false);
  const [slackChannel, setSlackChannel] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedWebhookResponse, setEditedWebhookResponse] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isNotesOverlayVisible, setIsNotesOverlayVisible] = useState(false);
  const [isReevaluating, setIsReevaluating] = useState(false);
  const [job, setJob] = useState(null);
  const [isJobLoading, setIsJobLoading] = useState(false);
  const [allJobs, setAllJobs] = useState([]);
  const [isEditingJob, setIsEditingJob] = useState(false);
  const [showManatalWarning, setShowManatalWarning] = useState(false);

  // Email editing states
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [editedEmail, setEditedEmail] = useState('');
  const [isSavingEmail, setIsSavingEmail] = useState(false);

  // Comments states
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editedCommentText, setEditedCommentText] = useState('');
  const [isSavingComment, setIsSavingComment] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState(null);

  // Tab state
  const [activeTab, setActiveTab] = useState('ai');

  const currentUserId = session?.user?.id || session?.user?._id || session?.user?.email || null;

  useEffect(() => {
    const fetchAllJobs = async () => {
      try {
        const response = await fetch('/api/jobs');
        if (response.ok) {
          const { data } = await response.json();
          setAllJobs(data);
        } else {
          console.error('Failed to fetch all jobs');
        }
      } catch (error) {
        console.error('Error fetching all jobs:', error);
      }
    };
    fetchAllJobs();
  }, []);

  useEffect(() => {
    if (session) {
      setUser(session.user);
      if (session.slackChannel) {
        setSlackChannel(session.slackChannel);
      }
    }
  }, [session]);

  const setClickUpTaskId = async (jobName) => {
    if (!jobName) return;
    setIsJobLoading(true);
    try {
      const response = await fetch(`/api/job/find-by-name?jobName=${encodeURIComponent(jobName)}`);
      if (response.ok) {
        const data = await response.json();
        setJob(data);
      } else {
        toast.warning('Candidate Job not found Set it Manually.');
        setJob(null);
      }
    } catch (error) {
      console.error('Error fetching job details:', error);
      setJob(null);
    }
    setIsJobLoading(false);
  };

  const fetchCandidateDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/drive/file/${candidateId}`);
      const data = await response.json();
      setCandidate(data);

      setEditedEmail(data.email || '');

      if (data.positionMatch) {
        setClickUpTaskId(data.positionMatch);
      }

      if (data.webhookResponse) {
        setWebhookResponse(data.webhookResponse);
        setEditedWebhookResponse(data.webhookResponse);
      } else {
        setWebhookResponse(null);
        setEditedWebhookResponse(null);
      }
      if (data.managerComment) {
        setManagerComment(data.managerComment);
      } else {
        setManagerComment('');
      }

      setComments(Array.isArray(data.comments) ? data.comments : []);

      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }
    setIsAddingComment(true);
    try {
      const response = await fetch(`/api/candidate/${candidateId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newComment }),
      });
      if (response.ok) {
        const { comment } = await response.json();
        setComments(prev => [...prev, comment]);
        setNewComment('');
        toast.success('Comment added');
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.error || 'Failed to add comment');
      }
    } catch (error) {
      toast.error('An error occurred while adding comment');
    }
    setIsAddingComment(false);
  };

  const handleStartEditComment = (comment) => {
    setEditingCommentId(comment._id);
    setEditedCommentText(comment.text);
  };

  const handleCancelEditComment = () => {
    setEditingCommentId(null);
    setEditedCommentText('');
  };

  const handleSaveComment = async (commentId) => {
    if (!editedCommentText.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }
    setIsSavingComment(true);
    try {
      const response = await fetch(`/api/candidate/${candidateId}/comments/${commentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: editedCommentText }),
      });
      if (response.ok) {
        const { comment } = await response.json();
        setComments(prev => prev.map(c => (c._id === commentId ? comment : c)));
        setEditingCommentId(null);
        setEditedCommentText('');
        toast.success('Comment updated');
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.error || 'Failed to update comment');
      }
    } catch (error) {
      toast.error('An error occurred while saving comment');
    }
    setIsSavingComment(false);
  };

  const handleDeleteComment = async (commentId) => {
    setDeletingCommentId(commentId);
    try {
      const response = await fetch(`/api/candidate/${candidateId}/comments/${commentId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setComments(prev => prev.filter(c => c._id !== commentId));
        toast.success('Comment deleted');
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.error || 'Failed to delete comment');
      }
    } catch (error) {
      toast.error('An error occurred while deleting comment');
    }
    setDeletingCommentId(null);
  };

  useEffect(() => {
    if (candidateId) {
      fetchCandidateDetail();
    }
  }, [candidateId]);

  const fetchManatalCandidate = async (email) => {
    if (!email) {
      setManatalCandidate(null);
      return;
    }
    setIsManatalLoading(true);
    try {
      const response = await fetch(`/api/manatal?email=${encodeURIComponent(email)}`);
      if (response.ok) {
        const { data } = await response.json();
        if (data && data.results && data.results.length > 0) {
          setManatalCandidate(data.results[0]);
        } else {
          setManatalCandidate(null);
        }
      } else {
        setManatalCandidate(null);
        const error = await response.json();
        if (response.status !== 404) {
          toast.error(error.error || "Failed to fetch Manatal data.");
        }
      }
    } catch (error) {
      console.error("Error fetching Manatal info", error);
      toast.error("An error occurred while fetching Manatal data.");
    }
    setIsManatalLoading(false);
  };

  useEffect(() => {
    if (candidate?.email) {
      fetchManatalCandidate(candidate.email);
    }
  }, [candidate?.email]);

  const handleEmailEdit = () => {
    setIsEditingEmail(true);
  };

  const handleEmailCancel = () => {
    setIsEditingEmail(false);
    setEditedEmail(candidate.email || '');
  };

  const handleEmailSave = async () => {
    if (!editedEmail) {
      toast.error('Email cannot be empty');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editedEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsSavingEmail(true);
    try {
      const response = await fetch(`/api/drive/file/${candidateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: editedEmail }),
      });

      if (response.ok) {
        setCandidate(prev => ({ ...prev, email: editedEmail }));
        setIsEditingEmail(false);
        toast.success('Email updated successfully');
        await fetchManatalCandidate(editedEmail);
      } else {
        toast.error('Failed to update email');
      }
    } catch (error) {
      toast.error('An error occurred while saving email');
    }
    setIsSavingEmail(false);
  };

  const handleStatusChange = async (status) => {
    setIsSubmitting(status);
    try {
      const response = await fetch('/api/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          job: job,
          ...candidate,
          status: status,
          managerComment: managerComment,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCandidate(prev => ({ ...prev, status: status, appProperties: { ...prev.appProperties, status: status } }));
        if (data.webhookData) {
          setWebhookResponse(data.webhookData);
          setEditedWebhookResponse(data.webhookData);
        }
      } else {
        const errorData = await response.json();
        console.error('Failed to update candidate status:', response.status, errorData);
      }
    } catch (error) {
      console.error('Error submitting candidate status:', error);
    }
    setIsSubmitting(false);
  };

  const handleSendToSlack = async () => {
    if (isManatalLoading) {
      toast.error('Please wait for Manatal profile to finish loading.');
      return;
    }

    if (!manatalCandidate) {
      setShowManatalWarning(true);
      return;
    }

    await sendToSlackInternal();
  };

  const sendToSlackInternal = async () => {
    setIsSendingToSlack(true);
    if (!slackChannel) {
      toast.info('Please select a Slack channel.');
      setIsSendingToSlack(false);
      return;
    }
    try {
      const response = await fetch('/api/slack/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ webhookResponse, candidate, candidateId, slackChannel, job, manatalCandidate }),
      });

      if (response.ok) {
        toast.success('Notes Successfully Sent');
      } else {
        const errorData = await response.json();
        toast.error(`Failed to send to Slack: ${errorData.error}`);
        console.error('Failed to send to Slack');
      }
    } catch (error) {
      toast.error('Failed to send to Slack.');
      console.error('Error sending to Slack:', error);
    }
    setIsSendingToSlack(false);
    setShowManatalWarning(false);
  };

  const handleEdit = () => setIsEditing(true);
  const handleCancel = () => {
    setIsEditing(false);
    setEditedWebhookResponse(webhookResponse);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/drive/file/${candidateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookResponse: editedWebhookResponse }),
      });
      if (response.ok) {
        setWebhookResponse(editedWebhookResponse);
        setIsEditing(false);
        toast.success('AI Evaluation has been updated.');
      } else {
        toast.error('Failed to update AI Evaluation.');
      }
    } catch (error) {
      toast.error('An error occurred while saving.');
    }
    setIsSaving(false);
  };

  const handleReevaluate = async () => {
    setIsReevaluating(true);
    try {
      const response = await fetch(`/api/candidate/${candidateId}/reevaluate`, {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('Candidate has been set for re-evaluation.');
        setWebhookResponse(null);
        setManagerComment('');
        setCandidate(prev => ({
          ...prev,
          appProperties: {
            ...prev.appProperties,
            status: 'pending'
          }
        }));
      } else {
        toast.error('Failed to set for re-evaluation.');
      }
    } catch (error) {
      toast.error('An error occurred during re-evaluation.');
    }
    setIsReevaluating(false);
  };

  const updateAtPath = (path, newValue) => {
    setEditedWebhookResponse(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      let cur = next;
      for (let i = 0; i < path.length - 1; i++) {
        cur = cur[path[i]];
      }
      cur[path[path.length - 1]] = newValue;
      return next;
    });
  };

  const renderViewValue = (value) => {
    if (value === null || value === undefined || value === '') {
      return <span className="text-muted-foreground italic text-sm">N/A</span>;
    }
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return <span className="text-muted-foreground italic text-sm">None</span>;
      }
      const isPrimitiveArray = value.every(v => typeof v !== 'object' || v === null);
      if (isPrimitiveArray) {
        return (
          <ul className="space-y-1.5">
            {value.map((item, idx) => (
              <li key={idx} className="flex gap-2 text-sm leading-relaxed wrap-anywhere">
                <span className="mt-1.5 h-1 w-1 rounded-full bg-muted-foreground/50 shrink-0" />
                <span>{String(item)}</span>
              </li>
            ))}
          </ul>
        );
      }
      return (
        <div className="space-y-1.5">
          {value.map((item, idx) => (
            <div key={idx} className="rounded-md bg-muted/40 p-2.5 text-sm wrap-anywhere min-w-0">
              {typeof item === 'object' && item !== null ? (
                <div className="space-y-1">
                  {Object.entries(item).map(([k, v]) => (
                    <div key={k} className="grid grid-cols-1 sm:grid-cols-[130px_1fr] gap-1 sm:gap-2 sm:items-baseline">
                      <span className="text-xs font-medium text-muted-foreground capitalize">{k.replace(/_/g, ' ')}</span>
                      <div className="min-w-0 wrap-anywhere">{renderViewValue(v)}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="whitespace-pre-wrap wrap-anywhere">{String(item)}</p>
              )}
            </div>
          ))}
        </div>
      );
    }
    if (typeof value === 'object') {
      return (
        <div className="space-y-1.5">
          {Object.entries(value).map(([k, v]) => (
            <div key={k} className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-1 sm:gap-3 sm:items-baseline">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{k.replace(/_/g, ' ')}</span>
              <div className="text-sm leading-relaxed wrap-anywhere">{renderViewValue(v)}</div>
            </div>
          ))}
        </div>
      );
    }
    return <span className="block text-sm whitespace-pre-wrap wrap-anywhere leading-relaxed">{String(value)}</span>;
  };

  const renderEditValue = (value, path) => {
    if (Array.isArray(value)) {
      return (
        <div className="pl-2 sm:pl-4 mt-2 border-l-2 space-y-2 min-w-0">
          {value.map((item, idx) => (
            <div key={idx} className="space-y-2 min-w-0">
              <h4 className="font-medium">Item {idx + 1}</h4>
              {typeof item === 'object' && item !== null ? (
                Object.entries(item).map(([k, v]) => (
                  <div key={k}>
                    <label className="text-sm font-medium capitalize">{k.replace(/_/g, ' ')}</label>
                    {renderEditValue(v, [...path, idx, k])}
                  </div>
                ))
              ) : (
                <Textarea
                  value={String(item ?? '')}
                  onChange={(e) => updateAtPath([...path, idx], e.target.value)}
                />
              )}
            </div>
          ))}
        </div>
      );
    }
    if (typeof value === 'object' && value !== null) {
      return (
        <div className="space-y-2 pl-2 sm:pl-4 min-w-0">
          {Object.entries(value).map(([k, v]) => (
            <div key={k} className="min-w-0">
              <label className="text-sm font-medium capitalize">{k.replace(/_/g, ' ')}</label>
              {renderEditValue(v, [...path, k])}
            </div>
          ))}
        </div>
      );
    }
    return (
      <Textarea
        value={String(value ?? '')}
        onChange={(e) => updateAtPath(path, e.target.value)}
        className="mt-1"
      />
    );
  };

  if (loading || !candidate) {
    return <CandidateDetailSkeleton />;
  }

  const initials = (candidate.candidateName || '?')
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const status = candidate.appProperties?.status || 'pending';
  const statusVariant = status === 'pass' ? 'green' : status === 'fail' ? 'destructive' : 'default';
  const decisionLocked = status === 'pass' || status === 'fail';

  // Pull out featured fields if present
  const featuredRecommendation = webhookResponse?.overall_recommendation || webhookResponse?.recommendation;
  const featuredScore = webhookResponse?.fit_score || webhookResponse?.score;
  const otherWebhookEntries = webhookResponse
    ? Object.entries(webhookResponse).filter(([k]) => !['overall_recommendation', 'recommendation', 'fit_score', 'score'].includes(k))
    : [];

  const tabs = [
    { key: 'ai', label: 'AI Summary', icon: Sparkles, badge: null },
    { key: 'transcript', label: 'Transcript', icon: FileText, badge: null },
    { key: 'comments', label: 'Comments', icon: MessageSquare, badge: comments.length || null },
    { key: 'review', label: 'Manager Review', icon: UserIcon, badge: decisionLocked ? <Check className="h-3 w-3" /> : null },
  ];

  return (
    <div className="h-[calc(100dvh-57px)] sm:h-[calc(100dvh-65px)] overflow-hidden flex flex-col bg-background">
      {/* Top bar */}
      <header className="shrink-0 h-14 flex items-center gap-2 sm:gap-3 px-3 sm:px-5 border-b bg-background/80 backdrop-blur-md">
        <Link href="/">
          <Button variant="ghost" size="sm" className="h-8">
            <ArrowLeft className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Candidates</span>
          </Button>
        </Link>
        <span className="text-muted-foreground/40 hidden sm:inline">/</span>
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-7 w-7 rounded-full bg-linear-to-br from-primary to-primary/60 text-primary-foreground text-xs font-semibold flex items-center justify-center shrink-0">
            {initials}
          </div>
          <span className="text-sm font-semibold truncate hidden md:inline">{candidate.candidateName}</span>
          <Badge variant={statusVariant} className="capitalize shrink-0">{status}</Badge>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground mr-1">
            <Slack className="h-3.5 w-3.5" />
            <span className="font-mono">{session?.slackChannel || '—'}</span>
          </div>
          {(webhookResponse || status === 'pass' || status === 'fail') && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={isReevaluating} className="h-8">
                  {isReevaluating ? <Loader2 className="h-3.5 w-3.5 sm:mr-1.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5 sm:mr-1.5" />}
                  <span className="hidden sm:inline">Re-evaluate</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will reset the evaluation status to 'pending' and delete the current AI summary and manager comment. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleReevaluate}>Confirm</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          {webhookResponse && (
            <Button
              onClick={handleSendToSlack}
              disabled={isSendingToSlack || !user?.slackAccessToken || isManatalLoading}
              size="sm"
              className="h-8"
            >
              {isSendingToSlack || isManatalLoading ? (
                <Loader2 className="h-3.5 w-3.5 sm:mr-1.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5 sm:mr-1.5" />
              )}
              <span className="hidden sm:inline">{isManatalLoading ? 'Loading…' : 'Send Notes'}</span>
            </Button>
          )}
        </div>
      </header>

      {/* Manatal Warning Dialog */}
      <AlertDialog open={showManatalWarning} onOpenChange={setShowManatalWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Manatal Profile Not Found</AlertDialogTitle>
            <AlertDialogDescription>
              No Manatal profile was found for this candidate. The notes will be sent to Slack without Manatal profile information. Do you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={sendToSlackInternal}>
              Send Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Notes Overlay */}
      {isNotesOverlayVisible && (
        <div
          className="flex justify-center items-center fixed inset-0 z-50 bg-background/60 backdrop-blur-sm p-3 sm:p-6"
          onClick={() => setIsNotesOverlayVisible(false)}
        >
          <div
            className="bg-muted rounded-lg shadow-xl w-full max-w-5xl h-[90vh] sm:h-4/5 p-4 sm:p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3 sm:top-4 sm:right-4"
              onClick={() => setIsNotesOverlayVisible(false)}
            >
              <X className="h-6 w-6" />
            </Button>
            <h2 className="text-lg sm:text-2xl font-bold mb-4 pr-10">Interview Notes & Transcript</h2>
            <div className="h-[calc(100%-3rem)] sm:h-[calc(100%-4rem)] overflow-y-auto">
              <pre className="whitespace-pre-wrap text-xs sm:text-sm font-mono leading-relaxed">
                {candidate.content}
              </pre>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* Left rail */}
        <aside className="w-full lg:w-80 lg:shrink-0 border-b lg:border-b-0 lg:border-r bg-muted/30 overflow-y-auto">
          <div className="p-5 space-y-4">
            {/* Identity */}
            <div className="flex flex-col items-center text-center pb-4 border-b">
              <div className="h-16 w-16 rounded-full bg-linear-to-br from-primary to-primary/60 text-primary-foreground text-xl font-semibold flex items-center justify-center mb-3">
                {initials}
              </div>
              <div className="text-base font-semibold wrap-break-word">{candidate.candidateName}</div>
              {candidate.positionMatch && (
                <div className="text-xs text-muted-foreground mt-0.5 wrap-break-word">{candidate.positionMatch}</div>
              )}
              <div className="mt-3 flex items-center gap-2 flex-wrap justify-center">
                <Badge variant={statusVariant} className="capitalize">{status}</Badge>
                {candidate.recordingLink && (
                  <a
                    href={candidate.recordingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <LucideFileVideo className="h-3 w-3" />
                    Recording
                  </a>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Email</div>
                {!isEditingEmail && (
                  <Button size="icon" variant="ghost" onClick={handleEmailEdit} className="h-6 w-6">
                    <Pencil className="h-3 w-3" />
                  </Button>
                )}
              </div>
              {isEditingEmail ? (
                <div className="flex items-center gap-1">
                  <Input
                    type="email"
                    value={editedEmail}
                    onChange={(e) => setEditedEmail(e.target.value)}
                    className="h-8 flex-1 text-xs"
                    placeholder="Enter email address"
                    disabled={isSavingEmail}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleEmailSave}
                    disabled={isSavingEmail}
                    className="h-8 w-8"
                  >
                    {isSavingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleEmailCancel}
                    disabled={isSavingEmail}
                    className="h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="text-sm break-all">{candidate.email || 'No email'}</div>
              )}
            </div>

            {/* Interview */}
            <div className="border-t pt-3">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1.5">Interviewed</div>
              <div className="flex items-center gap-1.5 text-sm flex-wrap">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span>{candidate.interviewDate ? new Date(candidate.interviewDate).toLocaleDateString() : 'N/A'}</span>
                {candidate.interviewTime && (
                  <span className="text-muted-foreground">· {candidate.interviewTime}</span>
                )}
              </div>
            </div>

            {/* Job */}
            <div className="border-t pt-3">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Job Position</div>
                {job && !isEditingJob && (
                  <Button size="icon" variant="ghost" onClick={() => setIsEditingJob(true)} className="h-6 w-6">
                    <Pencil className="h-3 w-3" />
                  </Button>
                )}
              </div>
              {isJobLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ) : job && !isEditingJob ? (
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Briefcase className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{job.name}</div>
                    {job.clickupTaskId && (
                      <div className="text-[11px] text-muted-foreground font-mono truncate">{job.clickupTaskId}</div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {candidate.positionMatch && !job && (
                    <p className="text-xs text-muted-foreground">Job not found. Select one below.</p>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full justify-between h-9">
                        <span className="truncate">{job ? job.name : 'Select a Job'}</span>
                        <ChevronDown className="h-4 w-4 shrink-0" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                      <DropdownMenuLabel>Available Jobs</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {allJobs.map((j) => (
                        <DropdownMenuItem key={j._id} onSelect={() => { setJob(j); setIsEditingJob(false); }}>
                          {j.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>

            {/* Manatal */}
            <div className="border-t pt-3">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Manatal Profile</div>
                {manatalCandidate && (
                  <a
                    href={`https://app.manatal.com/candidates/${manatalCandidate.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              {isManatalLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ) : manatalCandidate ? (
                <div className="space-y-1.5">
                  <div className="text-sm font-medium wrap-break-word">{manatalCandidate.full_name}</div>
                  {manatalCandidate.current_position && (
                    <div className="text-xs text-muted-foreground leading-snug">{manatalCandidate.current_position}</div>
                  )}
                  {manatalCandidate.headline && (
                    <div className="text-[11px] text-muted-foreground italic wrap-break-word">"{manatalCandidate.headline}"</div>
                  )}
                  {manatalCandidate.resume && (
                    <a
                      href={manatalCandidate.resume}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
                    >
                      <FileText className="h-3 w-3" />
                      View resume
                    </a>
                  )}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground italic">Not found in Manatal</div>
              )}
            </div>

            {/* Slack Channel */}
            <div className="border-t pt-3">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1.5">Slack Channel</div>
              <div className="flex items-center gap-1.5 text-sm">
                <Slack className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="font-mono text-xs break-all">{session?.slackChannel || '—'}</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
          {/* Tabs */}
          <div className="shrink-0 flex items-center gap-1 px-3 sm:px-5 border-b bg-background overflow-x-auto">
            {tabs.map(tab => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "relative h-11 px-3 text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap focus:outline-none",
                    isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <TabIcon className="h-3.5 w-3.5" />
                  {tab.label}
                  {tab.badge != null && (
                    <span className={cn(
                      "ml-0.5 inline-flex items-center justify-center min-w-4.5 h-4.5 px-1 rounded text-[10px] font-semibold",
                      isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    )}>
                      {tab.badge}
                    </span>
                  )}
                  {isActive && <span className="absolute inset-x-2 bottom-0 h-0.5 bg-primary rounded-full" />}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {activeTab === 'ai' && (
              <div className="p-4 sm:p-6 max-w-full">
                <div className="flex items-start justify-between gap-3 mb-5">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-9 w-9 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold">AI Evaluation Summary</div>
                      <div className="text-[11px] text-muted-foreground">Generated from interview transcript · edit to refine</div>
                    </div>
                  </div>
                  {webhookResponse && !isEditing && (
                    <Button variant="outline" size="sm" onClick={handleEdit} className="shrink-0 h-8">
                      <Pencil className="h-3.5 w-3.5 mr-1.5" />
                      Edit
                    </Button>
                  )}
                </div>

                {!webhookResponse ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Sparkles className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No AI evaluation yet for this candidate.</p>
                      <p className="text-xs text-muted-foreground/70 mt-1">Submit a Pass/Fail in Manager Review to generate one.</p>
                    </CardContent>
                  </Card>
                ) : isEditing ? (
                  <Card>
                    <CardContent className="py-5 space-y-4 min-w-0">
                      {Object.entries(editedWebhookResponse || {}).map(([key, value]) => (
                        <div key={key}>
                          <h3 className="font-semibold text-foreground capitalize">{key.replace(/_/g, ' ')}</h3>
                          {renderEditValue(value, [key])}
                        </div>
                      ))}
                      <div className="flex space-x-2 justify-end pt-2 border-t">
                        <Button variant="ghost" onClick={handleCancel} disabled={isSaving}>Cancel</Button>
                        <Button onClick={handleSave} disabled={isSaving}>
                          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Save
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {(featuredRecommendation || featuredScore) && (
                      <div className="rounded-xl border border-primary/20 bg-linear-to-br from-primary/5 to-transparent p-4 mb-4">
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          {featuredRecommendation && (
                            <div className="min-w-0 flex-1">
                              <div className="text-[10px] uppercase tracking-wider text-primary font-semibold">Recommendation</div>
                              <div className="text-base font-semibold mt-1 wrap-break-word">
                                {typeof featuredRecommendation === 'string' ? featuredRecommendation : renderViewValue(featuredRecommendation)}
                              </div>
                            </div>
                          )}
                          {featuredScore && (
                            <div className="text-right shrink-0">
                              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Fit Score</div>
                              <div className="text-2xl font-semibold text-primary mt-1 tabular-nums">
                                {typeof featuredScore === 'string' || typeof featuredScore === 'number' ? featuredScore : renderViewValue(featuredScore)}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    <Card>
                      <CardContent className="py-5 space-y-5 min-w-0">
                        {otherWebhookEntries.map(([key, value]) => (
                          <section key={key}>
                            <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                              {key.replace(/_/g, ' ')}
                            </h3>
                            <div>{renderViewValue(value)}</div>
                          </section>
                        ))}
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
            )}

            {activeTab === 'transcript' && (
              <div className="p-4 sm:p-6 max-w-full">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-9 w-9 rounded-md bg-muted text-foreground flex items-center justify-center shrink-0">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold">Interview Transcript</div>
                      <div className="text-[11px] text-muted-foreground">
                        {candidate.content ? `${candidate.content.length.toLocaleString()} characters · automated transcription` : 'No transcript available'}
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setIsNotesOverlayVisible(true)} className="h-8 shrink-0">
                    <Maximize className="h-3.5 w-3.5 mr-1.5" />
                    Expand
                  </Button>
                </div>
                <Card>
                  <CardContent className="py-5">
                    <div className="rounded-lg bg-muted/50 p-4 sm:p-5 max-h-[70vh] overflow-auto">
                      <pre className="whitespace-pre-wrap wrap-break-word text-sm font-mono leading-relaxed">
                        {candidate.content}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'comments' && (
              <div className="p-4 sm:p-6 max-w-full">
                <div className="flex items-center gap-2 mb-5">
                  <div className="h-9 w-9 rounded-md bg-muted text-foreground flex items-center justify-center shrink-0">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Team Comments</div>
                    <div className="text-[11px] text-muted-foreground">
                      {comments.length} comment{comments.length === 1 ? '' : 's'}
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mb-5">
                  {comments.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">No comments yet. Be the first to add one.</p>
                  ) : (
                    comments.map((c) => {
                      const isAuthor = currentUserId && String(c.authorId) === String(currentUserId);
                      const isEditingThis = editingCommentId === c._id;
                      return (
                        <div key={c._id} className="rounded-lg border bg-card p-3.5">
                          <div className="flex items-start gap-3">
                            {c.authorImage ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={c.authorImage}
                                alt={c.authorName || 'User'}
                                className="h-8 w-8 rounded-full shrink-0"
                              />
                            ) : (
                              <div className={cn(
                                "h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0",
                                isAuthor ? "bg-primary/10 text-primary" : "bg-muted text-foreground"
                              )}>
                                {(c.authorName || c.authorEmail || '?').charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <div className="flex items-baseline gap-2 min-w-0 flex-wrap">
                                  <span className="text-sm font-medium wrap-break-word">
                                    {c.authorName || c.authorEmail || 'Unknown user'}
                                  </span>
                                  <span className="text-[11px] text-muted-foreground">
                                    {c.createdAt ? new Date(c.createdAt).toLocaleString() : ''}
                                    {c.updatedAt && c.createdAt && c.updatedAt !== c.createdAt ? ' (edited)' : ''}
                                  </span>
                                </div>
                                {isAuthor && !isEditingThis && (
                                  <div className="flex gap-1 shrink-0">
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-7 w-7"
                                      onClick={() => handleStartEditComment(c)}
                                    >
                                      <Pencil className="h-3 w-3" />
                                    </Button>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          className="h-7 w-7 text-destructive hover:text-destructive"
                                          disabled={deletingCommentId === c._id}
                                        >
                                          {deletingCommentId === c._id ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                          ) : (
                                            <Trash2 className="h-3 w-3" />
                                          )}
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Delete this comment?</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            This action cannot be undone.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction onClick={() => handleDeleteComment(c._id)}>
                                            Delete
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </div>
                                )}
                              </div>
                              {isEditingThis ? (
                                <div className="mt-2 space-y-2">
                                  <Textarea
                                    value={editedCommentText}
                                    onChange={(e) => setEditedCommentText(e.target.value)}
                                    className="min-h-20"
                                    disabled={isSavingComment}
                                  />
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={handleCancelEditComment}
                                      disabled={isSavingComment}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={() => handleSaveComment(c._id)}
                                      disabled={isSavingComment}
                                    >
                                      {isSavingComment && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                                      Save
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <p className="mt-1 text-sm leading-relaxed whitespace-pre-wrap wrap-anywhere">{c.text}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="rounded-lg border bg-card">
                  <Textarea
                    placeholder="Add a comment for the hiring team..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-22.5 border-0 rounded-b-none focus-visible:ring-0 focus-visible:ring-offset-0 resize-y"
                    disabled={isAddingComment || !currentUserId}
                  />
                  <div className="flex items-center justify-between px-3 py-2 border-t bg-muted/40 rounded-b-lg">
                    <div className="text-[11px] text-muted-foreground">
                      {!currentUserId ? 'Sign in to comment' : 'Be respectful and constructive'}
                    </div>
                    <Button
                      onClick={handleAddComment}
                      disabled={isAddingComment || !newComment.trim() || !currentUserId}
                      size="sm"
                    >
                      {isAddingComment ? (
                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Send className="mr-2 h-3.5 w-3.5" />
                      )}
                      Post Comment
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'review' && (
              <div className="p-4 sm:p-6 max-w-full">
                <div className="flex items-center gap-2 mb-5">
                  <div className="h-9 w-9 rounded-md bg-muted text-foreground flex items-center justify-center shrink-0">
                    <UserIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Manager Review</div>
                    <div className="text-[11px] text-muted-foreground">Your decision finalizes this candidate's status</div>
                  </div>
                </div>

                <Card className="mb-4">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder="What did you think? Add context for the team..."
                      value={managerComment}
                      onChange={(e) => setManagerComment(e.target.value)}
                      className="min-h-35"
                      readOnly={!!webhookResponse}
                    />
                    {!!webhookResponse && (
                      <div className="mt-2 text-[11px] text-muted-foreground">
                        Locked — decision recorded. Use Re-evaluate from the top bar to reopen.
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Decision</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        onClick={() => handleStatusChange('pass')}
                        disabled={isSubmitting || status === 'pass' || !!webhookResponse}
                        className={cn(
                          "group rounded-lg border-2 p-4 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                          status === 'pass' ? "border-green-500 bg-green-500/10" : "border-border hover:border-green-500/60 bg-card",
                          (isSubmitting || (!!webhookResponse && status !== 'pass')) && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div className={cn(
                            "h-6 w-6 rounded-full flex items-center justify-center",
                            status === 'pass' ? "bg-green-500 text-white" : "bg-green-500/10 text-green-600"
                          )}>
                            {isSubmitting === 'pass' ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Check className="h-3.5 w-3.5" />
                            )}
                          </div>
                          <span className="text-sm font-semibold">Pass</span>
                        </div>
                        <div className="text-[11px] text-muted-foreground">Move to next stage</div>
                      </button>
                      <button
                        onClick={() => handleStatusChange('fail')}
                        disabled={isSubmitting || status === 'fail' || !!webhookResponse}
                        className={cn(
                          "group rounded-lg border-2 p-4 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                          status === 'fail' ? "border-destructive bg-destructive/10" : "border-border hover:border-destructive/60 bg-card",
                          (isSubmitting || (!!webhookResponse && status !== 'fail')) && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div className={cn(
                            "h-6 w-6 rounded-full flex items-center justify-center",
                            status === 'fail' ? "bg-destructive text-white" : "bg-destructive/10 text-destructive"
                          )}>
                            {isSubmitting === 'fail' ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <X className="h-3.5 w-3.5" />
                            )}
                          </div>
                          <span className="text-sm font-semibold">Fail</span>
                        </div>
                        <div className="text-[11px] text-muted-foreground">Do not advance</div>
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default CandidateDetailPage;
