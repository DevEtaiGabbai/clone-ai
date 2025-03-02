import { AnnouncementBanner } from "@/components/marketing/announcement-banner"
import { LpHeader } from "@/components/marketing/lp-header"
import { SiteFooter } from "@/components/marketing/site-footer"

interface MarketingLayoutProps {
  children: React.ReactNode
}

export default function MarketingLayout({ children }: MarketingLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <AnnouncementBanner />
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <LpHeader />
        <main className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </div>
    </div>
  )
}

