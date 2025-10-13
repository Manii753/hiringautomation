'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

const CandidateDetailPage = () => {
  const params = useParams();
  const candidateId = params.id;
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (candidateId) {
      fetchCandidateDetail();
    }
  }, [candidateId]);

  const fetchCandidateDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/drive/file/${candidateId}`);
      const data = await response.json();
      setCandidate(data);
      setLoading(false);
      console.log(data);
    } catch (err) {
      setLoading(false);
    }
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
                <h1 className="text-3xl font-bold tracking-tight">{candidate.name}</h1>
                <p className="text-gray-500 mt-1">{candidate.email}</p>
                <p className="text-sm text-gray-400 mt-1">
                  Interviewed on {candidate.interviewDate ? new Date(candidate.interviewDate).toLocaleDateString() : 'N/A'}
                </p>
            </div>

            <div className="grid grid-cols-1 gap-6">
            
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
        </div>
      </main>
    </div>
  );
};

export default CandidateDetailPage;
