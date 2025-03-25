'use client';

import { Search, ArrowUp, Globe, ChevronDown, CalendarDays, ArrowUpDown, Clock, BarChart2, Download, ArrowUpRight, ExternalLink, Loader2, Moon, Sun, Check, PanelTop, LogOut, User } from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardFooter } from "@/components/ui/card";
import { Icons } from '@/components/ui/icons';
import { redirect, useRouter } from 'next/navigation';
import { WebsitePreview } from '@/components/layout/WebsitePreview';
import type { ScreenshotData } from '@/types/screenshot';
import { formatUrl, generateProject, getScreenshot } from '@/utils/screenshot';
import { ProgressIndicator } from '@/components/ui/progress-indicator';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { NetlifyConnectionCard } from '@/components/ui/netlify-connection';
import { getInitialNetlifyConnection } from '@/lib/netlify';
import { Badge } from '@/components/ui/badge';
import { useSession, signOut } from '@/lib/auth-client';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

// Define Project type
interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  progress: number;
  workflowRunId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export default function Page() {
  const { data: session, isPending } = useSession();
  const userId = session?.user?.id;
  const user = session?.user;
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'browse' | 'url' | 'preview' | 'generating'>('browse');
  const [screenshotData, setScreenshotData] = useState<ScreenshotData | null>(null);
  const [userPrompt, setUserPrompt] = useState('');
  const [activeGeneration, setActiveGeneration] = useState<{
    projectId: string;
    progress: number;
    status: string;
  } | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [showDarkModeButton, setShowDarkModeButton] = useState(false);
  const [userProjects, setUserProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const router = useRouter();
  const [greeting, setGreeting] = useState("Hello, ");
  const [netlifyDialogOpen, setNetlifyDialogOpen] = useState(false);
  const [netlifyConnection, setNetlifyConnection] = useState(() => {
    if (typeof window !== 'undefined') {
      return getInitialNetlifyConnection();
    }
    return { user: null, token: '', stats: undefined };
  });

  // if (!session?.user) {
  //   redirect('/auth/login')
  // }

  // Redirect if user is not authenticated
  // useEffect(() => {
  //   if (!isPending && !userId) {
  //     redirect('/auth/login');
  //   }
  // }, [isPending, userId]);

  // Add this useEffect to change the greeting after initial render
  useEffect(() => {
    const greetings = [
      "Howdy, ",
      "Good to see you, ",
      "Hello, ",
      "Hi, ",
      "Greetings, ",
      "Nice to see you again, ",
      "Welcome back, ",
      "How's it going, ",
      "What's up, ",
      "Hey, ",
    ];
    
    // Get a random greeting from the array
    const randomIndex = Math.floor(Math.random() * greetings.length);
    setGreeting(greetings[randomIndex]);
  }, []);

  // Fetch user projects when user ID is available
  useEffect(() => {
    async function fetchUserProjects() {
      if (!userId) return;
      
      setProjectsLoading(true);
      try {
        // Use our project utility that handles authentication
        const response = await fetch(`/api/projects?userId=${userId}`);
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        
        const data = await response.json();
        setUserProjects(data);
      } catch (error) {
        console.error("Error fetching projects:", error);
        toast.error("Failed to load projects");
      } finally {
        setProjectsLoading(false);
      }
    }

    fetchUserProjects();
  }, [userId]);

  // Add an effect to refresh Netlify connection state when dialog closes
  useEffect(() => {
    if (!netlifyDialogOpen && typeof window !== 'undefined') {
      setNetlifyConnection(getInitialNetlifyConnection());
    }
  }, [netlifyDialogOpen]);

  // Extract domain from URL for display
  const extractDomain = (url: string) => {
    try {
      // Remove protocol if present
      let domain = url.replace(/https?:\/\//i, '');
      // Remove path if present
      domain = domain.split('/')[0];
      return domain;
    } catch (error) {
      return url;
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'text-green-500';
      case 'failed':
        return 'text-red-500';
      case 'pending':
        return 'text-amber-500';
      default:
        return 'text-muted-foreground';
    }
  };

  // Get URL from project name
  const getUrlFromName = (name: string) => {
    const match = name.match(/Clone of (https?:\/\/[^\s]+) on/);
    return match ? match[1] : extractDomain(name);
  };

  async function handleUrlSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await getScreenshot(inputValue, darkMode);
      setScreenshotData(data);
      setStep('preview');
    } catch (error) {
      setError(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleLooksGood() {
    if (!screenshotData || !userPrompt) {
      toast.error("Missing screenshot data or prompt");
      return;
    }
    
    setStep('generating');
    setLoading(true);
    
    try {
      // Generate project using userId from session
      const formattedUrl = formatUrl(screenshotData.originalUrl);
      const result = await generateProject(
        screenshotData, 
        formattedUrl, 
        userPrompt, 
        userId || undefined
      );
      
      if (result.projectId) {
        setActiveGeneration({ projectId: result.projectId, progress: 0, status: 'pending' });
        setStep('browse');
        
        // Refresh projects after a short delay to include the new one
        setTimeout(async () => {
          try {
            const response = await fetch('/api/projects');
            if (response.ok) {
              const data = await response.json();
              setUserProjects(data);
            }
          } catch (err) {
            console.error('Error refreshing projects:', err);
          }
        }, 2000);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const openUserProfile = () => {
    toast("User settings not available");
  };

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/';  // Redirect to home after sign out
  };

  const handleGetGreeting = () => {
    // Return the greeting from state
    return greeting;
  }

  // Update the URL input form to show disabled state
  const isInputDisabled = activeGeneration?.status !== 'completed' && activeGeneration !== null;

  // Render preview step
  if (step === 'preview' && screenshotData) {
    return (
      <WebsitePreview
        screenshotData={screenshotData}
        userPrompt={userPrompt}
        onUserPromptChange={setUserPrompt}
        onBack={() => setStep('browse')}
        onContinue={handleLooksGood}
        loading={loading}
        error={error}
      />
    );
  }

  // Return other steps (browse, url)
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Refined Navigation */}
      <nav className="fixed top-0 w-full z-40 border-b border-border/10 backdrop-blur-md bg-background/50">
        <div className="flex items-center justify-between h-16 px-6 max-w-7xl mx-auto">
          <a className="flex items-center space-x-2 opacity-90 hover:opacity-100 transition-opacity" href="/">
            <Icons.logo className="w-8 h-8" />
          </a>
          
          <div className="flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="h-9 w-9 rounded-full overflow-hidden hover:ring-2 hover:ring-primary cursor-pointer transition-all">
                  {user?.image ? (
                    <Image src={user.image} alt="Profile" width={36} height={36} />
                  ) : (
                    <Avatar>
                      <AvatarFallback className="bg-primary/10">
                        <span className="text-xs font-medium text-primary">
                          {user?.name?.charAt(0) || 'U'}
                        </span>
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={openUserProfile}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setNetlifyDialogOpen(true)}>
                  <Icons.netlify className="mr-2 h-4 w-4 text-[#00AD9F]" />
                  <span>{netlifyConnection.user ? 'Netlify' : 'Connect to Netlify'}</span>
                  {netlifyConnection.user && (
                    <Badge variant="outline" className="ml-auto text-xs py-0 px-1.5 h-5 bg-green-500/10 text-green-500 border-green-200/50">
                      {netlifyConnection.stats?.totalSites || 0} Sites
                    </Badge>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>

      <Dialog open={netlifyDialogOpen} onOpenChange={setNetlifyDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <NetlifyConnectionCard />
        </DialogContent>
      </Dialog>

      <main className="pt-16">
        {step === 'browse' && (
          <>
            {/* Hero Section */}
            <section className="min-h-[90vh] flex items-center justify-center px-6">
              <div className="max-w-2xl w-full space-y-10">
                <div className="text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  {loading || !isPending ? (
                    <div className="flex items-center justify-center gap-2">
                      <Skeleton className="h-6 w-40 rounded-md" />
                    </div>
                  ) : (
                    <p className="text-muted-foreground flex items-center justify-center gap-2">
                      {handleGetGreeting()}
                      <span className="h-6 w-6 rounded-full overflow-hidden inline-flex items-center justify-center">
                        {user?.image ? (
                          <Image src={user.image} alt="Profile" width={24} height={24} />
                        ) : (
                          <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                            <span className="text-xs font-medium text-primary">
                              {user?.name?.charAt(0) || 'U'}
                            </span>
                          </div>
                        )}
                      </span>
                      {user?.name || user?.email}
                    </p>
                  )}
                  <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
                    Enter a website URL
                  </h1>
                  <p className="text-xl text-muted-foreground">
                    Clone any website in seconds
                  </p>
                </div>

                {/* Enhanced URL Input */}
                <form onSubmit={(e) => {
                  e.preventDefault();
                  handleUrlSubmit(e);
                }} className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
                  <div className="relative group">
                    <div className="relative overflow-hidden rounded-2xl bg-card/40 backdrop-blur-sm border border-border/40 
                      shadow-lg ring-1 ring-border/5 group-hover:border-primary/30 group-hover:bg-card/60 transition duration-300">
                      <div className="flex items-center px-5 py-4 gap-3">
                        <Globe className="h-5 w-5 text-muted-foreground" />
                        <span className="text-muted-foreground font-medium">https://</span>
                        <input
                          type="text"
                          value={inputValue}
                          onChange={(e) => {
                            setInputValue(e.target.value);
                            // Hide the dark mode button when typing
                            setShowDarkModeButton(false);
                          }}
                          placeholder={isInputDisabled ? "Please wait for current generation to complete..." : "example.com"}
                          disabled={isInputDisabled || loading}
                          className="flex-1 bg-transparent border-none focus:outline-none text-lg placeholder:text-muted-foreground/40 ml-[-0.6rem] disabled:opacity-50"
                          onFocus={() => {
                            setIsInputFocused(true);
                            setShowDarkModeButton(true);
                          }}
                          onBlur={() => {
                            setIsInputFocused(false);
                            // Don't hide the button immediately
                          }}
                        />
                        <button 
                          type="submit"
                          disabled={!inputValue || loading || isInputDisabled}
                          className={`rounded-xl px-5 py-2.5 font-medium transition-all duration-300 ${
                            inputValue && !loading && !isInputDisabled
                              ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                              : 'bg-muted/50 text-muted-foreground cursor-not-allowed'
                          }`}
                        >
                          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="h-14 flex justify-center mt-4">
                    <div className={`transition-all duration-300 ${showDarkModeButton ? 'opacity-100 transform-none' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
                      <button 
                        type="button" 
                        onClick={(e) => {
                          e.preventDefault();
                          setDarkMode(!darkMode);
                        }}
                        onMouseLeave={() => {
                          // Only hide the button if the input is not focused
                          if (!isInputFocused) {
                            setShowDarkModeButton(false);
                          }
                        }}
                        className="px-3 py-1.5 text-xs font-medium rounded-full border transition-all duration-200 
                          border-black/10 dark:border-white/10 bg-white dark:bg-white/5 
                          hover:bg-black/5 dark:hover:bg-white/15 flex-shrink-0
                          shadow-[0_2px_10px_rgba(0,0,0,0.1)] dark:shadow-[0_2px_10px_rgba(255,255,255,0.1)]"
                      >
                        <div className="flex items-center gap-1.5">
                          {darkMode ? (
                            <Moon className="h-4 w-4 text-indigo-500" />
                          ) : (
                            <Sun className="h-4 w-4 text-amber-500" />
                          )}
                          <span className="text-black/70 dark:text-white/70 whitespace-nowrap">
                            {darkMode ? "Dark Mode" : "Light Mode"}
                          </span>
                        </div>
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </section>

            {/* Recent Projects Section */}
            <section className="py-24 px-6 bg-gradient-to-b from-background to-muted/20">
              <div className="max-w-7xl mx-auto space-y-12">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                  <div className="space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">
                      Your Projects
                    </h2>
                    <p className="text-base text-muted-foreground max-w-md">
                      Clones you&apos;ve created
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" className="h-9 px-4 hover:bg-primary hover:text-primary-foreground">
                      <CalendarDays className="mr-2 h-4 w-4" />
                      Last 30 days
                    </Button>
                    <Button variant="outline" size="sm" className="h-9 px-4 hover:bg-primary hover:text-primary-foreground">
                      <ArrowUpDown className="mr-2 h-4 w-4" />
                      Sort by
                    </Button>
                  </div>
                </div>
                
                {/* Project Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {projectsLoading ? (
                    // Loading state
                    Array.from({ length: 3 }).map((_, index) => (
                      <Card 
                        key={`loading-${index}`} 
                        className="group relative overflow-hidden border-border/40 animate-pulse"
                      >
                        <CardHeader className="p-0">
                          <div className="relative h-52 bg-gradient-to-br from-muted/50 to-muted/70">
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Loader2 className="w-10 h-10 animate-spin text-muted-foreground/30" />
                            </div>
                          </div>
                        </CardHeader>
                        <CardFooter className="p-6 pt-0 flex flex-col gap-3 mt-5">
                          <div className="h-9 w-full bg-muted/50 rounded-md"></div>
                          <div className="h-9 w-full bg-muted/30 rounded-md"></div>
                        </CardFooter>
                      </Card>
                    ))
                  ) : userProjects.length > 0 ? (
                    // User projects
                    userProjects.map((project) => (
                      <Card 
                        key={project.id} 
                        className={`group relative overflow-hidden border-border/40 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-500 ${
                          project.status === 'failed' ? 'border-red-200/40' : ''
                        }`}
                      >
                        <CardHeader className="p-0">
                          <div className="relative h-52 bg-gradient-to-br from-primary/5 to-primary/10">
                            <div className="absolute inset-0 flex items-center justify-center opacity-10 group-hover:scale-110 transition-transform duration-500">
                            <PanelTop className="w-32 h-32" />
                            </div>
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 backdrop-blur-sm">
                              <div className="flex items-center gap-2 mb-2">
                                <Globe className="w-5 h-5 text-primary" />
                                <span className="text-xl font-semibold text-foreground/90 truncate max-w-[200px]">
                                  {extractDomain(getUrlFromName(project.name))}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="w-4 h-4" />
                                <time>
                                  {formatDate(project.createdAt)}
                                </time>
                              </div>
                              <div className={`mt-3 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)} bg-background/80 flex items-center justify-center gap-1`}>
                                {project.status === 'completed' ? (
                                  <>
                                    <span>{project.status.charAt(0).toUpperCase() + project.status.slice(1)}</span>
                                    <Check className="w-3 h-3 inline-block" />
                                  </>
                                ) : (
                                  <span>{project.status.charAt(0).toUpperCase() + project.status.slice(1)}</span>
                                )}
                                {project.status === 'pending' && (
                                  <span className="ml-1 inline-block w-2 h-2 rounded-full bg-current animate-pulse"></span>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardFooter className="p-6 pt-0 flex flex-col gap-3 mt-5">
                          <Button 
                            className="w-full" 
                            variant="default"
                            disabled={project.status !== 'completed'}
                            onClick={() => router.push(`/dashboard/clone/${project.id}`)}
                          >
                            Open
                            <ExternalLink className="h-4 w-4 ml-2" />
                          </Button>
                          <Button 
                            className="w-full hover:bg-secondary/80" 
                            variant="secondary"
                            disabled={project.status !== 'completed'}
                          >
                            Download
                            <Download className="h-4 w-4 ml-2" />
                          </Button>
                        </CardFooter>
                      </Card>
                    ))
                  ) : (
                    // No projects
                    <div className="col-span-3 flex flex-col items-center justify-center py-12 text-center">
                      <div className="rounded-full bg-muted/30 p-4 mb-4">
                        <Globe className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-medium mb-2">No projects yet</h3>
                      <p className="text-muted-foreground max-w-md">
                        Enter a website URL above to create your first clone project
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </>
        )}

        {/* Add this component to the main browse view, just before the closing </main> */}
        {activeGeneration && (
          <div className="fixed bottom-6 right-6 z-50">
            <div className="bg-card border border-border rounded-lg shadow-lg p-4 w-80">
              <ProgressIndicator 
                projectId={activeGeneration.projectId}
                onComplete={(projectId) => {
                  router.push(`/dashboard/clone/${projectId}`);
                  setActiveGeneration(null);
                }}
                minimal={true}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}