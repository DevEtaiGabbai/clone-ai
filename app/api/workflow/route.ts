import { serve } from "@upstash/workflow/nextjs";
import { getSystemPrompt, CONTINUE_PROMPT } from "@/lib/prompt";
import { db } from "@/lib/db";
import { projects, projectFiles } from "@/lib/db/schema";
import { sanitizeHtml } from "@/lib/utils";
import he from 'he';
import { getAverageColor } from 'fast-average-color-node';
import { eq } from "drizzle-orm";

// Define the initial data structure for the workflow
interface GenerateProjectData {
  images: any[];
  html: string;
  userPrompt?: string;
  siteUrl: string;
  projectId: string;
}

interface GeneratedFile {
  path: string;
  content: string;
}

interface FileDiff {
  path: string;
  oldContent: string;
  newContent: string;
}

interface ColorInfo {
  hex: string;
  rgb: string;
  isDark: boolean;
  isLight: boolean;
  description: string;
}

// Progress stages for better UX
const PROGRESS_STAGES = {
  PREPARING: { min: 0, max: 10 },
  INITIAL_GENERATION: { min: 10, max: 40 },
  CONTINUATION: { min: 40, max: 70 },
  REVISION: { min: 70, max: 90 },
  FINALIZING: { min: 90, max: 100 }
};

/**
 * Updates project progress in the database
 */
async function updateProgress(projectId: string, progress: number, status?: string) {
  const updateData: { progress: number; status?: string } = { progress: Math.floor(progress) };
  if (status) updateData.status = status;
  
  await db
    .update(projects)
    .set(updateData)
    .where(eq(projects.id, projectId));
  
  console.log(`Project ${projectId}: Progress updated to ${progress}%${status ? `, status: ${status}` : ''}`);
}

/**
 * Makes API request to OpenRouter with improved error handling and logging
 */
async function callOpenRouterAPI(messages: any[], projectId: string, progressValue: number, stage: string) {
  // Update progress before API call
  await updateProgress(projectId, progressValue);
  
  // Check if API key is set
  if (!process.env.OPENROUTER_API_KEY) {
    console.error("OpenRouter API key is not set");
    throw new Error("OpenRouter API key is not set. Please check your environment variables.");
  }
  
  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  headers.set("Authorization", `Bearer ${process.env.OPENROUTER_API_KEY}`);
  headers.set("HTTP-Referer", process.env.NEXT_PUBLIC_APP_URL || "");
  headers.set("X-Title", "CloneAI.dev");
  
  // Count images in the request for logging
  let imageCount = 0;
  messages.forEach(msg => {
    if (Array.isArray(msg.content)) {
      // Log the content types to help debug
      const contentTypes = msg.content.map((item: any) => item.type);
      console.log(`Project ${projectId}: Message content types: ${contentTypes.join(', ')}`);
      
      // Count both "image" and "image_url" types
      imageCount += msg.content.filter((item: any) => 
        item.type === "image_url" || item.type === "image"
      ).length;
    }
  });
  
  const requestBody = {
    model: 'google/gemini-2.0-pro-exp-02-05:free',
    // model: "google/gemini-2.0-flash-001", // FREE: google/gemini-2.0-pro-exp-02-05:free"
    messages: messages,
    max_tokens: 8192,
    temperature: 0.1,
    top_p: 0.7,
  };
  
  // Log request details without excessive content
  console.log(`Project ${projectId}: Making ${stage} API request to OpenRouter`);
  console.log(`Project ${projectId}: Request model: ${requestBody.model}, max_tokens: ${requestBody.max_tokens}`);
  console.log(`Project ${projectId}: Request contains ${messages.length} messages with ${imageCount} images`);
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 180000); // 3 minute timeout
    
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`Project ${projectId}: OpenRouter API error (${res.status}):`, 
        errorText.length > 200 ? errorText.substring(0, 200) + "..." : errorText);
      throw new Error(`OpenRouter API returned ${res.status}: ${errorText.substring(0, 200)}`);
    }
    
    let response;
    try {
      response = await res.json();
      
      // Validate response structure
      if (!response || typeof response !== 'object') {
        console.error(`Project ${projectId}: Invalid response format - not an object`);
        throw new Error("Invalid response format from OpenRouter API - not an object");
      }
      
      if (!Array.isArray(response.choices) || response.choices.length === 0) {
        console.error(`Project ${projectId}: Invalid response format - missing or empty choices array`);
        throw new Error("Invalid response format from OpenRouter API - missing choices");
      }
      
      if (!response.choices[0].message) {
        console.error(`Project ${projectId}: Invalid response format - missing message in first choice`);
        throw new Error("Invalid response format from OpenRouter API - missing message");
      }
      
      console.log(`Project ${projectId}: ${stage} API response received successfully`);
      
      // Log finish reason
      if (response?.choices?.[0]?.finish_reason) {
        console.log(`Project ${projectId}: Response finish reason: ${response.choices[0].finish_reason}`);
      }
      
      return response;
    } catch (parseError: any) {
      console.error(`Project ${projectId}: Error parsing OpenRouter API response:`, parseError);
      console.error(`Project ${projectId}: Raw response:`, res.status, res.statusText);
      throw new Error(`Failed to parse OpenRouter API response: ${parseError.message}`);
    }
  } catch (error) {
    console.error(`Project ${projectId}: Error calling OpenRouter API during ${stage}:`, error);
    throw error;
  }
}

/**
 * Extracts files from AI response content
 */
function extractFilesFromContent(content: string): GeneratedFile[] {
  const files: GeneratedFile[] = [];
  const fileRegex = /<boltAction\s+type="file"\s+filePath="([^"]+)">([\s\S]*?)(?=<\/boltAction>|$)/g;
  let match;
  
  while ((match = fileRegex.exec(content)) !== null) {
    const [_, path, fileContent] = match;
    if (path && fileContent) {
      files.push({
        path: he.decode(path.trim()),
        content: he.decode(fileContent.trim()),
      });
    }
  }
  
  return files;
}

/**
 * Extracts file diffs from AI response content
 */
function extractFileDiffs(content: string): FileDiff[] {
  const diffs: FileDiff[] = [];
  const diffRegex = /<boltAction\s+type="diff"\s+filePath="([^"]+)">([\s\S]*?)<oldContent>([\s\S]*?)<\/oldContent><newContent>([\s\S]*?)<\/newContent>([\s\S]*?)(?=<\/boltAction>|$)/g;
  let match;
  
  while ((match = diffRegex.exec(content)) !== null) {
    const [_, path, _beforeContent, oldContent, newContent, _afterContent] = match;
    if (path && oldContent && newContent) {
      diffs.push({
        path: he.decode(path.trim()),
        oldContent: he.decode(oldContent.trim()),
        newContent: he.decode(newContent.trim())
      });
    }
  }
  
  return diffs;
}

/**
 * Formats images for AI consumption
 */
function formatImagesForAI(images: any[]): any[] {
  // Ensure images is an array and has items
  if (!Array.isArray(images) || images.length === 0) {
    console.log("No images to format or images is not an array");
    return [];
  }
  
  // Debug log the first image to understand its structure (limited to prevent console overload)
  if (images.length > 0) {
    const firstImageSample = JSON.stringify(images[0]).substring(0, 200);
    console.log("First image structure sample:", firstImageSample);
  }
  
  // Check if images have the expected structure
  const formattedImages = images.map(img => {
    // If the image already has the correct format, return it as is
    if (img.type === "image_url" && img.image_url?.url) {
      return img;
    }
    
    // Otherwise, format it correctly
    return {
      type: "image_url",
      image_url: {
        url: img.url || img.image_url?.url || img
      }
    };
  });
  
  // Debug log the formatted result (limited to prevent console overload)
  if (formattedImages.length > 0) {
    const firstFormattedSample = JSON.stringify(formattedImages[0]).substring(0, 200);
    console.log("First formatted image sample:", firstFormattedSample);
  }
  
  return formattedImages;
}

/**
 * Extracts dominant colors from website images
 */
async function extractColorInformation(images: any[], projectId: string): Promise<ColorInfo[]> {
  console.log(`Project ${projectId}: Extracting color information from images...`);
  
  const colorInfo: ColorInfo[] = [];
  const processedImages = Math.min(images.length, 5); // Process at most 5 images
  
  try {
    for (let i = 0; i < processedImages; i++) {
      const img = images[i];
      
      // Extract the URL from various possible formats
      const imgUrl = img.url || (img.image_url?.url) || img;
      
      if (!imgUrl) {
        console.log(`Project ${projectId}: Could not extract URL from image ${i+1}`);
        continue;
      }
      
      try {
        // Get average color from image
        const color = await getAverageColor(imgUrl);
        
        if (color) {
          // Create a human-readable description of the color
          const [r, g, b] = color.value.slice(0, 3);
          
          // Determine if it's grayscale (all RGB values are similar)
          const isGrayscale = Math.abs(r - g) < 20 && Math.abs(g - b) < 20 && Math.abs(r - b) < 20;
          
          let description = '';
          
          if (isGrayscale) {
            // Describe grayscale colors
            const brightness = Math.round((r + g + b) / 3);
            if (brightness > 240) description = 'white';
            else if (brightness > 190) description = 'light gray';
            else if (brightness > 120) description = 'gray';
            else if (brightness > 60) description = 'dark gray';
            else description = 'black';
          } else {
            // For colored pixels, determine dominant hue
            const max = Math.max(r, g, b);
            
            if (max === r) {
              if (g > b + 50) description = g > r * 0.8 ? 'yellow' : 'orange';
              else description = b > r * 0.8 ? 'pink' : 'red';
            } else if (max === g) {
              description = r > b + 50 ? 'lime green' : 'green';
            } else { // max === b
              description = r > g + 50 ? 'purple' : 'blue';
            }
            
            // Add brightness qualifier
            const brightness = (r + g + b) / 3;
            if (brightness < 80 && description !== 'black') {
              description = 'dark ' + description;
            } else if (brightness > 200 && description !== 'white') {
              description = 'light ' + description;
            }
          }
          
          colorInfo.push({
            hex: color.hex,
            rgb: color.rgb,
            isDark: color.isDark,
            isLight: color.isLight,
            description
          });
          
          console.log(`Project ${projectId}: Extracted color from image ${i+1}: ${color.hex} (${description})`);
        }
      } catch (imgError) {
        console.error(`Project ${projectId}: Error extracting color from image ${i+1}:`, 
          imgError instanceof Error ? imgError.message : 'Unknown error');
      }
    }
    
    return colorInfo;
  } catch (error) {
    console.error(`Project ${projectId}: Error processing colors:`, 
      error instanceof Error ? error.message : 'Unknown error');
    return [];
  }
}

/**
 * Apply file diffs to existing files
 */
function applyFileDiffs(files: GeneratedFile[], diffs: FileDiff[]): GeneratedFile[] {
  // Create a deep copy of files
  const updatedFiles = [...files];
  
  for (const diff of diffs) {
    const fileIndex = updatedFiles.findIndex(file => file.path === diff.path);
    
    if (fileIndex === -1) {
      console.log(`Cannot apply diff to missing file: ${diff.path}`);
      continue;
    }
    
    const file = updatedFiles[fileIndex];
    const newContent = file.content.replace(diff.oldContent, diff.newContent);
    
    // Only update if the content actually changed
    if (newContent !== file.content) {
      updatedFiles[fileIndex] = {
        ...file,
        content: newContent
      };
      console.log(`Applied diff to file: ${diff.path}`);
    } else {
      console.log(`No changes applied to file: ${diff.path}`);
    }
  }
  
  return updatedFiles;
}

/**
 * Continues generation if response is cut off with improved progress tracking
 */
async function continueGeneration(
  initialContent: string, 
  messages: any[], 
  projectId: string
): Promise<GeneratedFile[]> {
  let allContent = initialContent;
  let files: GeneratedFile[] = [];
  let continuationAttempts = 0;
  
  // Extract files from initial content
  const initialFiles = extractFilesFromContent(initialContent);
  files = [...initialFiles];
  
  // Check if we need to continue (if there are no files or if the content seems cut off)
  const needsContinuation = initialFiles.length === 0 || 
                           !initialContent.includes("</boltArtifact>") ||
                           initialContent.includes("</boltAction>") && !initialContent.includes("</boltAction></boltArtifact>");
  
  if (!needsContinuation) {
    console.log(`Project ${projectId}: Initial response is complete, found ${initialFiles.length} files`);
    return files;
  }
  
  console.log(`Project ${projectId}: Initial response seems incomplete. Continuing generation...`);
  
  // Create a deep copy of messages to avoid modifying the original
  const continuationMessages = JSON.parse(JSON.stringify(messages));
  
  // Add the initial response as assistant message
  continuationMessages.push({
    role: "assistant",
    content: initialContent
  });
  
  // Create a new continuation message with just text (no images needed for continuation)
  continuationMessages.push({
    role: "user",
    content: CONTINUE_PROMPT
  });
  
  console.log(`Project ${projectId}: Set up continuation with ${continuationMessages.length} messages`);
  
  // Calculate progress steps
  const progressRange = PROGRESS_STAGES.CONTINUATION.max - PROGRESS_STAGES.CONTINUATION.min;
  const progressIncrement = progressRange / 5; // Allow for up to 5 continuations
  let currentProgress = PROGRESS_STAGES.CONTINUATION.min;
  
  // Continue generation until we have files or reach a reasonable completion
  while (continuationAttempts < 5) {
    continuationAttempts++;
    console.log(`Project ${projectId}: Continuation attempt ${continuationAttempts}`);
    
    // Update progress
    currentProgress += progressIncrement;
    await updateProgress(projectId, currentProgress, "generating");
    
    // Make API request
    const response = await callOpenRouterAPI(
      continuationMessages, 
      projectId, 
      currentProgress, 
      `continuation ${continuationAttempts}`
    );
    
    if (!response?.choices?.[0]?.message?.content) {
      console.error(`Project ${projectId}: Invalid API response structure in continuation`);
      break;
    }
    
    const continuationContent = response.choices[0].message.content;
    allContent += continuationContent;
    
    // Extract files from continuation content
    const continuationFiles = extractFilesFromContent(continuationContent);
    
    // Log file extraction results
    console.log(`Project ${projectId}: Extracted ${continuationFiles.length} files from continuation ${continuationAttempts}`);
    
    // Add new files to our collection
    files = [...files, ...continuationFiles];
    
    // Check if we need to continue
    const isComplete = continuationContent.includes("</boltArtifact>") || continuationFiles.length > 0;
    
    if (isComplete) {
      console.log(`Project ${projectId}: Continuation complete after ${continuationAttempts} attempts`);
      break;
    }
    
    // Prepare for next continuation
    continuationMessages.pop(); // Remove the last user message (continue prompt)
    continuationMessages.pop(); // Remove the last assistant message
    
    // Add the combined content as assistant message
    continuationMessages.push({
      role: "assistant",
      content: allContent
    });
    
    // Add continue prompt again
    continuationMessages.push({
      role: "user",
      content: CONTINUE_PROMPT
    });
  }
  
  // Final check for files
  if (files.length === 0) {
    console.error(`Project ${projectId}: No files found after ${continuationAttempts} continuation attempts`);
    throw new Error("No files found in the generated response after continuation attempts");
  }
  
  // Log file stats
  const fileStats = files.reduce((acc, file) => {
    const ext = file.path.split('.').pop() || 'unknown';
    acc[ext] = (acc[ext] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  console.log(`Project ${projectId}: Generated ${files.length} files:`, fileStats);
  
  return files;
}

/**
 * Revises the generated code to match the design more closely
 */
async function reviseGeneratedCode(
  files: GeneratedFile[], 
  images: any[], 
  html: string, 
  siteUrl: string, 
  userPrompt: string | undefined, 
  projectId: string
): Promise<GeneratedFile[]> {
  console.log(`Project ${projectId}: Starting code revision to better match the design...`);
  
  // Update progress
  await updateProgress(projectId, PROGRESS_STAGES.REVISION.min, "revising");
  
  // Extract color information from images
  const colorInfo = await extractColorInformation(images, projectId);
  
  // Create color guidance text with specific hex codes
  let colorGuidance = '';
  if (colorInfo.length > 0) {
    colorGuidance = `I analyzed the site's color palette and found these dominant colors:\n`;
    
    colorInfo.forEach(color => {
      colorGuidance += `- ${color.description}: ${color.hex} (${color.rgb})\n`;
    });
    
    colorGuidance += `\nPlease use these exact hex color codes in your implementation for accurate visual matching.`;
    console.log(`Project ${projectId}: Created color guidance with ${colorInfo.length} colors`);
  }
  
  // Prepare file contents for the revision prompt - limit to essential files only
  const essentialFileTypes = ['.tsx', '.jsx', '.ts', '.js', '.css', '.html'];
  const essentialFiles = files.filter(file => 
    essentialFileTypes.some(ext => file.path.endsWith(ext))
  );
  
  console.log(`Project ${projectId}: Selected ${essentialFiles.length} essential files for revision`);
  
  // Limit the number of files to avoid token limits
  const filesToInclude = essentialFiles.slice(0, 10);
  
  const fileContents = filesToInclude.map(file => 
    `File: ${file.path}\n\`\`\`${file.path.endsWith('.tsx') || file.path.endsWith('.ts') ? 'typescript' : 'jsx'}\n${file.content}\n\`\`\``
  ).join('\n\n');
  
  // Truncate HTML to avoid token limits
  const truncatedHtml = sanitizeHtml(html);
  const htmlSample = truncatedHtml.length > 1000 ? 
    truncatedHtml.substring(0, 1000) + "..." : 
    truncatedHtml;
  
  console.log(`Project ${projectId}: Prepared truncated HTML sample (${htmlSample.length} chars)`);
  
  // Format images for AI
  const formattedImages = formatImagesForAI(images);
  
  // Create the revision prompt
  const revisionPrompt = `I need you to refine the code to make it look as similar as possible to the uploaded screenshots. 
  
The site you are cloning is: ${siteUrl}

${colorGuidance}

${userPrompt ? `Here is what the user requested: ${userPrompt}` : ''}

The website has been captured in ${images.length} screenshots for reference.

Here is the current implementation that needs refinement:
${fileContents}

Please focus on:
1. Making the UI match the screenshots as closely as possible
2. Ensuring colors, spacing, typography, and layout are accurate - use the exact hex codes I provided
3. Fixing any visual inconsistencies
4. Improving responsiveness
5. Ensuring all interactive elements work correctly
6. Adding any missing sections or components that were in the original site

IMPORTANT INSTRUCTIONS:
1. Instead of using SVG paths directly, use Lucide React icons where appropriate
2. For small changes to existing files, use the diff format:
   <boltAction type="diff" filePath="path/to/file"><oldContent>original code snippet</oldContent><newContent>updated code snippet</newContent></boltAction>
3. For completely new files or major rewrites, use the normal file format:
   <boltAction type="file" filePath="path/to/file">full file content</boltAction>
4. Only include files that need changes
5. Make sure color values precisely match the provided hex codes

Please wrap your response in <boltArtifact> tags.`;

  // Prepare messages for the API call
  const messages = [
    {
      role: "system",
      content: getSystemPrompt(),
    },
    {
      role: "user",
      content: [
        { type: "text", text: revisionPrompt }
      ]
    },
  ];
  
  // Add images to the user message content if available
  if (formattedImages.length > 0) {
    // Ensure content is an array
    if (!Array.isArray(messages[1].content)) {
      messages[1].content = [{ type: "text", text: messages[1].content as string }];
    }
    
    // Add up to 5 images
    const imagesToAdd = formattedImages.slice(0, 5);
    (messages[1].content as any[]).push(...imagesToAdd);
    
    console.log(`Project ${projectId}: Added ${imagesToAdd.length} images to the revision request`);
  }
  
  // Initialize variables for revised files and diffs
  let revisedFiles: GeneratedFile[] = [];
  let fileDiffs: FileDiff[] = [];
  
  try {
    // Make API request
    const response = await callOpenRouterAPI(
      messages, 
      projectId, 
      PROGRESS_STAGES.REVISION.min + 10, 
      "revision"
    );
    
    // More robust error handling for response content
    if (!response?.choices?.[0]?.message) {
      console.error(`Project ${projectId}: Invalid API response structure in revision - missing message`);
      throw new Error("Invalid response format from OpenRouter API during revision - missing message");
    }
    
    if (!response.choices[0].message.content) {
      console.error(`Project ${projectId}: Invalid API response structure in revision - missing content`);
      throw new Error("Invalid response format from OpenRouter API during revision - missing content");
    }
    
    const content = response.choices[0].message.content;
    
    // Validate content is a string
    if (typeof content !== 'string') {
      console.error(`Project ${projectId}: Invalid API response structure in revision - content is not a string`);
      throw new Error("Invalid response format from OpenRouter API during revision - content is not a string");
    }
    
    // Extract revised files and diffs from initial response
    revisedFiles = extractFilesFromContent(content);
    fileDiffs = extractFileDiffs(content);
    
    console.log(`Project ${projectId}: Extracted ${revisedFiles.length} files and ${fileDiffs.length} diffs from revision`);
    
    // Check if we need to continue
    const needsContinuation = (revisedFiles.length === 0 && fileDiffs.length === 0) || 
                             !content.includes("</boltArtifact>");
    
    if (needsContinuation) {
      console.log(`Project ${projectId}: Revision response seems incomplete. Continuing...`);
      
      // Set up for continuation
      const continuationMessages = [
        {
          role: "system",
          content: getSystemPrompt(),
        },
        {
          role: "assistant",
          content: content
        },
        {
          role: "user",
          content: CONTINUE_PROMPT
        }
      ];
      
      // Make continuation request
      const continuationResponse = await callOpenRouterAPI(
        continuationMessages, 
        projectId, 
        PROGRESS_STAGES.REVISION.min + 30, 
        "revision continuation"
      );
      
      // More robust error handling for continuation response
      if (!continuationResponse?.choices?.[0]?.message) {
        console.error(`Project ${projectId}: Invalid API response structure in revision continuation - missing message`);
        // Don't throw here, just log and continue with what we have
        console.log(`Project ${projectId}: Proceeding with partial results from initial response`);
      } else if (!continuationResponse.choices[0].message.content) {
        console.error(`Project ${projectId}: Invalid API response structure in revision continuation - missing content`);
        console.log(`Project ${projectId}: Proceeding with partial results from initial response`);
      } else {
        const continuationContent = continuationResponse.choices[0].message.content;
        
        // Validate content is a string
        if (typeof continuationContent !== 'string') {
          console.error(`Project ${projectId}: Invalid API response structure in revision continuation - content is not a string`);
          console.log(`Project ${projectId}: Proceeding with partial results from initial response`);
        } else {
          // Extract additional files and diffs
          const additionalFiles = extractFilesFromContent(continuationContent);
          const additionalDiffs = extractFileDiffs(continuationContent);
          
          console.log(`Project ${projectId}: Extracted ${additionalFiles.length} files and ${additionalDiffs.length} diffs from continuation`);
          
          // Add to our collection
          revisedFiles = [...revisedFiles, ...additionalFiles];
          fileDiffs = [...fileDiffs, ...additionalDiffs];
        }
      }
    }
  } catch (error: any) {
    // Log the error but don't fail the entire process
    console.error(`Project ${projectId}: Error during revision process:`, error);
    console.log(`Project ${projectId}: Continuing with original files due to revision error`);
    
    // Update progress to indicate we're skipping revision
    await updateProgress(projectId, PROGRESS_STAGES.REVISION.max, "skipping revision");
    
    // Return the original files unchanged
    return files;
  }
  
  // Apply diffs to the original files
  const updatedFiles = applyFileDiffs(files, fileDiffs);
  
  // Merge revised files with updated files, giving priority to revised files
  const finalFiles = [...updatedFiles];
  
  // Add any completely new files from the revision
  revisedFiles.forEach(revisedFile => {
    const existingIndex = finalFiles.findIndex(f => f.path === revisedFile.path);
    if (existingIndex >= 0) {
      // Replace existing file with revised version
      finalFiles[existingIndex] = revisedFile;
    } else {
      // Add new file
      finalFiles.push(revisedFile);
    }
  });
  
  console.log(`Project ${projectId}: Revision complete. Final file count: ${finalFiles.length}`);
  
  return finalFiles;
}

export const { POST } = serve<GenerateProjectData>(
  async (context) => {
    const { images, html, userPrompt, siteUrl, projectId } = context.requestPayload;
    console.log(`Project ${projectId}: Starting generation workflow for ${siteUrl}`);

    // Step 1: Update project status to processing
    await context.run("update-project-status", async () => {
      await updateProgress(projectId, PROGRESS_STAGES.PREPARING.min, "processing");
      await db
        .update(projects)
        .set({ workflowRunId: context.workflowRunId })
        .where(eq(projects.id, projectId));
      
      console.log(`Project ${projectId}: Status updated to processing, workflow ID: ${context.workflowRunId}`);
    });

    // Step 2: Prepare data for AI model
    const truncatedHtml = await context.run("prepare-data", async () => {
      console.log(`Project ${projectId}: Preparing data, sanitizing HTML...`);
      await updateProgress(projectId, PROGRESS_STAGES.PREPARING.max);
      
      // Sanitize HTML to remove large scripts, base64 data, etc.
      const sanitized = sanitizeHtml(html);
      console.log(`Project ${projectId}: HTML sanitized, reduced from ${html.length} to ${sanitized.length} characters`);
      
      return sanitized;
    });

    // Step 3: Generate the project using OpenRouter API
    const generatedFiles = await context.run("generate-project", async () => {
      try {
        // Update progress
        await updateProgress(projectId, PROGRESS_STAGES.INITIAL_GENERATION.min, "generating");
        console.log(`Project ${projectId}: Starting initial generation...`);
        
        // Format images for AI
        const formattedImages = formatImagesForAI(images);
        console.log(`Project ${projectId}: Formatted ${formattedImages.length} images for AI consumption`);
        
        // Extract color information from images
        const colorInfo = await extractColorInformation(images, projectId);
        
        // Create color guidance text with exact hex values
        let colorGuidance = '';
        if (colorInfo.length > 0) {
          colorGuidance = `I analyzed the site's color palette and found these dominant colors:\n`;
          
          colorInfo.forEach(color => {
            colorGuidance += `- ${color.description}: ${color.hex} (${color.rgb})\n`;
          });
          
          colorGuidance += `\nPlease use these exact hex color codes in your implementation for accurate visual matching.`;
        }
        
        // Create the enhanced prompt text
        const enhancedPromptText = `Create a modern Next.js application with the following requirements:
        1. Use Next.js 14 App Router
        2. Use TypeScript
        3. Use Tailwind CSS
        4. Use shadcn/ui components (You will need to write the code for them since they are not installed. However, this is good because you can customize them to the exact design.)
          4b) However, all of shadcn/ui's dependencies are already installed, so you can just write the code for the components you need.
        5. Follow best practices for file structure and component organization
        6. Include proper error handling and loading states
        7. Make it responsive and accessible
        8. IMPORTANT: Use Lucide React icons instead of raw SVG paths
        
        The site you are cloning is: ${siteUrl}
        
        ${colorGuidance}
        
        For relative image URLS, for example <img src="/images/logo.png" />, you should use the siteUrl to make the image URL absolute;
        The site URL is: ${siteUrl}
        therefore, "/images/logo.png" should be replaced with "${siteUrl}/images/logo.png"
        
        ${userPrompt ? `Here is what the user requested: ${userPrompt}` : ''}
        
        The website has been captured in ${images.length} screenshots for reference.
        
        Please generate all necessary files including:
        - Required configuration files (next.config.js, tailwind.config.js, etc.)
        - Page components
        - UI components
        - Utility functions
        - Type definitions
        - globals.css with proper CSS variables
        - Do not forget layout.tsx file
        - Do not forget the page.tsx file in its respective folder
        - CRITICAL: Do not forget the next.config.js file - The project won't run without it
        
        Note: The project already has shadcn/ui installed and configured with the following components:
        - Button
        - Dialog
        And the following configuration files are already set up:
        - components.json
        - tailwind.config.js
        - postcss.config.js
        
        Please wrap your response in <boltArtifact> tags and each file in <boltAction type="file" filePath="path/to/file"> tags.`;

        console.log(`Project ${projectId}: Prepared generation prompt, sending to OpenRouter API...`);
        
        // Update progress before API call
        await updateProgress(projectId, PROGRESS_STAGES.INITIAL_GENERATION.min + 10);
        
        // Make the API request with a standard text prompt
        const messages = [
          {
            role: "system",
            content: getSystemPrompt(),
          },
          {
            role: "user",
            content: [
              { type: "text", text: enhancedPromptText }
            ]
          },
        ];
        
        // Add images to the user message content if available
        if (formattedImages.length > 0) {
          // Ensure content is an array
          if (!Array.isArray(messages[1].content)) {
            messages[1].content = [{ type: "text", text: messages[1].content as string }];
          }
          
          // Add up to 5 images
          const imagesToAdd = formattedImages.slice(0, 5);
          (messages[1].content as any[]).push(...imagesToAdd);
          
          console.log(`Project ${projectId}: Added ${imagesToAdd.length} images to the request`);
        }
        
        // Make initial API request
        const response = await callOpenRouterAPI(
          messages, 
          projectId, 
          PROGRESS_STAGES.INITIAL_GENERATION.max, 
          "initial generation"
        );
        
        if (!response?.choices?.[0]?.message?.content) {
          console.error(`Project ${projectId}: Invalid API response structure in initial generation`);
          throw new Error("Invalid response format from OpenRouter API");
        }
        
        const content = response.choices[0].message.content;
        
        // Continue generation if needed and extract files
        const files = await continueGeneration(content, messages, projectId);
        
        // Step 3.5: Revise the generated code to better match the design
        const revisedFiles = await reviseGeneratedCode(files, images, html, siteUrl, userPrompt, projectId);
        
        return revisedFiles;
      } catch (error) {
        console.error(`Project ${projectId}: Error in generate-project step:`, error);
        
        // Update project status to failed
        await updateProgress(projectId, 0, "failed");
        throw error; // Re-throw to be handled by the workflow
      }
    });

    // Step 4: Store files in database
    await context.run("store-files", async () => {
      // Update progress
      await updateProgress(projectId, PROGRESS_STAGES.FINALIZING.min, "finalizing");
      
      // Make sure generatedFiles is an array before mapping
      if (!Array.isArray(generatedFiles)) {
        console.error(`Project ${projectId}: generatedFiles is not an array:`, typeof generatedFiles);
        throw new Error("Generated files data is not in the expected format");
      }
      
      console.log(`Project ${projectId}: Storing ${generatedFiles.length} files in database...`);
      
      // Store files in database with decoded content
      await db.insert(projectFiles).values(
        generatedFiles.map((file) => ({
          projectId: projectId,
          path: file.path,
          content: file.content,
        }))
      );
      
      console.log(`Project ${projectId}: Successfully stored ${generatedFiles.length} files in database`);
    });

    // Step 5: Mark project as complete
    await context.run("complete-project", async () => {
      await updateProgress(projectId, PROGRESS_STAGES.FINALIZING.max, "completed");
      console.log(`Project ${projectId}: Generation completed successfully`);
    });

    return { success: true, projectId };
  },
  {
    // Configure workflow options
    retries: 3,
    verbose: true,
  }
); 