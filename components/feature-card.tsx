import type React from "react"
import type { ReactNode } from "react"

interface FeatureCardProps {
  icon: ReactNode
  title: string
  description: string
  children?: ReactNode
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, children }) => {
  return (
    <div className="rounded-lg border border-zinc-200 text-zinc-950 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 p-0 bg-transparent border-none">
      <div className="p-2 flex items-center justify-center w-fit border border-zinc-100/10 rounded-lg bg-zinc-200/10 text-zinc-100">
        {icon}
      </div>
      <h4 className="font-medium text-zinc-100 mt-4 mb-2">{title}</h4>
      <p className="text-sm text-zinc-400 mb-4">{description}</p>
      {children}
    </div>
  )
}

export default FeatureCard

