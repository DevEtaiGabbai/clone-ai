"use client"
import CallToAction from "@/components/marketing/call-to-action";
import Facts from "@/components/marketing/facts";
import Features from "@/components/marketing/features";
import FooterSection from "@/components/marketing/footer";
import HeroSection from "@/components/marketing/hero-section";
import Pricing from "@/components/marketing/pricing";
import StatsSection from "@/components/marketing/stats-section";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <Features />
      <Facts />
      <StatsSection />
      <Pricing />
      <CallToAction />
      <FooterSection />
    </>
  )
}

