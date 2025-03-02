import { CircleIcon } from "lucide-react"

export function TechStack() {
  const technologies = [
    { name: "Next 15", icon: "N" },
    { name: "React 19", icon: "⚛️" },
    { name: "Auth.js 5", icon: "🔐" },
    { name: "Prisma", icon: "▲" },
    { name: "react-email", icon: "📧" },
    { name: "nuqs", icon: "🔍" },
    { name: "next-safe-action", icon: "⚡" },
    { name: "Stripe", icon: "💳" },
    { name: "Tailwind", icon: "🌊" },
    { name: "shadcn/ui", icon: "⚡" },
    { name: "Typescript", icon: "TS" },
    { name: "zod", icon: "Z" },
  ]

  return (
    <section className="container relative">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-20 xl:gap-24">
        <div className="order-1 space-y-8 lg:max-w-lg">
          <h2 className="text-3xl font-bold leading-tight">Solid foundation</h2>
          <div className="text-lg font-light text-muted-foreground">
            <p>Achromatic uses top-tier libraries and tools to make development easier and faster, including</p>
            <ul className="mt-4 space-y-1 text-base sm:text-lg lg:mt-3 lg:space-y-0.5">
              {technologies.map((tech) => (
                <li key={tech.name} className="flex items-start">
                  <CircleIcon className="mr-2 mt-1.5 h-4 w-4 shrink-0" />
                  <span>
                    <strong className="font-semibold text-foreground">{tech.name}</strong>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="order-2">
          <div className="relative z-10 col-span-1 flex w-full flex-col justify-between rounded-xl border p-3">
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {technologies.map((tech) => (
                <div
                  key={tech.name}
                  className="relative z-20 flex aspect-square items-center justify-center rounded-xl bg-neutral-50 text-card-foreground dark:bg-neutral-900 lg:aspect-auto"
                >
                  <div className="relative flex flex-col items-center gap-4 p-2 lg:p-4 xl:p-6">
                    <div className="h-7 max-h-7 shrink-0">{tech.icon}</div>
                    <p className="whitespace-nowrap text-sm font-medium">{tech.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

