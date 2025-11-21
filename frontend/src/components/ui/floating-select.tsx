import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface FloatingSelectProps {
  label: string;
  icon?: React.ReactNode;
  options: { value: string; label: string }[];
  value?: string;
  onChange?: (event: { target: { value: string; name: string } }) => void;
  name?: string;
  className?: string;
  disabled?: boolean;
}

const FloatingSelect = React.forwardRef<HTMLButtonElement, FloatingSelectProps>(
  ({ className, label, icon, options, value, onChange, name, disabled, ...props }, ref) => {
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
            if (onChange && name) {
              onChange({ target: { value: newValue, name } });
            }
          }}
          onOpenChange={setOpen}
          disabled={disabled}
        >
          <SelectTrigger
            ref={ref}
            className={cn(
              "h-12 w-full border-2 border-input bg-background px-3 py-2 text-sm ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 rounded-md transition-all",
              icon && "pl-10",
              className
            )}
          >
            <SelectValue placeholder="" />
          </SelectTrigger>
          <SelectContent>
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
      </div>
    );
  }
);

FloatingSelect.displayName = "FloatingSelect";

export { FloatingSelect };
