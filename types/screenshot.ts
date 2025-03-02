export interface ScreenshotChunk {
  url: string;
  chunkNumber: number;
  height: number;
  width: number;
}

export interface ScreenshotData {
  originalUrl: string;
  width: number;
  totalHeight: number;
  chunks: ScreenshotChunk[];
} 