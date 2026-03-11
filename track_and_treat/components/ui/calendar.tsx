"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]

function getDateRange(centerDate: Date, past = 7, future = 7): Date[] {
  const dates: Date[] = []
  for (let i = -past; i <= future; i++) {
    const d = new Date(centerDate)
    d.setDate(centerDate.getDate() + i)
    d.setHours(0, 0, 0, 0)
    dates.push(d)
  }
  return dates
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function formatHeaderDate(date: Date) {
  return `${DAYS[date.getDay()]}, ${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`
}

interface CalendarProps {
  selected?: Date
  onSelect?: (date: Date) => void
  className?: string
  /** dot indicators: array of dates that should show a dot */
  markedDates?: Date[]
}

export function Calendar({
  selected,
  onSelect,
  className,
  markedDates = [],
}: CalendarProps) {
  const today = React.useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const [centerDate, setCenterDate] = React.useState<Date>(today)
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const todayRef = React.useRef<HTMLButtonElement>(null)

  // Auto-update center to today every day
  React.useEffect(() => {
    const interval = setInterval(() => {
      const newToday = new Date()
      newToday.setHours(0, 0, 0, 0)
      setCenterDate(newToday)
    }, 60_000)
    return () => clearInterval(interval)
  }, [])

  const dates = React.useMemo(() => getDateRange(centerDate, 7, 7), [centerDate])

  // Scroll today into center on mount / when centerDate changes
  React.useEffect(() => {
    setTimeout(() => {
      todayRef.current?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" })
    }, 50)
  }, [centerDate])

  function shiftDays(by: number) {
    setCenterDate(prev => {
      const d = new Date(prev)
      d.setDate(d.getDate() + by)
      return d
    })
  }

  const isMarked = (date: Date) =>
    markedDates.some(m => isSameDay(m, date))

  const displayDate = selected ?? today

  return (
    <div className={cn("w-full select-none", className)}>
      {/* Header: current selected date label */}
      <div className="mb-3 flex items-center justify-between px-1">
        <span
          className="text-sm font-semibold tracking-wide text-foreground"
          style={{ fontFamily: "'Syne', sans-serif" }}
        >
          {formatHeaderDate(displayDate)}
        </span>
        <button
          onClick={() => { setCenterDate(today); onSelect?.(today) }}
          className="rounded-full m-7 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary transition hover:bg-primary/20"
        >
          Today
        </button>
      </div>

      {/* Scroll row */}
      <div className="relative flex items-center gap-1 m-7 px-32 justify-center">
        {/* Left arrow */}
        <button
          onClick={() => shiftDays(-7)}
          className="shrink-0 rounded-full p-3 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          aria-label="Previous week"
        >
          <ChevronLeftIcon className="size-4" />
        </button>

        {/* Scrollable dates */}
        <div
          ref={scrollRef}
          className="flex flex-1 gap-1.5 overflow-x-auto scroll-smooth pb-1"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&display=swap');
            div::-webkit-scrollbar { display: none; }
          `}</style>

          {dates.map((date) => {
            const isToday    = isSameDay(date, today)
            const isSelected = selected ? isSameDay(date, selected) : false
            const isPast     = date < today
            const marked     = isMarked(date)

            return (
              <button
                key={date.toISOString()}
                ref={isToday ? todayRef : undefined}
                onClick={() => onSelect?.(date)}
                aria-label={formatHeaderDate(date)}
                aria-pressed={isSelected}
                className={cn(
                  "relative flex shrink-0 flex-col items-center justify-center gap-0.5",
                  "h-16 w-11 rounded-2xl border text-center transition-all duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                  // Base
                  !isSelected && !isToday &&
                    "border-border bg-background text-foreground hover:border-primary/40 hover:bg-primary/5",
                  // Today (not selected)
                  isToday && !isSelected &&
                    "border-primary/60 bg-primary/5 text-primary",
                  // Selected
                  isSelected &&
                    "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-105",
                  // Past + not selected: slightly muted
                  isPast && !isSelected && !isToday &&
                    "opacity-60",
                )}
              >
                {/* Day label */}
                <span className={cn(
                  "text-[10px] font-semibold uppercase tracking-widest leading-none",
                  isSelected ? "text-primary-foreground/80" : "text-muted-foreground",
                  isToday && !isSelected && "text-primary/70",
                )}>
                  {DAYS[date.getDay()].slice(0, 2)}
                </span>

                {/* Date number */}
                <span className={cn(
                  "text-base font-bold leading-none",
                  isSelected
                    ? "text-primary-foreground"
                    : isToday
                      ? "text-primary"
                      : "text-foreground",
                )}>
                  {date.getDate()}
                </span>

                {/* Month label (only on 1st of month or first visible) */}
                {date.getDate() === 1 && (
                  <span className={cn(
                    "text-[9px] font-medium leading-none",
                    isSelected ? "text-primary-foreground/60" : "text-muted-foreground/70",
                  )}>
                    {MONTHS[date.getMonth()]}
                  </span>
                )}

                {/* Dot indicator for marked dates */}
                {marked && (
                  <span className={cn(
                    "absolute bottom-1.5 size-1 rounded-full",
                    isSelected ? "bg-primary-foreground" : "bg-primary"
                  )} />
                )}
              </button>
            )
          })}
        </div>

        {/* Right arrow */}
        <button
          onClick={() => shiftDays(7)}
          className="shrink-0 rounded-full p-3 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          aria-label="Next week"
        >
          <ChevronRightIcon className="size-4" />
        </button>
      </div>
    </div>
  )
}

export { Calendar as default }