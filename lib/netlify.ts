import type { NetlifyConnection, NetlifyStats, NetlifyUser, NetlifySiteInfo } from '@/types/netlify';
import { toast } from 'sonner';

// Initialize with stored connection or defaults
export const getInitialNetlifyConnection = (): NetlifyConnection => {
  if (typeof window !== 'undefined') {
    const storedConnection = localStorage.getItem('netlify_connection');
    if (storedConnection) {
      try {
        return JSON.parse(storedConnection);
      } catch (error) {
        console.error('Error parsing stored Netlify connection:', error);
      }
    }
  }
  
  return {
    user: null,
    token: '',
    stats: undefined,
  };
};

// Helper to persist the connection
export const persistNetlifyConnection = (connection: NetlifyConnection): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('netlify_connection', JSON.stringify(connection));
  }
};

// Update the connection with new values
export const updateNetlifyConnection = (updates: Partial<NetlifyConnection>): NetlifyConnection => {
  const currentState = getInitialNetlifyConnection();
  const newState = { ...currentState, ...updates };
  persistNetlifyConnection(newState);
  return newState;
};

// Connect to Netlify
export const connectToNetlify = async (token: string): Promise<boolean> => {
  try {
    const response = await fetch('https://api.netlify.com/api/v1/user', {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Invalid token or unauthorized');
    }

    const userData = await response.json() as NetlifyUser;
    
    // Update connection with user data
    const updatedConnection = updateNetlifyConnection({
      user: userData,
      token: token,
    });
    
    // Fetch stats for the user after connecting
    // We do this separately to avoid looping issues
    try {
      await fetchNetlifyStats(token);
    } catch (error) {
      console.error('Failed to fetch initial stats:', error);
      // Continue with the connection process even if stats fetch fails
    }
    
    toast.success('Successfully connected to Netlify');
    return true;
  } catch (error) {
    console.error('Netlify auth error:', error);
    toast.error('Failed to connect to Netlify');
    return false;
  }
};

// Disconnect from Netlify
export const disconnectFromNetlify = (): void => {
  const emptyConnection: NetlifyConnection = {
    user: null,
    token: '',
    stats: undefined,
  };
  
  persistNetlifyConnection(emptyConnection);
  toast.success('Disconnected from Netlify');
};

// Track last API call time to prevent excessive requests
let lastNetlifySitesRequestTime = 0;
const NETLIFY_API_RATE_LIMIT_MS = 5000; // 5 seconds

// Fetch Netlify sites and stats
export const fetchNetlifyStats = async (token: string): Promise<NetlifyStats | undefined> => {
  if (!token) {
    console.error('No token provided for fetching Netlify stats');
    return;
  }
  
  // Implement rate limiting to prevent excessive API calls
  const now = Date.now();
  if (now - lastNetlifySitesRequestTime < NETLIFY_API_RATE_LIMIT_MS) {
    const connection = getInitialNetlifyConnection();
    if (connection.stats) {
      console.log('Using cached Netlify stats due to rate limiting');
      return connection.stats;
    }
    
    // If we have no stats cached yet, wait to proceed
    const timeToWait = NETLIFY_API_RATE_LIMIT_MS - (now - lastNetlifySitesRequestTime);
    await new Promise(resolve => setTimeout(resolve, timeToWait));
  }

  // Update last request time
  lastNetlifySitesRequestTime = Date.now();
  
  try {
    const sitesResponse = await fetch('https://api.netlify.com/api/v1/sites', {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!sitesResponse.ok) {
      throw new Error(`Failed to fetch sites: ${sitesResponse.status}`);
    }

    const sites = await sitesResponse.json();
    
    const stats: NetlifyStats = {
      sites,
      totalSites: sites.length,
    };

    // Update the connection with stats
    updateNetlifyConnection({
      stats
    });
    
    return stats;
  } catch (error) {
    console.error('Error fetching Netlify stats:', error);
    toast.error('Failed to fetch Netlify statistics');
    return undefined;
  }
};

// Deploy project to Netlify
export interface DeployToNetlifyParams {
  files: Record<string, string>;
  projectId: string;
  siteId?: string;
  onProgress?: (progress: number) => void;
}

export interface DeployToNetlifyResult {
  success: boolean;
  deployUrl?: string;
  siteInfo?: NetlifySiteInfo;
  error?: string;
}

export const deployToNetlify = async (params: DeployToNetlifyParams): Promise<DeployToNetlifyResult> => {
  const { files, projectId, siteId, onProgress } = params;
  const connection = getInitialNetlifyConnection();
  
  if (!connection.token || !connection.user) {
    toast.error('You need to connect to Netlify first');
    return { 
      success: false, 
      error: 'Not connected to Netlify' 
    };
  }

  try {
    onProgress?.(10);
    
    // Call our API endpoint to handle the deployment
    const response = await fetch('/api/netlify/deploy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        files,
        projectId,
        siteId,
        token: connection.token,
      }),
    });

    onProgress?.(50);
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to deploy to Netlify');
    }

    onProgress?.(100);
    
    // Refresh stats after successful deployment
    // Use setTimeout to avoid blocking the UI and prevent rate limiting issues
    setTimeout(() => {
      fetchNetlifyStats(connection.token).catch(err => {
        console.error('Failed to refresh stats after deployment:', err);
      });
    }, NETLIFY_API_RATE_LIMIT_MS);
    
    toast.success('Successfully deployed to Netlify');
    
    return {
      success: true,
      deployUrl: data.deploy.url,
      siteInfo: data.site as NetlifySiteInfo,
    };
  } catch (error) {
    console.error('Netlify deployment error:', error);
    toast.error(`Deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to deploy to Netlify',
    };
  }
}; 