'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from "@/components/ui/badge"
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft,  Loader2 } from 'lucide-react';
import Link from 'next/link';

const CandidateDetailPage = () => {
  const params = useParams();
  const candidateId = params.id;
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [managerComment, setManagerComment] = useState('');
  const [webhookResponse, setWebhookResponse] = useState(null);
  const [isSendingToSlack, setIsSendingToSlack] = useState(false);
  

  function CandidateSummary({ data }) {
    const formatValue = (value) => {
      if (Array.isArray(value)) {
        return value.join(" "); // join all array items into one paragraph
      }
      if (typeof value === "object" && value !== null) {
        return JSON.stringify(value); // fallback for nested objects
      }
      return value?.toString() || "";
    };

    return (
      <Card className="max-w-3xl mx-auto shadow-sm border rounded-2xl">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-800">
            Candidate Analysis
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4 text-gray-700 leading-relaxed">
          {Object.entries(data).map(([key, value]) => (
            <p key={key}>
              <span className="font-semibold capitalize">{key}:</span>{" "}
              {formatValue(value)}
            </p>
          ))}
        </CardContent>
      </Card>
    );
  }
  const fetchCandidateDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/drive/file/${candidateId}`);
      const data = await response.json();
      setCandidate(data);
      if (data.webhookResponse) {
        setWebhookResponse(data.webhookResponse);
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
    try {
      // TODO: Replace with your n8n Slack webhook URL
      
      const response = await fetch('https://autoscalev.app.n8n.cloud/webhook-test/8875d6ed-3bbb-49a7-b16e-9740f161a395', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({webhookResponse, candidate}),
      });

      if (response.ok) {
        alert('Successfully sent to Slack!');
      } else {
        alert('Failed to send to Slack.');
        console.error('Failed to send to Slack');
      }
    } catch (error) {
      alert('Failed to send to Slack.');
      console.error('Error sending to Slack:', error);
    }
    setIsSendingToSlack(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!candidate) {
      return (
        <div className="flex items-center justify-center h-screen">
            <p>Candidate not found.</p>
        </div>
      )
  };

  return (
    <div className="min-h-screen bg-gray-50">
       <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">Hiring Manager Dashboard</h1>
              <p className="text-xs text-gray-500 mt-1">Powered by n8n Automation</p>
            </div>
            <Link href="/">
                <Button variant="outline">Back to list</Button>
            </Link>
          </div>
        </div>
      </header>
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

            <div>
                <h1 className="text-3xl font-bold tracking-tight">{candidate.candidateName}</h1>
                <p className="text-gray-500 mt-1">{candidate.email}</p>
                <div className='flex gap-2'> 
                  <Badge variant={"outline"} className={"mt-2 h-8 w-fit flex items-center justify-center"}>
                    Interviewed on {candidate.interviewDate ? new Date(candidate.interviewDate).toLocaleDateString() : 'N/A'}
                  </Badge>
                  <Badge variant={"outline"} className={"mt-2 h-8 w-fit flex items-center justify-center"}> {candidate.interviewTime} </Badge>
                </div> 
                <Badge variant={candidate.appProperties?.status === 'pass' ? "green" : candidate.appProperties?.status === 'fail' ? "destructive" : "default"} className="mt-2 h-8 w-fit flex items-center justify-center">{candidate.appProperties?.status || 'pending'}</Badge>
                
            </div>

            <div className="grid grid-cols-1 gap-6">
                <div className="lg:col-span-2 space-y-6">
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
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Manager Review</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Textarea 
                                placeholder="Add your comments here..."
                                value={managerComment}
                                onChange={(e) => setManagerComment(e.target.value)}
                                className="min-h-[150px]"
                            />
                            <div className="space-x-2 space-y-2" style={{display: webhookResponse ? 'none' : 'flex'}}>
                                <Button 
                                    onClick={() => handleStatusChange('pass')} 
                                    disabled={isSubmitting || candidate.status === 'pass'}
                                    variant={candidate.status === 'pass' ? 'default' : 'outline'}
                                    className="w-full"
                                >
                                    {isSubmitting === 'pass' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Pass
                                </Button>
                                <Button 
                                    onClick={() => handleStatusChange('fail')} 
                                    disabled={isSubmitting || candidate.status === 'fail'}
                                    variant={candidate.status === 'fail' ? 'destructive' : 'outline'}
                                    className="w-full"
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
                      <CardHeader>
                        <CardTitle>AI Evaluation Summary</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {Object.entries(webhookResponse).map(([key, value]) => (
                          <div key={key}>
                            <h3 className="font-semibold text-gray-800">{key}</h3>
                            <p className="text-gray-600">{value}</p>
                          </div>
                        ))}
                        <Button
                            onClick={handleSendToSlack}
                            disabled={isSendingToSlack}
                            className="w-full mt-4"
                        >
                            {isSendingToSlack ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Send to Slack
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>  

            </div>
        </div>
      </main>
    </div>
  );
};

export default CandidateDetailPage;
