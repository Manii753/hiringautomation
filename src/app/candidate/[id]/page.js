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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ArrowLeft,  FileVideo,  Loader2, LucideFileVideo, Pencil, Maximize, X, RefreshCw, ChevronDown } from 'lucide-react';
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
} from "@/components/ui/alert-dialog"



const CandidateDetailPage = () => {
  const params = useParams();
  const candidateId = params.id;
  const { data: session } = useSession();
  const [user, setUser] = useState(null);
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
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
  }

  const fetchCandidateDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/drive/file/${candidateId}`);
      const data = await response.json();
      setCandidate(data);
      
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

      
      
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (candidateId) {
      fetchCandidateDetail();
    }
  }, [candidateId]);

  const handleStatusChange = async (status) => {
    setIsSubmitting(status);
    try {
      const response = await fetch('/api/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...candidate,
          status: status,
          managerComment: managerComment,
        }),
      });

      if (response.ok) {
        const data = await response.json();                                                                                                                                                                                                                                                                                              
        setCandidate(prev => ({...prev, status: status, appProperties: {...prev.appProperties, status: status}}));
        if(data.webhookData) {
            setWebhookResponse(data.webhookData);
            setEditedWebhookResponse(data.webhookData);
        }
      } else {
        console.error('Failed to update candidate status');
      }
    } catch (error) {
      console.error('Error submitting candidate status:', error);
    }
    setIsSubmitting(false);
  };

  const handleSendToSlack = async () => {
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
        body: JSON.stringify({ webhookResponse, candidate ,candidateId ,slackChannel ,job }),
      });

      if (response.ok) {
        toast.success('Successfully sent to Slack!');
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

  const handleWebhookResponseChange = (key, value) => {
    setEditedWebhookResponse(prev => ({ ...prev, [key]: value }));
  };

  const handleReevaluate = async () => {
    setIsReevaluating(true);
    try {
      const response = await fetch(`/api/candidate/${candidateId}/reevaluate`, {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('Candidate has been set for re-evaluation.');
        // Optimistically update UI
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


  if (loading || !candidate) {
      return <CandidateDetailSkeleton />
  };

  return (
    
       
      <main className="max-w-7xl m-auto px-4 sm:px-6 lg:px-8 py-8 ">
        {isNotesOverlayVisible && (
           
           <div 
                className="flex justify-center items-center fixed inset-0 z-50 bg-background/60 backdrop-blur-sm"
                onClick={() => setIsNotesOverlayVisible(false)}
            >
                <div 
                    className=" bg-muted rounded-lg shadow-xl w-3/4 h-4/5 p-6 relative"
                    onClick={(e) => e.stopPropagation()}
                >
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute top-4 right-4"
                        onClick={() => setIsNotesOverlayVisible(false)}
                    >
                        <X className="h-6 w-6" />
                    </Button>
                    <h2 className="text-2xl font-bold mb-4">Interview Notes & Transcript</h2>
                    <div className="h-[calc(100%-4rem)] overflow-y-auto">
                        <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed">
                            {candidate.content}
                        </pre>
                    </div>
                </div>
            </div>
        )}
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Link href="/">
                    <Button variant="ghost" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to List
                    </Button>
                </Link>
            </div>

            <div className="flex justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{candidate.candidateName}</h1>
                <p className="text-muted-foreground mt-1">{candidate.email}</p>
                
                <div className='flex items-center '>
                  <LucideFileVideo className="h-4 w-4 mr-2" />
                  <a className='underline text-primary' target="_blank" href={candidate.recordingLink}>
                     Interview Recording
                  </a>
                </div>
                 
                <div className='flex gap-2'> 
                  <Badge variant={"outline"} className={"mt-2 h-8 w-fit flex items-center justify-center"}>
                    Interviewed on {candidate.interviewDate ? new Date(candidate.interviewDate).toLocaleDateString() : 'N/A'}
                  </Badge>
                  <Badge variant={"outline"} className={"mt-2 h-8 w-fit flex items-center justify-center"}> {candidate.interviewTime} </Badge>
                </div> 
                <div className='mt-2 mb-2'>
                  <span className='text-foreground text-md text-center'>Job Position :<Badge variant={"outline"} className={" h-8 w-fit ml-1 items-center justify-center"}  > {candidate.positionMatch} </Badge></span>
                </div>
                <Badge variant={candidate.appProperties?.status === 'pass' ? "green" : candidate.appProperties?.status === 'fail' ? "destructive" : "default"} className="mt-2 h-8 w-fit flex items-center justify-center">{candidate.appProperties?.status || 'pending'}</Badge>
                
              </div>

              
              <div className='flex flex-col items-end space-y-1' >
                <div className='flex items-center'>
                  <span className='text-muted-foreground text-xs text-center mr-2'>Slack Channel</span>
                  <Badge variant={"outline"} className={"h-8 w-fit flex"}> {session?.slackChannel} </Badge>
                </div>

                <div className='w-full'>
                  {isJobLoading ? (
                    <Card className="w-full gap-0.5 p-2">
                      <CardHeader className="flex flex-row items-center justify-between">
                        <Skeleton className="h-6 w-28" /> 
                        <Skeleton className="h-3 w-3 rounded-full" /> 
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <Skeleton className="h-4 w-40" /> 
                        <Skeleton className="h-4 w-48" /> 
                      </CardContent>
                    </Card>

                  ) : job && !isEditingJob ? (
                      <Card className="w-full gap-0.5 p-2">
                          <CardHeader className="flex flex-row items-center justify-between ">
                              <CardTitle>Job Details</CardTitle>
                              <Button variant="ghost" size="icon" onClick={() => setIsEditingJob(true)}>
                                  <Pencil className="h-3 w-3" />
                              </Button>
                          </CardHeader>
                          <CardContent>
                              <p className="text-sm text-muted-foreground"><strong>Position:</strong> {job.name}</p>
                              <p className="text-sm text-muted-foreground"><strong>ClickUp Task ID:</strong> {job.clickupTaskId}</p>
                          </CardContent>
                      </Card>
                  ) : (
                      <div className="w-full space-y-2">
                          <p className="text-sm text-muted-foreground">
                              {candidate.positionMatch ? `Job not found for the candidate. Select one below.` : 'Select a job.'}
                          </p>
                          <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                  <Button variant="outline" className="w-full justify-between">
                                      <span>{job ? job.name : "Select a Job"}</span>
                                      <ChevronDown className="h-4 w-4" />
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
                {webhookResponse && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="w-full mt-2" disabled={isReevaluating}>
                        {isReevaluating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                        Re-evaluate
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
              </div>

              

            </div>
            

            <div className="grid grid-cols-1 gap-6">
                <div className="space-y-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Interview Notes & Transcript</CardTitle>
                            <Button variant="outline" size="icon" onClick={() => setIsNotesOverlayVisible(true)}>
                                <Maximize className="h-4 w-4" />
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-muted rounded-lg p-4 h-96 overflow-y-auto">
                            <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed">
                                {candidate.content}
                            </pre>
                            </div>
                        </CardContent>
                    </Card>
                    
                </div>
                <div className="space-y-6 flex">
                    <Card className={'w-full min-h-150px'}>
                        <CardHeader>
                            <CardTitle>Manager Review</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Textarea 
                                placeholder="Add your comments here..."
                                value={managerComment}
                                onChange={(e) => setManagerComment(e.target.value)}
                                className="h-[150px] w-full"
                                readOnly={!!webhookResponse}
                            />
                            <div className="space-x-2 space-y-2 flex flex-row " style={{display: webhookResponse ? 'none' : 'flex'}}>
                                <Button 
                                    onClick={() => handleStatusChange('pass')} 
                                    disabled={isSubmitting || candidate.appProperties?.status === 'pass'}
                                    className="flex-1" 
                                >
                                    {isSubmitting === 'pass' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Pass
                                </Button>
                                <Button 
                                    onClick={() => handleStatusChange('fail')} 
                                    disabled={isSubmitting || candidate.appProperties?.status === 'fail'}
                                    variant={'destructive'}
                                    className="flex-1"
                                >
                                    {isSubmitting === 'fail' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Fail
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <div>
                  {webhookResponse && (
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>AI Evaluation Summary</CardTitle>
                        {!isEditing && (
                          <Button variant="outline" size="icon" onClick={handleEdit}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {isEditing ? (
                          <>
                            {Object.entries(editedWebhookResponse).map(([key, value]) => (
                              <div key={key}>
                                <h3 className="font-semibold text-foreground capitalize">{key.replace(/_/g, ' ')}</h3>
                                <Textarea
                                  value={value}
                                  onChange={(e) => handleWebhookResponseChange(key, e.target.value)}
                                  className="mt-1 min-h-[100px]"
                                />
                              </div>
                            ))}
                            <div className="flex space-x-2 justify-end">
                              <Button variant="ghost" onClick={handleCancel} disabled={isSaving}>Cancel</Button>
                              <Button onClick={handleSave} disabled={isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save
                              </Button>
                            </div>
                          </>
                        ) : (
                          <>
                            {Object.entries(webhookResponse).map(([key, value]) => (
                              <div key={key}>
                                <h3 className="font-semibold text-foreground capitalize">{key.replace(/_/g, ' ')}</h3>
                                <p className="text-muted-foreground whitespace-pre-wrap">{value}</p>
                              </div>
                            ))}
                            <div className="space-y-2">
                              <Button
                                  onClick={handleSendToSlack}
                                  disabled={isSendingToSlack || !user.slackAccessToken}
                                  className="w-full mt-4"
                              >
                                  {isSendingToSlack ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                  Send to Slack
                              </Button>
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>  

            </div>
        </div>
      </main>
    
  );
};

export default CandidateDetailPage;
