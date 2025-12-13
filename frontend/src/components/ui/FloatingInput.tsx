import React, { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FloatingInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
}

const FloatingInput = React.forwardRef<HTMLInputElement, FloatingInputProps>(
    ({ className, label, error, value, onBlur, onFocus, ...props }, ref) => {
        const [isFocused, setIsFocused] = useState(false);
        const [hasValue, setHasValue] = useState(!!value);

        const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
            setIsFocused(true);
            onFocus?.(e);
        };

        const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
            setIsFocused(false);
            setHasValue(!!e.target.value);
            onBlur?.(e);
        };

        // Update hasValue if value prop changes externally
        React.useEffect(() => {
            setHasValue(!!value);
        }, [value]);

        const isActive = isFocused || hasValue;

        return (
            <div className="relative mb-4">
                <motion.div
                    initial={false}
                    animate={isActive ? { y: -24, scale: 0.85, color: "hsl(var(--primary))" } : { y: 0, scale: 1, color: "hsl(var(--muted-foreground))" }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="absolute left-3 top-2.5 pointer-events-none origin-top-left"
                >
                    <Label className={cn("cursor-text", error && "text-destructive")}>
                        {label}
                    </Label>
                </motion.div>
                <Input
                    ref={ref}
                    className={cn(
                        "h-12 pt-2 bg-background border-input focus-visible:ring-primary focus-visible:border-primary transition-all duration-200",
                        error && "border-destructive focus-visible:ring-destructive",
                        className
                    )}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    value={value}
                    {...props}
                />
                {error && (
                    <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-destructive mt-1 ml-1"
                    >
                        {error}
                    </motion.p>
                )}
            </div>
        );
    }
);

FloatingInput.displayName = "FloatingInput";

export { FloatingInput };
