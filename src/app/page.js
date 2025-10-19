'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DatePickerDemo } from "@/components/ui/datepicker";

const CandidateList = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [date, setDate] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetchCandidates();
  }, []);

  function extractNameFromFileName(fileName) {
    const match = fileName.match(/Interview\s*\(([^)]+)\)/i);
    return match ? match[1].trim() : "Not found";
  }

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/drive/files');
      const data = await response.json();
      setCandidates(data);
      setLoading(false);
      
    } catch (err) {
      setLoading(false);
    }
  };

  const filteredCandidates = candidates.filter(candidate => {
    const name = extractNameFromFileName(candidate.name).toLowerCase();
    const status = candidate.appProperties?.status || "pending";
    const createdDate = new Date(candidate.createdTime);
    return (
      (name.includes(searchTerm.toLowerCase())) &&
      (statusFilter === "all" || status === statusFilter) &&
      (!date || createdDate.toDateString() === date.toDateString())
    );
  });

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
      <div className="flex items-center justify-between">
        <Input
          placeholder="Search by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Filter by Status</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setStatusFilter("all")}>All</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("pending")}>Pending</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("pass")}>Pass</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("fail")}>Fail</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DatePickerDemo date={date} setDate={setDate} />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Interview Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCandidates.map((candidate) => {
                  const status = candidate.appProperties?.status || "pending";

                  return (
                    <tr
                      key={candidate.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                        {extractNameFromFileName(candidate.name)}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {new Date(candidate.createdTime).toLocaleDateString()}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-gray-600 cursor-pointer">
                        <Tooltip>
                          <TooltipTrigger>{candidate.owners?.[0]?.displayName}</TooltipTrigger>
                          <TooltipContent>
                            <p>{candidate.owners?.[0]?.emailAddress}</p>
                          </TooltipContent>
                        </Tooltip>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          variant={status === "pass" ? "green" : status === "fail" ? "destructive" : "secondary"}
                          className={`text-center cursor-none font-medium px-3 py-1`}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </Badge>
                      </td>
                      

                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/candidate/${candidate.id}`)}
                        >
                          View Details
                        </Button>
                      </td>
                    </tr>
                  );

                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default function App() {
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
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">Hiring Manager Dashboard</h1>
              <p className="text-xs text-gray-500 mt-1">Powered by n8n Automation</p>
            </div>
            <div className="flex items-center space-x-4">
              <p className="text-sm font-medium">{session.user.name}</p>
              <img src={session.user.image} alt="Profile" className="w-8 h-8 rounded-full" />
              <Button variant="outline" onClick={() => signOut({ callbackUrl: '/login' })}>Logout</Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CandidateList />
      </main>
    </div>
  );
}
