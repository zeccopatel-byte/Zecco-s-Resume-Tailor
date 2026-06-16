import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "@/src/lib/utils"

const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean, variant?: "default" | "outline" | "ghost" }>(
  ({ className, variant = "default", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
          "h-10 px-4 py-2",
          variant === "default" && "bg-white/10 text-white hover:bg-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] border border-white/10 backdrop-blur-md",
          variant === "outline" && "border border-white/20 bg-transparent text-white hover:bg-white/10 backdrop-blur-sm",
          variant === "ghost" && "bg-transparent text-white hover:bg-white/10",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
