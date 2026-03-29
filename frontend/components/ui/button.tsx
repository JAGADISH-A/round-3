import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-orbitron tracking-widest transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500 disabled:pointer-events-none disabled:opacity-50 active:scale-95",
  {
    variants: {
      variant: {
        default: "bg-cyan-500/10 border border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/30 hover:shadow-[0_0_20px_rgba(0,255,255,0.3)] hover:text-white",
        destructive:
          "bg-red-500/10 border border-red-500/40 text-red-500 hover:bg-red-500/30 hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]",
        outline:
          "border border-cyan-500/20 bg-transparent hover:bg-cyan-500/10 hover:border-cyan-500/50 hover:text-cyan-400",
        secondary:
          "bg-zinc-800 border border-zinc-700 text-zinc-400 hover:bg-zinc-700 hover:text-white",
        ghost: "hover:bg-cyan-500/10 hover:text-cyan-400",
        link: "text-cyan-400 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-6 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-10 text-base",
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
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
