"use client"

import Link from "next/link"
import { Menu, X } from "lucide-react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/ui/icons"

export function LpHeader() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <nav
      data-is-scrolled={isScrolled}
      aria-label="Main navigation"
      className="w-full max-w-[calc(var(--page-max-w)-2rem)] mx-auto top-0 h-[92px] lg:h-[104px] sticky group transition-[max-width] duration-[0.45s] ease-[cubic-bezier(.6,.6,0,1)] flex shrink-0 items-center text-[#605A57] px-4 lg:max-w-[var(--page-max-w)] z-50"
      style={
        {
          "--page-max-w": "1400px",
          "--nav-padding": "0.75rem",
        } as React.CSSProperties
      }
    >
      <div 
        role="navigation"
        className="w-full flex items-center text-sm h-[60px] p-[0.75rem] rounded-[1rem] transition-[box-shadow,background-color] duration-[0.45s] ease-[cubic-bezier(.6,.6,0,1)] group-data-[is-scrolled=true]:bg-background group-data-[is-scrolled=true]:[box-shadow:0_0_2px_#5f4a2e14,0_2px_3px_#5f4a2e0a,0_4px_6px_#5f4a2e0a,0_20px_32px_-12px_#5f4a2e1f]"
      >
        <div className="w-full flex items-center text-sm h-[60px] p-[0.75rem] rounded-[1rem] transition-[box-shadow,background-color] duration-[0.45s] ease-[cubic-bezier(.6,.6,0,1)] group-data-[is-scrolled=true]:bg-background group-data-[is-scrolled=true]:[box-shadow:0_0_2px_#5f4a2e14,0_2px_3px_#5f4a2e0a,0_4px_6px_#5f4a2e0a,0_20px_32px_-12px_#5f4a2e1f]">
          <div className="flex h-full w-full items-center justify-between">
            <Link
              href="/"
              className="active:scale-95 active:opacity-80 transition-[transform,opacity] gap-1.5 flex items-center"
            >
              <Icons.logo className="h-12 w-12" />
              <span className="text-xl leading-none tracking-tight font-medium text-[#36322f]">CloneAI</span>
            </Link>

            <div className="hidden lg:block absolute left-1/2 -translate-x-1/2">
              <div className="flex items-center justify-between gap-2">
                <Link
                  href="/playground"
                  className="h-9 rounded-[10px] text-sm flex items-center transition-all duration-200 bg-transparent text-[#605A57] hover:bg-[#f0f0f0] px-2.5 py-1"
                >
                  Playground
                </Link>
                <Link
                  href="/docs"
                  className="h-9 rounded-[10px] text-sm flex items-center transition-all duration-200 bg-transparent text-[#605A57] hover:bg-[#f0f0f0] px-2.5 py-1"
                >
                  Docs
                </Link>
                <Link
                  href="/pricing"
                  className="h-9 rounded-[10px] text-sm flex items-center transition-all duration-200 bg-transparent text-[#605A57] hover:bg-[#f0f0f0] px-2.5 py-1"
                >
                  Pricing
                </Link>
                <Link
                  href="/blog"
                  className="h-9 rounded-[10px] text-sm flex items-center transition-all duration-200 bg-transparent text-[#605A57] hover:bg-[#f0f0f0] px-2.5 py-1"
                >
                  Blog
                </Link>
                <Link
                  href="/extract"
                  className="h-9 rounded-[10px] text-sm flex items-center transition-all duration-200 bg-transparent text-[#605A57] hover:bg-[#f0f0f0] px-2.5 py-1"
                >
                  Extract
                  <span className="ml-2 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-600 dark:bg-orange-900 dark:text-orange-300">
                    New
                  </span>
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden lg:flex lg:items-center lg:gap-4">
                <Link
                  href="/signin/signup"
                  className="h-9 rounded-[10px] text-sm font-medium flex items-center transition-all duration-200 bg-[#fff] text-[#36322F] hover:bg-[#f0f0f0] px-2.5 py-1 [box-shadow:0_0_0_1px_hsl(35deg_22%_90%),_0_1px_2px_hsl(32,_10%,_68%),_0_3px_3px_hsl(32,11%,82%),_0_-2px_hsl(58,4%,93%)_inset] hover:translate-y-[1px] hover:scale-[0.98] hover:[box-shadow:0_0_0_1px_hsl(35deg_22%_90%),_0_1px_2px_hsl(32,_10%,_68%)] active:translate-y-[2px] active:scale-[0.97] active:[box-shadow:0_0_0_1px_hsl(35deg_22%_90%),_inset_0_1px_1px_hsl(32,_10%,_68%)]"
                >
                  Sign Up
                </Link>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-expanded={isMobileMenuOpen}
                aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

