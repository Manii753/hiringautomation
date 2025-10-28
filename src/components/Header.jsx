'use client';

import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
import { Menu, AlertTriangle, Check, LogOut } from 'lucide-react';
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




const Header = () => {
  const { data: session, status, update } = useSession();
  const pathname = usePathname();
  const [showSlackChannelDialog, setShowSlackChannelDialog] = useState(false);
  const [slackChannelName, setSlackChannelName] = useState(session?.user?.slackChannel || '');

  // 🔹 Hide Header on /login page
  if (pathname === '/login') return null;
  

  const [isSlackConnected,setSlackConnected]=useState(false);
  const candidateId = pathname.startsWith('/candidate/') ? pathname.split('/')[2] : 'home';

  
  useEffect(() => {
  const fetchUser = async () => {
    if (session) {
      const response = await fetch('/api/user');
      const userData = await response.json();
      
      if (userData.slackAccessToken) {
        setSlackConnected(true);
        
      }
      if (userData.slackChannel) {
        setSlackChannelName(userData.slackChannel);
      }
    }
  };
  fetchUser();
  }, [session]);

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
        await update(); // Refresh the session
        setShowSlackChannelDialog(false);
      } else {
        console.error('Failed to update Slack channel');
      }
    } catch (error) {
      console.error('Error updating Slack channel:', error);
    }
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/">
              <h1 className="text-xl cursor-pointer font-semibold">
                Hiring Manager Dashboard
              </h1>
            </Link>
            <p className="text-xs text-gray-500 mt-1">
              Powered by n8n Automation
            </p>
          </div>

          {status === 'authenticated' && session?.user && (
            <div className="flex items-center space-x-4">
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
                          <img src="/slack.png" alt="Slack" className="w-4 h-4 mr-2" />
                          Slack
                          <AlertTriangle className="w-4 h-4 ml-2 mr-2 text-yellow-500" />
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
                          <span className="px-3 text-gray-600 font-medium">#</span>
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
                  <DropdownMenuItem>
                      <div className='flex items-center w-full justify-between cursor-pointer'>
                        <div className='flex items-center justify-center'>
                          <img src="/ClickUpp.png" alt="ClickUp" className="w-5.5 h-5.5 mr-1 bg-transparent -translate-x-1" />
                          ClickUP
                        </div>
                        <Check className="w-4 h-4 ml-2 text-green-500" />
                      </div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
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
