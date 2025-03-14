import { ScreenshotData } from '@/types/screenshot';

export const formatUrl = (url: string): string => {
  if (!url) return '';
  
  // Remove leading/trailing whitespace
  let cleanUrl = url.trim();
  
  // Check if URL already has a protocol
  if (!cleanUrl.match(/^https?:\/\//i)) {
    // No protocol found, add https://
    cleanUrl = `https://${cleanUrl}`;
  }
  
  // Remove any double slashes (except after protocol)
  cleanUrl = cleanUrl.replace(/([^:]\/)\/+/g, '$1');
  
  // Remove trailing slashes
  cleanUrl = cleanUrl.replace(/\/+$/, '');
  
  return cleanUrl;
};

export const generateProject = async (
  screenshotData: ScreenshotData,
  formattedUrl: string,
  userPrompt: string,
  userId?: string
): Promise<{ projectId: string; workflowRunId?: string }> => {
  // Get HTML
  const htmlRes = await fetch("/api/getSiteHTML", {
    method: "POST",
    body: JSON.stringify({ url: formattedUrl }),
    headers: {
      "Content-Type": "application/json",
    },
  });

  const htmlData = await htmlRes.json();
  if (!htmlRes.ok) {
    throw new Error(htmlData.error || "Failed to get HTML");
  }

  // Generate project
  const res = await fetch("/api/generate", {
    method: "POST",
    body: JSON.stringify({
      images: screenshotData.chunks,
      html: htmlData.html,
      siteUrl: formattedUrl,
      userPrompt,
      userId,
    }),
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to generate project");
  }

  return {
    projectId: data.projectId,
    workflowRunId: data.workflowRunId
  };
};

export const getScreenshot = async (url: string, darkMode: boolean): Promise<ScreenshotData> => {
  const formattedUrl = formatUrl(url);
  
  const res = await fetch(`${process.env.NEXT_PUBLIC_WORKERS_SCREENSHOT_API}/api/screenshot`, {
    method: "POST",
    body: JSON.stringify({ url: formattedUrl, darkMode }),
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to get screenshot");
  }

  return data;
}; 