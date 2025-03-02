import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { UTApi } from "uploadthing/server";
import * as screenshotone from "screenshotone-api-sdk";

const utapi = new UTApi();

// We can't use edge runtime due to Sharp
export const runtime = 'nodejs';

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
  image: sharp.Sharp, 
  startY: number, 
  width: number, 
  height: number, 
  chunkNumber: number,
  metadata: sharp.Metadata,
  url: string 
}): Promise<ScreenshotChunk> {
  const { image, startY, width, height, chunkNumber, metadata, url } = params;

  // Validate extraction area
  validateExtractArea({
    top: startY,
    left: 0,
    width,
    height,
    imageWidth: metadata.width!,
    imageHeight: metadata.height!
  });

  // Extract and process chunk
  const chunk = await image
    .clone() // Important: clone the image for parallel processing
    .extract({
      left: 0,
      top: startY,
      width,
      height
    })
    .toBuffer();

  // Create a unique filename
  const sanitizedUrl = url.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
  const timestamp = Date.now();
  const filename = `screenshot_${sanitizedUrl}_${timestamp}_chunk${chunkNumber}.png`;

  // Create a File object from the buffer
  const file = new File([chunk], filename, { type: "image/png" });
  Object.defineProperty(file, 'lastModified', {
    value: timestamp
  });

  // Upload to UploadThing using server API
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

    // Configure ScreenshotOne client
    const client = new screenshotone.Client(screenshotApiKey, screenshotSecret);
    const options = screenshotone.TakeOptions
      .url(url)
      .fullPage(true)
      .format('png');

    if (darkMode) {
      options.darkMode(true);
    }

    const signedUrl = await client.generateSignedTakeURL(options);
    const response = await fetch(signedUrl);

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

    // Process image setup - simplified to avoid stream issues
    const imageBuffer = await response.arrayBuffer();
    const image = sharp(Buffer.from(imageBuffer));
    const metadata = await image.metadata();
    
    if (!metadata.height || !metadata.width) {
      throw new Error('Could not get image dimensions');
    }

    // Calculate dimensions for 16:9 chunks
    const imageWidth = metadata.width;
    const imageHeight = metadata.height;
    const chunkHeight = Math.floor((imageWidth / 16) * 9);
    const numberOfChunks = Math.ceil(imageHeight / chunkHeight);

    // Process all chunks in parallel
    const chunkPromises = Array.from({ length: numberOfChunks }, (_, i) => {
      const startY = i * chunkHeight;
      const height = Math.min(chunkHeight, imageHeight - startY);

      if (height <= 0) return null;

      return processChunk({
        image,
        startY,
        width: imageWidth,
        height,
        chunkNumber: i + 1,
        metadata,
        url
      });
    }).filter(Boolean);

    const chunks = await Promise.all(chunkPromises);

    if (chunks.length === 0) {
      throw new Error('No valid chunks were generated');
    }

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