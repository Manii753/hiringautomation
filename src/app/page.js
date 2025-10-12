'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
const CandidateList = ({ onSelectCandidate }) => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/drive/files');
      const data = await response.json();
      setCandidates(data);
      setLoading(false);
      console.log(data);
    } catch (err) {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        <p className="ml-4 text-gray-500">Fetching from Drive...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Candidates</h1>
        <p className="text-gray-500 mt-2">Review and manage interview candidates</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {candidates.map((candidate) => (
                  <tr key={candidate.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{candidate.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{new Date(candidate.createdTime).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => onSelectCandidate(candidate.id)}
                      >
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const CandidateDetail = ({ candidateId, onBack }) => {
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCandidateDetail();
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
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!candidate) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to List
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">{candidate.name}</h1>
        <p className="text-gray-500 mt-1">{candidate.email}</p>
        <p className="text-sm text-gray-400 mt-1">
          Interviewed on {new Date(candidate.interviewDate).toLocaleDateString()}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Interview Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 rounded-lg p-4 h-96 overflow-y-auto">
              <span className="text-2xl  mb-2 font-semibold text-gray-500">Summary</span>
              <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed">
                {candidate.summary}
              </pre>
              <span className="text-2xl  mb-2 font-semibold text-gray-500">Details</span>
              <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed">
                {candidate.details}
              </pre>
              <span className="text-2xl  mb-2 font-semibold text-gray-500">Next Steps</span>
              <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed">
                {candidate.nextSteps}
              </pre>

            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Interview Transcript</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 rounded-lg p-4 h-96 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed">
                {candidate.transcript}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default function App() {
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">Hiring Manager Dashboard</h1>
              <p className="text-xs text-gray-500 mt-1">Powered by n8n Automation</p>
            </div>
            <Button variant="outline" onClick={() => signOut({ callbackUrl: '/login' })}>Logout</Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {selectedCandidateId ? (
          <CandidateDetail
            candidateId={selectedCandidateId}
            onBack={() => setSelectedCandidateId(null)}
          />
        ) : (
          <CandidateList onSelectCandidate={setSelectedCandidateId} />
        )}
      </main>
    </div>
  );
}