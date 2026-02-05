import * as React from "react"
import { cn } from "../../lib/utils"

interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
    className?: string
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
    ({ className, ...props }, ref) => {
        return (
            <label className={cn(
                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                props.checked ? "bg-blue-600" : "bg-gray-200",
                className
            )}>
                <input
                    type="checkbox"
                    className="sr-only"
                    ref={ref}
                    {...props}
                />
                <span
                    className={cn(
                        "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform",
                        props.checked ? "translate-x-5" : "translate-x-1"
                    )}
                />
            </label>
        )
    }
)
Switch.displayName = "Switch"

export { Switch }
