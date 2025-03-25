import { Alert } from '@/components/ui/alert'
import { AlertTriangle, ChevronLeft } from 'lucide-react'
import React from 'react'

const FourOFour = () => {
  return (
    <div className="container mx-auto flex min-h-[calc(100vh-8rem)] items-center px-6 py-12">
  <div className="mx-auto flex max-w-sm flex-col items-center text-center">
    <p className="rounded-full bg-blue-50 p-3 text-sm font-medium dark:bg-gray-800">
      <AlertTriangle className="size-6" />
    </p>
    <h1 className="mt-3 text-2xl font-semibold text-gray-800 dark:text-white md:text-3xl">
      Page not found
    </h1>
    <p className="mt-4 text-gray-500 dark:text-gray-400">
      The page you are looking for doesn't exist.
    </p>
    <div className="group mt-6 flex w-full shrink-0 items-center gap-x-3 sm:w-auto">
      <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 h-9 px-4 py-2">
        <ChevronLeft className="size-4 transition-transform group-hover:-translate-x-1" />
        <span>Go back</span>
      </button>
      <a
        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
        href="/"
      >
        Take me home
      </a>
    </div>
  </div>
</div>
  )
}

export default FourOFour