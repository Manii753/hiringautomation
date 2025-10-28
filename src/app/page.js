'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowUp, ArrowDown, RefreshCw } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

import CandidateListSkeleton from "@/components/Skelton";
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
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [owners, setOwners] = useState([]);
  const [date, setDate] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'createdTime', direction: 'descending' });
  const router = useRouter();

  useEffect(() => {
    fetchCandidates();
  }, []);

  useEffect(() => {
    const allOwners = candidates.reduce((acc, candidate) => {
      const ownerName = candidate.owners?.[0]?.displayName;
      if (ownerName && !acc.includes(ownerName)) {
        acc.push(ownerName);
      }
      return acc;
    }, []);
    setOwners(allOwners);
  }, [candidates]);

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

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const filteredCandidates = candidates.filter(candidate => {
    const name = extractNameFromFileName(candidate.name).toLowerCase();
    const status = candidate.appProperties?.status || "pending";
    const createdDate = new Date(candidate.createdTime);
    const owner = candidate.owners?.[0]?.displayName;
    return (
      (name.includes(searchTerm.toLowerCase())) &&
      (statusFilter === "all" || status === statusFilter) &&
      (ownerFilter === "all" || owner === ownerFilter) &&
      (!date || createdDate.toDateString() === date.toDateString())
    );
  });

  const sortedCandidates = React.useMemo(() => {
    let sortableItems = [...filteredCandidates];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        let aValue;
        let bValue;

        if (sortConfig.key === 'owner') {
          aValue = a.owners?.[0]?.displayName || '';
          bValue = b.owners?.[0]?.displayName || '';
        } else {
          aValue = a[sortConfig.key];
          bValue = b[sortConfig.key];
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredCandidates, sortConfig]);

  if (loading) {
    return  <CandidateListSkeleton />;
    
  }

  return (
    <div className=" space-y-6">
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Filter by Owner</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Owner</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setOwnerFilter("all")}>All</DropdownMenuItem>
              {owners.map(owner => (
                <DropdownMenuItem key={owner} onClick={() => setOwnerFilter(owner)}>
                  {owner}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <DatePickerDemo date={date} setDate={setDate} />
          <Button
            variant="outline"
            onClick={() => fetchCandidates(true)}
            disabled={loading}
            className="flex items-center"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> Refreshing...
              </>
            ) : (
              <>
                <RefreshCw  /> 
              </>
            )}
          </Button>

        </div>
      </div>

      <Card >
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-260px)] w-full overflow-x-auto ">
            <table className=" w-full">
              <thead className="bg-gray-50 border-b sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('createdTime')}>
                    <div className="flex items-center">
                      Interview Date
                      {sortConfig.key === 'createdTime' && (sortConfig.direction === 'ascending' ? <ArrowUp className="h-4 w-4 ml-1" /> : <ArrowDown className="h-4 w-4 ml-1" />)}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Owner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedCandidates.map((candidate) => {
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
          </ScrollArea>
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
    <div className="h-full bg-gray-50">
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CandidateList />
      </main>
    </div>
  );
}
