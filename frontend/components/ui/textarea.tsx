import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import * as React from "react"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <div className="relative group">
        <textarea
          className={cn(
            "flex min-h-[100px] w-full bg-cyan-500/5 border border-cyan-500/20 px-4 py-3 text-sm font-tech tracking-wider text-cyan-50 placeholder:text-cyan-500/30 focus-visible:outline-none focus-visible:border-cyan-500/60 focus-visible:ring-1 focus-visible:ring-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50 transition-all",
            className
          )}
          style={{ clipPath: 'polygon(0 0, 98% 0, 100% 15%, 100% 100%, 2% 100%, 0 85%)' }}
          ref={ref}
          {...props}
        />
        {/* Input Decorators */}
        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-500/40" />
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-500/40" />
      </div>
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
