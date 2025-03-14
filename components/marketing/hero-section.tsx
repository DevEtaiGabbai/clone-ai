"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import Image from "next/image"
import { SiteToCode } from "./site-to-code"

export function HeroSection() {
  const [activeTab, setActiveTab] = useState("master")

  return (
    <section className="container relative overflow-hidden">
      <div className="flex flex-col items-center text-center">
        <div className="mx-auto flex flex-col gap-2 py-8 md:py-12 md:pb-8 lg:py-12 lg:pb-10 mb-8 mt-12 items-center px-0 sm:px-4">
          <div className="inline-flex items-center border px-2.5 py-0.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 mx-auto mb-2 rounded-3xl text-[13px]">
            Next.js 15 SaaS Starter Kits
          </div>

          <h1 className="font-bold tracking-tighter text-5xl md:text-6xl lg:text-7xl">
            Building your SaaS
            <br className="hidden sm:inline" /> just got unfairly easy
          </h1>

          <p className="text-balance font-light text-foreground mt-4 max-w-[42rem] text-lg dark:text-muted-foreground sm:text-xl">
            Why spend valuable time tackling auth, billing, emails, organizations, invites and onboarding?
            <span className="hidden sm:inline"> Focus on your business and skip the noise.</span>
          </p>

          <div className="mt-5 relative max-w-xl mx-auto mb-4 sm:space-x-4">
            <div className="w-full relative group">
              <input 
                placeholder=" " 
                aria-placeholder="https://example.com" 
                className="h-[3.25rem] w-full resize-none focus-visible:outline-none focus-visible:ring-orange-500 focus-visible:ring-2 rounded-[18px] text-sm text-[#36322F] px-4 pr-12 border-[.75px] border-border [box-shadow:0_0_0_1px_#e3e1de66,0_1px_2px_#5f4a2e14,0_4px_6px_#5f4a2e0a,0_40px_40px_-24px_#684b2514]" 
                style={{ filter: "drop-shadow(rgba(249, 224, 184, 0.3) -0.731317px -0.731317px 35.6517px)" }}
              />
              <div 
                aria-hidden="true" 
                className="absolute top-1/2 -translate-y-1/2 left-4 group-has-[:placeholder-shown]:opacity-100 opacity-0 pointer-events-none text-sm text-opacity-50 text-start"
              >
                <span 
                  className="typewriter_typewriter__Z_ctM typewriter_withCaret__ADJQ1 group-has-[input:focus-visible]:border-none text-[#605A57]/50" 
                  style={{ "--text-length": "19" } as React.CSSProperties}
                >
                  https://example.com
                </span>
              </div>
            </div>
            <button 
              type="submit" 
              className="absolute top-1/2 transform -translate-y-1/2 right-2 flex h-10 items-center justify-center rounded-md px-3 text-sm font-medium text-zinc-500 hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="h-4 w-4">
                <polyline points="9 10 4 15 9 20"></polyline>
                <path d="M20 4v7a4 4 0 0 1-4 4H4"></path>
              </svg>
            </button>
          </div>
        </div>
        <SiteToCode />
      </div>
    </section>
  )
}

