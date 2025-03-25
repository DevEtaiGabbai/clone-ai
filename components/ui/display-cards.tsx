"use client";

import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

interface DisplayCardProps {
  className?: string;
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  date?: string;
  iconClassName?: string;
  titleClassName?: string;
}

function DisplayCard({
  className,
  icon = <Sparkles className="size-4 text-blue-300" />,
  title = "Featured",
  description = "Discover amazing content",
  date = "Just now",
  iconClassName = "text-blue-500",
  titleClassName = "text-blue-500",
}: DisplayCardProps) {
  return (
    <div
      className={cn(
        "relative flex h-36 w-[22rem] -skew-y-[5deg] select-none flex-col justify-between rounded-xl border-2 bg-zinc-900/90 backdrop-blur-sm px-5 py-4 transition-all duration-300 shadow-lg hover:shadow-blue-500/10 hover:border-blue-500/20 hover:bg-zinc-900/95 [&>*]:flex [&>*]:items-center [&>*]:gap-2",
        className
      )}
    >
      <div>
        <span className="relative inline-block rounded-full bg-blue-800/80 p-1">
          {icon}
        </span>
        <p className={cn("text-lg font-medium", titleClassName)}>{title}</p>
      </div>
      <p className="whitespace-nowrap text-lg text-zinc-300">{description}</p>
      <p className="text-zinc-400 text-sm">{date}</p>
    </div>
  );
}

interface DisplayCardsProps {
  cards?: DisplayCardProps[];
}

export default function DisplayCards({ cards }: DisplayCardsProps) {
  const defaultCards = [
    {
      className: "[grid-area:stack] hover:-translate-y-10 hover:translate-x-2 transition-all duration-500 ease-out before:absolute before:w-full before:h-full before:rounded-xl before:bg-gradient-to-t before:from-black/50 before:to-transparent before:content-[''] grayscale-[80%] hover:grayscale-0 before:opacity-70 hover:before:opacity-0 before:transition-all",
    },
    {
      className: "[grid-area:stack] translate-x-16 translate-y-10 hover:translate-y-2 hover:translate-x-14 transition-all duration-500 ease-out before:absolute before:w-full before:h-full before:rounded-xl before:bg-gradient-to-t before:from-black/50 before:to-transparent before:content-[''] grayscale-[80%] hover:grayscale-0 before:opacity-70 hover:before:opacity-0 before:transition-all",
    },
    {
      className: "[grid-area:stack] translate-x-32 translate-y-20 hover:translate-y-12 hover:translate-x-28 transition-all duration-500 ease-out",
    },
  ];

  const displayCards = cards || defaultCards;

  return (
    <div className="grid [grid-template-areas:'stack'] place-items-center opacity-100 animate-in fade-in-0 duration-700 scale-90">
      {displayCards.map((cardProps, index) => (
        <DisplayCard key={index} {...cardProps} />
      ))}
    </div>
  );
}