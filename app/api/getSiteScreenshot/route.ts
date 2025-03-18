import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { UTApi } from "uploadthing/server";
import * as screenshotone from "screenshotone-api-sdk";

const utapi = new UTApi();

// We can't use edge runtime due to Sharp
export const runtime = 'nodejs';

// Performance optimization
sharp.cache(false); // Disable Sharp cache to reduce memory usage
sharp.concurrency(4); // Use 4 threads for processing

interface ScreenshotChunk {
  url: string;
  chunkNumber: number;
  height: number;
  width: number;
}

function validateExtractArea(params: { top: number; left: number; width: number; height: number; imageWidth: number; imageHeight: number }) {
  const { top, left, width, height, imageWidth, imageHeight } = params;
  
  // All values must be integers and positive
  if (!Number.isInteger(top) || !Number.isInteger(left) || !Number.isInteger(width) || !Number.isInteger(height)) {
    throw new Error('All dimensions must be integers');
  }
  
  if (top < 0 || left < 0 || width <= 0 || height <= 0) {
    throw new Error('All dimensions must be positive');
  }
  
  // Check if extraction area is within image bounds
  if (left + width > imageWidth) {
    throw new Error(`Width (${left + width}) exceeds image bounds (${imageWidth})`);
  }
  
  if (top + height > imageHeight) {
    throw new Error(`Height (${top + height}) exceeds image bounds (${imageHeight})`);
  }
  
  return true;
}

async function processChunk(params: { 
  imageBuffer: Buffer,
  startY: number, 
  width: number, 
  height: number, 
  chunkNumber: number,
  metadata: sharp.Metadata,
  url: string 
}): Promise<ScreenshotChunk> {
  const { imageBuffer, startY, width, height, chunkNumber, metadata, url } = params;

  // Validate extraction area
  validateExtractArea({
    top: startY,
    left: 0,
    width,
    height,
    imageWidth: metadata.width!,
    imageHeight: metadata.height!
  });

  // Create new sharp instance for this chunk to avoid memory issues
  const chunkBuffer = await sharp(imageBuffer, { 
    limitInputPixels: false, // Disable input size limit
    failOn: 'none' // Be more permissive with image issues
  })
    .extract({
      left: 0,
      top: startY,
      width,
      height
    })
    .toBuffer({ resolveWithObject: false });

  // Create a unique filename - simplified for performance
  const timestamp = Date.now();
  const filename = `sc_${chunkNumber}_${timestamp}.png`;

  // Create a File object from the buffer
  const file = new File([chunkBuffer], filename, { type: "image/png" });

  // Upload to UploadThing using server API 
  // Note: Multiple uploads happen in parallel naturally through Promise.all outside
  const uploadResponse = await utapi.uploadFiles([file]);

  if (!uploadResponse[0]?.data?.url) {
    throw new Error(`Failed to upload chunk ${chunkNumber}`);
  }

  return {
    url: uploadResponse[0].data.url,
    chunkNumber,
    height,
    width
  };
}

export async function POST(req: NextRequest) {
  try {
    const { url, darkMode } = await req.json();
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Handle case where darkMode is missing from request body
    if (darkMode === undefined) {
      return NextResponse.json({ error: 'Dark mode parameter is required' }, { status: 400 });
    }

    if (typeof darkMode !== 'boolean') {
      return NextResponse.json({ error: 'Dark mode must be a boolean value if provided' }, { status: 400 });
    }

    const screenshotApiKey = process.env.SCREENSHOTONE_API_KEY;
    const screenshotSecret = process.env.SCREENSHOTONE_SECRET;

    if (!screenshotApiKey || !screenshotSecret) {
      return NextResponse.json({ error: 'Screenshot service not configured' }, { status: 500 });
    }

    // Configure ScreenshotOne client with optimized settings
    const client = new screenshotone.Client(screenshotApiKey, screenshotSecret);
    const options = screenshotone.TakeOptions
      .url(url)
      .fullPage(true)
      .format('png')
      .delay(500); // Just enough delay to ensure page loads

    if (darkMode) {
      options.darkMode(true);
    }
    
    // Fetch screenshot faster with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    
    const signedUrl = await client.generateSignedTakeURL(options);
    const response = await fetch(signedUrl, { 
      signal: controller.signal,
      headers: {
        'Accept-Encoding': 'gzip, deflate, br' // Request compressed response
      }
    }).finally(() => clearTimeout(timeout));

    if (!response.ok) {
      // Get more details about the error
      const errorText = await response.text();
      console.error('Screenshot service detailed error:', {
        status: response.status,
        statusText: response.statusText,
        errorText,
        url: url,
        signedUrl
      });
      
      throw new Error(`Screenshot service error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    // Process image with optimized memory usage
    const imageBuffer = Buffer.from(await response.arrayBuffer());
    
    // Create a sharp instance only for metadata extraction
    const image = sharp(imageBuffer, { 
      limitInputPixels: false, // Disable input size limit 
      failOn: 'none' // Be more permissive with image issues
    });
    
    const metadata = await image.metadata();
    
    if (!metadata.height || !metadata.width) {
      throw new Error('Could not get image dimensions');
    }

    // Calculate dimensions for 16:9 chunks
    const imageWidth = metadata.width;
    const imageHeight = metadata.height;
    const chunkHeight = Math.floor((imageWidth / 16) * 9);
    const numberOfChunks = Math.ceil(imageHeight / chunkHeight);

    // Free memory by removing the original sharp instance
    image.destroy();

    // Prepare chunk processing promises
    const chunkPromises = [];
    for (let i = 0; i < numberOfChunks; i++) {
      const startY = i * chunkHeight;
      const height = Math.min(chunkHeight, imageHeight - startY);

      if (height <= 0) continue;

      chunkPromises.push(processChunk({
        imageBuffer, // Pass the buffer instead of the sharp instance
        startY,
        width: imageWidth,
        height,
        chunkNumber: i + 1,
        metadata,
        url
      }));
    }

    const chunks = await Promise.all(chunkPromises);

    if (chunks.length === 0) {
      throw new Error('No valid chunks were generated');
    }

    // Help garbage collection
    (imageBuffer as any) = null;

    return NextResponse.json({
      originalUrl: url,
      width: imageWidth,
      totalHeight: imageHeight,
      chunks
    });

  } catch (error) {
    console.error('Screenshot error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      url: req.url
    });
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get screenshot' },
      { status: 500 }
    );
  }
}