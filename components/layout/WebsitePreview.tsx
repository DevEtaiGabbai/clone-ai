'use client';

import { Button } from "@/components/ui/button";
import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import type { ScreenshotData } from '@/types/screenshot';
import { useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface WebsitePreviewProps {
  screenshotData: ScreenshotData;
  userPrompt: string;
  onUserPromptChange: (value: string) => void;
  onBack: () => void;
  onContinue: () => void;
  loading: boolean;
  error?: string | null;
}

const EXAMPLE_PROMPTS = [
  { title: "Add styling with", detail: "tailwindcss and modern UI" },
  { title: "Implement", detail: "responsive design patterns" },
  { title: "Optimize for", detail: "performance and SEO" },
  { title: "Include", detail: "accessibility features" },
];

export function WebsitePreview({
  screenshotData,
  userPrompt,
  onUserPromptChange,
  onBack,
  onContinue,
  loading,
  error
}: WebsitePreviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  return (
    <div className="flex flex-col min-h-[100dvh] bg-background">
      {/* Header Area */}
      <div className="flex items-center px-6 py-2 border-b">
        <Button
          variant="ghost"
          onClick={onBack}
          disabled={loading}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-6 p-6 pt-2 overflow-hidden">
        {/* Carousel - 75% width */}
        <div className="w-3/4 flex flex-col">
          <Carousel 
            className="w-full"
            onSelect={(index: any) => setCurrentIndex(index)}
          >
            <CarouselContent>
              {screenshotData.chunks.map((chunk, index) => (
                <CarouselItem key={chunk.chunkNumber}>
                  <div className="relative w-full aspect-[4/3] bg-black/5 rounded-lg overflow-hidden">
                    <Image
                      src={chunk.url}
                      alt={`Screenshot part ${index + 1}`}
                      fill
                      className="object-contain"
                      priority={index === 0}
                      sizes="75vw"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            {screenshotData.chunks.length > 1 && (
              <>
                <CarouselPrevious className="left-4" />
                <CarouselNext className="right-4" />
              </>
            )}
          </Carousel>
          
          {/* Image Counter */}
          <div className="mt-3 text-center text-sm text-muted-foreground">
            {currentIndex + 1} / {screenshotData.chunks.length}
          </div>
        </div>

        {/* Chat Interface - 25% width */}
        <div className="w-1/4 flex flex-col">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Preview Site</h2>
            
            {/* Example Prompts */}
            <div className="grid gap-2">
              {EXAMPLE_PROMPTS.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => onUserPromptChange(`${prompt.title} ${prompt.detail}`)}
                  className="text-left border rounded-lg px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <span className="font-medium">{prompt.title}</span>{' '}
                  <span className="text-muted-foreground">{prompt.detail}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Chat Input and Generate Button */}
          <div className="mt-auto space-y-3">
            <textarea
              value={userPrompt}
              onChange={(e) => onUserPromptChange(e.target.value)}
              placeholder="Any additional instructions?"
              className="w-full h-20 resize-none border rounded-lg px-3 py-2 text-sm"
            />

            <Button
              onClick={onContinue}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Processing...' : 'Generate Clone'}
            </Button>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}