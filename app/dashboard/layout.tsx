interface DashboardLayoutProps {
  children: React.ReactNode
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen">
        {children}
    </div>
  )
}
