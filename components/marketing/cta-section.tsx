import { Button } from "@/components/ui/button"

export function CtaSection() {
  return (
    <section className="container relative">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-8">
        <h2 className="text-center text-3xl font-semibold leading-tight tracking-tighter md:text-5xl lg:leading-[1.1]">
          Want to book a call?
        </h2>
        <div className="flex animate-fade-in flex-row items-center gap-2 transition duration-300">
          <Button variant="outline" className="rounded-full" asChild>
            <a href="https://x.com/achromaticlabs" target="_blank" rel="noreferrer">
              Write a DM on
              <svg
                className="ml-1 h-3 w-3 fill-current"
                height="23"
                viewBox="0 0 1200 1227"
                width="23"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M714.163 519.284L1160.89 0H1055.03L667.137 450.887L357.328 0H0L468.492 681.821L0 1226.37H105.866L515.491 750.218L842.672 1226.37H1200L714.137 519.284H714.163ZM569.165 687.828L521.697 619.934L144.011 79.6944H306.615L611.412 515.685L658.88 583.579L1055.08 1150.3H892.476L569.165 687.854V687.828Z" />
              </svg>
            </a>
          </Button>
          <Button variant="outline" className="rounded-full" asChild>
            <a href="/contact">Use contact form</a>
          </Button>
        </div>
      </div>
    </section>
  )
}

