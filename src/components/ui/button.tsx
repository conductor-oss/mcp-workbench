/*
 * Copyright 2026 Orkes, Inc.
 *
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 *
 * https://opensource.org/licenses/MIT
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
 * an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations under the License.
 */

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap rounded-sm text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terminal-cyan focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 font-mono uppercase tracking-wide",
    {
        variants: {
            variant: {
                default: "bg-terminal-green text-terminal-bg hover:bg-terminal-cyan hover:shadow-[0_0_10px_rgba(95,179,129,0.5)] border border-terminal-green/50",
                destructive:
                    "bg-terminal-red text-white hover:bg-terminal-red/90 hover:shadow-[0_0_10px_rgba(255,107,107,0.5)] border border-terminal-red/50",
                outline:
                    "border border-terminal-cyan/50 bg-transparent text-terminal-cyan hover:bg-terminal-cyan hover:text-terminal-bg hover:shadow-[0_0_10px_rgba(0,217,255,0.5)]",
                secondary:
                    "bg-terminal-surface text-terminal-text border border-terminal-border/30 hover:border-terminal-cyan hover:text-terminal-cyan",
                ghost: "hover:bg-terminal-surface hover:text-terminal-green border border-transparent hover:border-terminal-green/50",
                link: "text-terminal-cyan underline-offset-4 hover:underline hover:text-terminal-green",
            },
            size: {
                default: "h-10 px-4 py-2",
                sm: "h-9 rounded-sm px-3 text-xs",
                lg: "h-11 rounded-sm px-8",
                icon: "h-10 w-10",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        return (
            <button
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button, buttonVariants }
