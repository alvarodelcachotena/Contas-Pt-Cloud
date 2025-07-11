import * as React from "react"
import { cn } from "@/lib/utils"

interface SelectContextType {
  value: string
  onValueChange: (value: string) => void
  open: boolean
  onOpenChange: (open: boolean) => void
}

const SelectContext = React.createContext<SelectContextType | undefined>(undefined)

export interface SelectProps {
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
}

export function Select({ value = "", onValueChange, children }: SelectProps) {
  const [open, setOpen] = React.useState(false)
  const [internalValue, setInternalValue] = React.useState(value)

  const handleValueChange = (newValue: string) => {
    setInternalValue(newValue)
    onValueChange?.(newValue)
    setOpen(false)
  }

  return (
    <SelectContext.Provider value={{ 
      value: internalValue, 
      onValueChange: handleValueChange,
      open,
      onOpenChange: setOpen 
    }}>
      {children}
    </SelectContext.Provider>
  )
}

export interface SelectTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export function SelectTrigger({ className, children, ...props }: SelectTriggerProps) {
  const context = React.useContext(SelectContext)
  if (!context) {
    throw new Error("SelectTrigger must be used within a Select component")
  }

  return (
    <button
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      onClick={() => context.onOpenChange(!context.open)}
      {...props}
    >
      {children}
    </button>
  )
}

export interface SelectValueProps extends React.HTMLAttributes<HTMLSpanElement> {
  placeholder?: string
}

export function SelectValue({ placeholder, className, ...props }: SelectValueProps) {
  const context = React.useContext(SelectContext)
  if (!context) {
    throw new Error("SelectValue must be used within a Select component")
  }

  return (
    <span className={cn("", className)} {...props}>
      {context.value || placeholder}
    </span>
  )
}

export interface SelectContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export function SelectContent({ className, children, ...props }: SelectContentProps) {
  const context = React.useContext(SelectContext)
  if (!context) {
    throw new Error("SelectContent must be used within a Select component")
  }

  if (!context.open) {
    return null
  }

  return (
    <div
      className={cn(
        "relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md",
        className
      )}
      {...props}
    >
      <div className="p-1">
        {children}
      </div>
    </div>
  )
}

export interface SelectItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
}

export function SelectItem({ value, className, children, ...props }: SelectItemProps) {
  const context = React.useContext(SelectContext)
  if (!context) {
    throw new Error("SelectItem must be used within a Select component")
  }

  return (
    <div
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      onClick={() => context.onValueChange(value)}
      {...props}
    >
      {children}
    </div>
  )
}