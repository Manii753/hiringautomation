'use client';

import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from './ui/badge';
import { Menu, AlertTriangle, Check, LogOut, Briefcase } from 'lucide-react';
import {useEffect, useState } from 'react';
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
import { ThemeToggle } from './ThemeToggle';



import { toast } from 'sonner';


const Header = () => {
  
  const { data: session, status, update } = useSession();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [showSlackChannelDialog, setShowSlackChannelDialog] = useState(false);
  const [slackChannelName, setSlackChannelName] = useState(session?.user?.slackChannel || '');
  const [showClickUpTokenDialog, setShowClickUpTokenDialog] = useState(false);
  const [clickUpAccessToken, setClickUpAccessToken] = useState(session?.user?.clickUpAccessToken || '');
  const [clickUpUserInfo, setClickUpUserInfo] = useState(null);
  const [clickUpConnectionStatus, setClickUpConnectionStatus] = useState('');
  const [isSlackConnected,setSlackConnected]=useState(false);
  const [isClickUpConnected, setIsClickUpConnected] = useState(false);
  const candidateId = pathname.startsWith('/candidate/') ? pathname.split('/')[2] : 'home';

    useEffect(() => {
    const refreshSessionAfterOAuth = async () => {
      
      const oauthSuccess = searchParams.get('oauth') === 'success';
      
      if (oauthSuccess && status === 'authenticated') {
        
        
        // Show a loading toast
        toast.loading('Updating connection status...');
        
        try {
          await update();
          toast.dismiss();
          toast.success('Connection updated successfully!');
        } catch (error) {
          toast.dismiss();
          toast.error('Failed to update session');
          console.error('Error updating session:', error);
        }
        
        // Clean up URL parameters
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('oauth');
        window.history.replaceState({}, '', newUrl.toString());
      }
    };

    refreshSessionAfterOAuth();
  }, [searchParams, status, update]);
  useEffect(() => {
  
    if (session) {
      
      if (session?.user?.slackAccessToken) {
        setSlackConnected(true);
        
      }
      if (session.slackChannel) {
        setSlackChannelName(session.slackChannel);
      }
      if (session?.user?.clickUpAccessToken) {
        setIsClickUpConnected(true);
        setClickUpAccessToken(session.user.clickUpAccessToken);
        verifyClickUpToken(session.user.clickUpAccessToken);
      }
    }
  
  }, [session]);

  const verifyClickUpToken = async (token) => {
    if (!token) {
      setClickUpConnectionStatus('Please enter a ClickUp access token.');
      setClickUpUserInfo(null);
      return false;
    }
    try {
      const response = await fetch('https://api.clickup.com/api/v2/user', {
        headers: {
          'Authorization': token,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setClickUpUserInfo(data.user);
        setClickUpConnectionStatus('Connected to ClickUp successfully!');
        
        return true;
      } else {
        const errorData = await response.json();
        setClickUpUserInfo(null);
        setClickUpConnectionStatus(`Failed to connect to ClickUp: ${errorData.err}`);
        toast.error(`Failed to verify ClickUp token: ${errorData.err}`);
        return false;
      }
    } catch (error) {
      setClickUpUserInfo(null);
      setClickUpConnectionStatus(`Error connecting to ClickUp: ${error.message}`);
      toast.error(`Error verifying ClickUp token: ${error.message}`);
      return false;
    }
  };

  const handleSaveSlackChannel = async () => {
    try {
      const response = await fetch('/api/user/slack-channel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ slackChannel: slackChannelName }),
      });

      if (response.ok) {
        
        setShowSlackChannelDialog(false);
        await update();
      } else {
        console.error('Failed to update Slack channel');
      }
    } catch (error) {
      console.error('Error updating Slack channel:', error);
    }
  };

  const handleSaveClickUpToken = async () => {
    try {
      const response = await fetch('/api/user/clickup-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clickUpAccessToken: clickUpAccessToken }),
      });

      if (response.ok) {
        const isVerified = await verifyClickUpToken(clickUpAccessToken);
        if (isVerified) {
          setIsClickUpConnected(true);
          setShowClickUpTokenDialog(false);

        }
        await update();
      } else {
        console.error('Failed to update ClickUp access token');
        toast.error('Failed to save ClickUp access token to backend.');
      }
    } catch (error) {
      console.error('Error updating ClickUp access token:', error);
      toast.error(`Error saving ClickUp access token: ${error.message}`);
    }
  };

  const handleTestClickUpConnection = async () => {
    await verifyClickUpToken(clickUpAccessToken);
  };

  const handleEditClickUpToken = () => {
    setIsClickUpConnected(false); // Allow editing
    setClickUpUserInfo(null);
    setClickUpConnectionStatus('');
  };

  return (
    <header className="bg-background border-b">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <h1 className="text-xl cursor-pointer font-semibold">
                Hiring Manager Dashboard
              </h1>
            </Link>
            <p className="text-xs text-muted-foreground mt-1">
              Powered by n8n Automation
            </p>
          </div>

          {status === 'authenticated' && session?.user && (
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <DropdownMenu>
                
                  <div className="flex items-center space-x-4 ">
                    <Badge variant="outline" className="text-sm font-medium">{session.user.name}</Badge>
                    <img
                      src={session.user.image}
                      alt="Profile"
                      className="w-8 h-8 rounded-full"
                    />
                    <DropdownMenuTrigger asChild>
                      <Menu className="w-5 h-5"></Menu>
                    </DropdownMenuTrigger>
                  </div>
                
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <AlertDialog open={showSlackChannelDialog} onOpenChange={setShowSlackChannelDialog}>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      {!isSlackConnected ? (
                        
                        <Link href={`/api/auth/slack?candidateId=${candidateId}`} className='flex items-center w-full justify-between'>
                          <div className='flex items-center'>
                            <img src="/slack.png" alt="Slack" className="w-4 h-4 mr-3" />
                            Slack
                          </div>
                          <AlertTriangle className="w-4 h-4 ml-2 text-yellow-500" />
                        </Link>
                      ) : (
                        <AlertDialogTrigger asChild>
                          <div className='flex items-center w-full justify-between cursor-pointer'>
                            <div className='flex items-center justify-center'>
                              <img src="/Slack.png" alt="Slack" className="w-4 h-4 mr-3" />
                              Slack
                            </div>
                            <Badge variant="green" className="text-[9px]">Connected</Badge>
                          </div>
                        </AlertDialogTrigger>
                      )}
                    </DropdownMenuItem>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Set Slack Channel</AlertDialogTitle>
                        <AlertDialogDescription>
                          Enter the default Slack channel name where you want to send notifications.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                       <div className="flex items-center border rounded-lg overflow-hidden">
                          <span className="px-3 text-muted-foreground font-medium">#</span>
                          <Separator orientation="vertical" className="h-6" />
                          <Input
                            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 "
                            placeholder="your-channel-name"
                            value={slackChannelName}
                            onChange={(e) => setSlackChannelName(e.target.value)}
                          />
                        </div>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleSaveSlackChannel}>Save</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <AlertDialog open={showClickUpTokenDialog} onOpenChange={setShowClickUpTokenDialog}>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      {!isClickUpConnected ? (
                        <AlertDialogTrigger asChild>
                          <div className='flex items-center w-full justify-between cursor-pointer'>
                            <div className='flex items-center justify-center'>
                              <img src="/ClickUpp.png" alt="ClickUp" className="w-5.5 h-5.5 mr-1 bg-transparent -translate-x-1" />
                              ClickUP
                            </div>
                            <AlertTriangle className="w-4 h-4 ml-2 text-yellow-500" />
                          </div>
                        </AlertDialogTrigger>
                      ) : (
                        <AlertDialogTrigger asChild>
                          <div className='flex items-center w-full justify-between cursor-pointer'>
                            <div className='flex items-center justify-center'>
                              <img src="/ClickUpp.png" alt="ClickUp" className="w-5.5 h-5.5 mr-1 bg-transparent -translate-x-1" />
                              ClickUP
                            </div>
                            <Badge variant="green" className="text-[9px]">Connected</Badge>
                          </div>
                        </AlertDialogTrigger>
                      )}
                    </DropdownMenuItem>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Set ClickUp Access Token</AlertDialogTitle>
                        <AlertDialogDescription>
                          Enter your ClickUp personal access token. This token will be stored securely.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="flex flex-col space-y-4">
                        <Input
                          className="border rounded-lg p-2"
                          placeholder="ClickUp Access Token"
                          type="password"
                          value={clickUpAccessToken}
                          onChange={(e) => setClickUpAccessToken(e.target.value)}
                          disabled={isClickUpConnected}
                        />
                        {clickUpConnectionStatus && (
                          <p className={`text-sm ${clickUpConnectionStatus.includes('successfully') ? 'text-green-500' : 'text-red-500'}`}>
                            {clickUpConnectionStatus}
                          </p>
                        )}
                        {clickUpUserInfo && (
                          <div className="text-sm">
                            <p><strong>User ID:</strong> {clickUpUserInfo.id}</p>
                            <p><strong>Username:</strong> {clickUpUserInfo.username}</p>
                            <p><strong>Email:</strong> {clickUpUserInfo.email}</p>
                          </div>
                        )}
                      </div>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        {!isClickUpConnected && (
                          <>
                            <Button variant="outline" onClick={handleTestClickUpConnection}>Test Connection</Button>
                            <AlertDialogAction onClick={handleSaveClickUpToken}>Save</AlertDialogAction>
                          </>
                        )}
                        {isClickUpConnected && (
                          <Button variant="outline" onClick={handleEditClickUpToken}>Edit Token</Button>
                        )}
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Link href="/jobs" className='flex items-center w-full'>
                      <div className='flex items-center w-full cursor-pointer'>
                        <Briefcase className='mr-2 h-4 w-4'/>
                        <span className=''>Jobs</span>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => signOut({ callbackUrl: '/login' })}>
                    <div className='flex justify-center items-center'>
                      <LogOut className='mr-2'/>
                      <span className='-translate-y-0.5'>Logout</span>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
