import Link from "next/link"
import { Github, Twitter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/marketing/mode-toggle"

export function SiteFooter() {
  return (
    <footer className="relative py-16 mt-32 border-t border-border/40">
      <div className="container">
        <div className="flex-start md:flex-center flex flex-col justify-between gap-8 px-2 md:flex-row md:gap-0">
          <span className="text-sm text-muted-foreground">
            Copyright © {new Date().getFullYear()} - {new Date().getFullYear() + 1} Achromatic. All rights reserved.
          </span>
          <nav className="flex-start flex items-center gap-2">
            <Link
              href="https://achromatic.betteruptime.com/"
              target="_blank"
              className="whitespace-nowrap rounded-md text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 flex w-fit items-center justify-between p-2 font-normal"
            >
              <small className="text-sm">Status:</small>
              <div className="mx-2 inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-blue-500"></div>
              <small className="text-sm">All systems normal</small>
            </Link>
            <Button variant="ghost" size="icon" asChild>
              <Link href="https://github.com/achromaticlabs/pro" target="_blank" rel="noreferrer">
                <Github className="h-4 w-4" />
                <span className="sr-only">GitHub</span>
              </Link>
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <Link href="https://x.com/achromaticlabs" target="_blank" rel="noreferrer">
                <Twitter className="h-4 w-4" />
                <span className="sr-only">Twitter</span>
              </Link>
            </Button>
            <ModeToggle />
          </nav>
        </div>
      </div>
    </footer>
  )
}

