import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/features/admin/components/admission/components/ui/select";

import { Loader2 } from "lucide-react";

export interface FloatingSelectProps {
  label: string;
  icon?: React.ReactNode;
  options: { value: string; label: string }[];
  value?: string;
  onChange?: (event: { target: { value: string; name: string } }) => void;
  name?: string;
  className?: string;
  disabled?: boolean;
  isLoading?: boolean;
}

const FloatingSelect = React.forwardRef<HTMLButtonElement, FloatingSelectProps>(
  ({ className, label, icon, options, value, onChange, name, disabled, isLoading, ...props }, ref) => {
    const [open, setOpen] = React.useState(false);
    const hasValue = !!value;

    return (
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground z-10 pointer-events-none">
            {icon}
          </div>
        )}

        <Select
          value={value}
          onValueChange={(newValue) => {
            if (onChange) {
              onChange({ target: { value: newValue, name: name || "" } });
            }
          }}
          onOpenChange={setOpen}
          disabled={disabled || isLoading}
        >
          <SelectTrigger
            ref={ref}
            className={cn(
              "h-12 w-full border-2 border-input bg-background px-3 py-2 text-sm ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 rounded-md transition-all",
              icon && "pl-10",
              className
            )}
            {...props}
          >
            <SelectValue placeholder="" />
          </SelectTrigger>
          <SelectContent className="max-h-80">
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <label
          className={cn(
            "absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground transition-all pointer-events-none bg-background px-1 z-20",
            (open || hasValue) && "top-0 text-xs text-primary",
            icon && !open && !hasValue && "left-10",
            icon && (open || hasValue) && "left-3"
          )}
        >
          {label}
        </label>

        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 z-30 bg-background flex items-center justify-center p-1 cursor-not-allowed">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
    );
  }
);

FloatingSelect.displayName = "FloatingSelect";

export { FloatingSelect };
