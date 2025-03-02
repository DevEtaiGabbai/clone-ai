export function TimeEstimates() {
    const estimates = [
      { task: "Landing page, blog and docs", hours: 20 },
      { task: "Credentials auth with all extras", hours: 38 },
      { task: "Social logins & connected accounts", hours: 4 },
      { task: "Multi-factor authentication", hours: 14 },
      { task: "Email templates", hours: 6 },
      { task: "Organizations", hours: 13 },
      { task: "Members & invites", hours: 16 },
      { task: "Billing integration", hours: 4 },
      { task: "Onboarding", hours: 4 },
      { task: "App shell", hours: 7 },
      { task: "Dashboard", hours: 9 },
      { task: "Master/detail pages", hours: 32 },
      { task: "Account settings", hours: 37 },
      { task: "API keys & webhooks", hours: 16 },
      { task: "Figure out Next caching", hours: "∞" },
    ]
  
    return (
      <section className="container mx-auto sm:px-4">
        <h2 className="mb-8 text-3xl font-bold sm:mb-12 sm:text-center md:text-4xl">Building a web app takes time</h2>
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 sm:gap-8 sm:p-4 md:grid-cols-5 md:gap-4 lg:gap-8">
          <div className="col-span-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {estimates.map((item) => (
              <div
                key={item.task}
                className="flex h-7 items-center justify-between rounded-3xl bg-neutral-50 p-4 dark:bg-neutral-800 sm:h-10"
              >
                <span className="text-sm">{item.task}</span>
                <span className="text-sm font-semibold text-neutral-600">{item.hours}h</span>
              </div>
            ))}
          </div>
          <div className="col-span-2 flex items-center justify-center">
            <div className="text-center">
              <p className="text-5xl font-bold sm:text-6xl">220+</p>
              <p className="mt-2 text-lg text-gray-600 dark:text-gray-300 sm:text-xl md:text-2xl">Hours saved</p>
              <p className="mt-4 text-sm text-muted-foreground">That&apos;s at least 27 work days.</p>
            </div>
          </div>
        </div>
      </section>
    )
  }
  
  