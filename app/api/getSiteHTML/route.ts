import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const proxyUrl = process.env.BRIGHT_DATA_PROXY_URL;
    const username = process.env.BRIGHT_DATA_USERNAME;
    const password = process.env.BRIGHT_DATA_PASSWORD;

    const auth = Buffer.from(`${username}:${password}`).toString('base64');

    const response = await fetch(url, {
      headers: {
        'Proxy-Authorization': `Basic ${auth}`,
      },
      next: {
        revalidate: 0
      }
    });

    const html = await response.text();

    // Filter out base64 strings and SVG paths
    const filteredHtml = html
      .replace(/data:image\/[^;]+;base64,[^\s"']+/g, '{...base64 string...}')
      .replace(/d="[^"]+"/g, 'd="{...svg path...}"');

    return NextResponse.json({ html: filteredHtml });
  } catch (error) {
    console.error('Error getting raw HTML:', error);
    return NextResponse.json({ error: 'Failed to get raw HTML' }, { status: 500 });
  }
} 