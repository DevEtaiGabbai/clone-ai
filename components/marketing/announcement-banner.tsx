"use client"

import Link from "next/link"
import { ArrowRight, FileText } from "lucide-react"

export function AnnouncementBanner() {
  return (
    <div className="relative overflow-hidden bg-orange-100 py-1">
      <div className="absolute inset-0 bg-gradient-to-r from-orange-100 via-orange-50 to-orange-200 opacity-90" />
      <div className="relative z-10 flex items-center justify-center gap-4 py-1 px-4">
        <div className="flex items-center gap-3 text-sm text-orange-600">
          <div className="relative h-4 w-4 -mr-1">
            <FileText className="text-orange-600" size={16} />
          </div>
          <span className="font-medium">Introducing /extract - Get web data with a prompt</span>
          <Link
            href="/extract"
            className="hidden sm:inline-flex rounded-full items-center gap-1 bg-orange-600 px-3 py-[1px] font-medium text-orange-100 hover:bg-orange-700 transition-colors"
          >
            Try now
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/extract"
            className="sm:hidden inline-flex rounded-full items-center bg-orange-600 px-2 py-[1px] font-medium text-orange-100 hover:bg-orange-700 transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}

