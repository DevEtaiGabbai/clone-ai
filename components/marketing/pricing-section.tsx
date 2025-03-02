import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"

export function PricingSection() {
  return (
    <section className="container relative">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 gap-12 lg:gap-20 xl:grid-cols-2 xl:gap-24">
          <div className="order-1 space-y-8 lg:max-w-lg">
            <h2 className="text-3xl font-bold leading-tight lg:max-w-lg">Pay once, own it forever</h2>
            <p className="text-lg font-light text-muted-foreground">
              Upon purchase, you can use the starter kit for personal and commercial projects with no restrictions on
              the number of developers or projects.{" "}
              <a href="/LICENSE" download="LICENSE" className="underline">
                Click here to download license.
              </a>
              <br />
              <br />
              <span>
                Achromatic is 2-4 times more affordable than comparable Next.js starter kit alternatives. There is no
                catch, we are just cheaper and not overpriced.
              </span>
            </p>
          </div>
          <div className="order-2">
            <div className="border text-card-foreground rounded-xl bg-neutral-50 p-3 shadow-none dark:bg-neutral-900">
              <div className="rounded-xl border bg-background p-8 shadow-sm">
                <div className="flex flex-col lg:flex-row lg:items-center lg:divide-x">
                  <div className="space-y-6 lg:pr-6">
                    <div>
                      <div className="flex items-baseline gap-x-2">
                        <span className="text-[40px] font-bold tracking-tight text-foreground">$180</span>
                        <span className="text-sm font-semibold leading-6 tracking-wide text-muted-foreground">USD</span>
                      </div>
                      <div className="text-sm text-muted-foreground">Lifetime updates</div>
                    </div>
                    <Button className="rounded-full w-full" asChild>
                      <a href="https://buy.stripe.com/9AQ3dz33pfybaic4gg" target="_blank" rel="noreferrer">
                        Purchase
                      </a>
                    </Button>
                  </div>
                  <ul className="space-y-3 lg:pl-6">
                    <li className="flex items-start space-x-3">
                      <Check className="h-4 w-4 mt-1" />
                      <span className="text-sm text-muted-foreground">Next 15 & React 19</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <Check className="h-4 w-4 mt-1" />
                      <span className="text-sm text-muted-foreground">
                        Auth, billing, emails, members, invites, organizations, onboarding, profile, dashboard, API
                        keys, webhooks and more
                      </span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <Check className="h-4 w-4 mt-1" />
                      <span className="text-sm text-muted-foreground">Unlimited developers/projects</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <Check className="h-4 w-4 mt-1" />
                      <span className="text-sm text-muted-foreground">Personal and commercial usage</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

