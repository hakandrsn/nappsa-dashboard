import * as React from "react"
import { cn } from "@/lib/utils"

interface RadioGroupProps {
  value?: string
  onValueChange?: (value: string) => void
  className?: string
  children: React.ReactNode
}

interface RadioGroupItemProps {
  value: string
  id: string
  children: React.ReactNode
  className?: string
}

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ className, value, onValueChange, children, ...props }, ref) => {
    return (
      <div
        className={cn("grid gap-2", className)}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    )
  }
)
RadioGroup.displayName = "RadioGroup"

const RadioGroupItem = React.forwardRef<HTMLInputElement, RadioGroupItemProps & { checked?: boolean; onChange?: () => void }>(
  ({ className, value, id, children, checked, onChange, ...props }, ref) => {
    return (
      <div className="flex items-center space-x-2">
        <input
          type="radio"
          id={id}
          value={value}
          checked={checked}
          onChange={onChange}
          className={cn(
            "aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          {...props}
        />
        <label htmlFor={id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {children}
        </label>
      </div>
    )
  }
)
RadioGroupItem.displayName = "RadioGroupItem"

export { RadioGroup, RadioGroupItem }
