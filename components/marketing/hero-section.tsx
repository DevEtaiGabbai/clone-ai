"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import Image from "next/image"

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

          <div className="mx-auto mt-8 flex flex-row items-center justify-center gap-4">
            <Button size="lg" className="rounded-full" asChild>
              <a href="https://demo-v2.achromatic.dev" target="_blank" rel="noreferrer">
                Open Demo
              </a>
            </Button>
            <Button variant="outline" size="lg" className="rounded-full" asChild>
              <a href="/docs">Read Docs</a>
            </Button>
          </div>
        </div>

        <Tabs defaultValue="master" className="w-full">
          <TabsList className="items-center text-muted-foreground mb-6 flex h-fit flex-row justify-start sm:justify-center">
            <TabsTrigger value="master">Master page</TabsTrigger>
            <TabsTrigger value="detail">Detail page</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="login">Login</TabsTrigger>
          </TabsList>
          <div className="relative mb-1 w-full rounded-xl bg-neutral-50 p-1 dark:border-none dark:bg-background">
            <TabsContent value="master">
              <Image
                src="https://achromatic.dev/images/dark-contacts.webp"
                alt="Master page screenshot"
                width={1340}
                height={652}
                className="rounded-xl border shadow"
              />
            </TabsContent>
            {/* Add other TabsContent components for other tabs */}
          </div>
        </Tabs>
      </div>
    </section>
  )
}

