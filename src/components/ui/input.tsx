import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> { }

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, ...props }, ref) => {
        return (
            <input
                type={type}
                className={cn(
                    "flex h-10 w-full rounded-md border border-solar-base1 bg-solar-base3 px-3 py-2 text-sm ring-offset-solar-base3 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-solar-base1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-solar-blue focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-solar-base00",
                    className
                )}
                ref={ref}
                {...props}
            />
        )
    }
)
Input.displayName = "Input"

export { Input }
