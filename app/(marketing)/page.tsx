import { HeroSection } from "@/components/marketing/hero-section"
import { TimeEstimates } from "@/components/marketing/time-estimates"
import { TechStack } from "@/components/marketing/tech-stack"
import { PricingSection } from "@/components/marketing/pricing-section"
import { FaqSection } from "@/components/marketing/faq-section"
import { CtaSection } from "@/components/marketing/cta-section"

export default function HomePage() {
  return (
    <div className="space-y-24 sm:space-y-32">
      <HeroSection />
      <TimeEstimates />
      <TechStack />
      <PricingSection />
      <FaqSection />
      <CtaSection />
    </div>
  )
}

