'use client';

import React, { useState, useEffect } from 'react';
import { toast } from "sonner";
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from "@/components/ui/badge";
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft,  FileVideo,  Loader2, LucideFileVideo, Pencil } from 'lucide-react';
import Link from 'next/link';
import CandidateDetailSkeleton from '@/components/candidateSkelton';

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


  useEffect(() => {
    const fetchUser = async () => {
      if (session) {
        const response = await fetch('/api/user');
        const userData = await response.json();
        setUser(userData);
        if (userData.slackChannel) {
          setSlackChannel(userData.slackChannel);
        }
      }
    };
    fetchUser();
  }, [session]);

  const fetchCandidateDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/drive/file/${candidateId}`);
      const data = await response.json();
      setCandidate(data);
      if (data.webhookResponse) {
        setWebhookResponse(data.webhookResponse);
        setEditedWebhookResponse(data.webhookResponse);
      }
      if (data.managerComment) {
        setManagerComment(data.managerComment);
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
        setCandidate(prev => ({...prev, status: status}));
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
        body: JSON.stringify({ webhookResponse, candidate ,candidateId ,slackChannel }),
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


  if (loading || !candidate) {
      return <CandidateDetailSkeleton />
  };

  return (
    
       
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                <p className="text-gray-500 mt-1">{candidate.email}</p>
                
                <div className='flex items-center '>
                  <LucideFileVideo className="h-4 w-4 mr-2" />
                  <a className='underline text-blue-500' target="_blank" href={candidate.recordingLink}>
                     Interview Recording
                  </a>
                </div>
                 
                <div className='flex gap-2'> 
                  <Badge variant={"outline"} className={"mt-2 h-8 w-fit flex items-center justify-center"}>
                    Interviewed on {candidate.interviewDate ? new Date(candidate.interviewDate).toLocaleDateString() : 'N/A'}
                  </Badge>
                  <Badge variant={"outline"} className={"mt-2 h-8 w-fit flex items-center justify-center"}> {candidate.interviewTime} </Badge>
                </div> 
                <Badge variant={candidate.appProperties?.status === 'pass' ? "green" : candidate.appProperties?.status === 'fail' ? "destructive" : "default"} className="mt-2 h-8 w-fit flex items-center justify-center">{candidate.appProperties?.status || 'pending'}</Badge>
                
              </div>

              
              <div className='flex' >
                <span className='text-gray-500 text-xs text-center mt-2 mr-2'>Slack Channel</span>
                <Badge variant={"outline"} className={"h-8 w-fit flex"}> {user.slackChannel} </Badge>
              </div>

              

            </div>
            

            <div className="grid grid-cols-1 gap-6">
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Interview Notes & Transcript</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-gray-50 rounded-lg p-4 h-96 overflow-y-auto">
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
                            />
                            <div className="space-x-2 space-y-2 flex flex-row " style={{display: webhookResponse ? 'none' : 'flex flex-row'}}>
                                <Button 
                                    onClick={() => handleStatusChange('pass')} 
                                    disabled={isSubmitting || candidate.status === 'pass'}
                                    variant={candidate.status === 'pass' ? 'green' : 'green'}
                                    className="flex-1" 
                                >
                                    {isSubmitting === 'pass' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Pass
                                </Button>
                                <Button 
                                    onClick={() => handleStatusChange('fail')} 
                                    
                                    disabled={isSubmitting || candidate.status === 'fail'}
                                    variant={candidate.status === 'fail' ? 'destructive' : 'red'}
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
                                <h3 className="font-semibold text-gray-800 capitalize">{key.replace(/_/g, ' ')}</h3>
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
                                <h3 className="font-semibold text-gray-800 capitalize">{key.replace(/_/g, ' ')}</h3>
                                <p className="text-gray-600 whitespace-pre-wrap">{value}</p>
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
