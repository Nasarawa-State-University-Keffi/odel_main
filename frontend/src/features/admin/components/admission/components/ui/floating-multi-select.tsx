import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/features/admin/components/admission/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/features/admin/components/admission/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/features/admin/components/admission/components/ui/popover";
import { Badge } from "@/features/admin/components/admission/components/ui/badge";

export interface Option {
    label: string;
    value: string;
}

export interface FloatingMultiSelectProps {
    label: string;
    options: Option[];
    selected?: string[];
    onChange?: (values: string[]) => void;
    className?: string;
    disabled?: boolean;
}

const FloatingMultiSelect = React.forwardRef<HTMLButtonElement, FloatingMultiSelectProps>(
    ({ className, label, options, selected = [], onChange, disabled, ...props }, ref) => {
        const [open, setOpen] = React.useState(false);

        const handleUnselect = (item: string) => {
            onChange?.(selected.filter((i) => i !== item));
        };

        const handleSelect = (item: string) => {
            if (selected.includes(item)) {
                handleUnselect(item);
            } else {
                onChange?.([...selected, item]);
            }
        };

        const hasValue = selected.length > 0;

        return (
            <div className="relative">
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            ref={ref}
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            disabled={disabled}
                            className={cn(
                                "h-auto min-h-[48px] w-full justify-between hover:bg-background bg-background px-3 py-2 text-sm font-normal border-2 border-input ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 rounded-md transition-all",
                                className
                            )}
                        >
                            <div className="flex flex-wrap gap-1 pt-2">
                                {selected.map((item) => (
                                    <Badge variant="secondary" key={item} className="mr-1 mb-1">
                                        {options.find((option) => option.value === item)?.label || item}
                                        <div
                                            className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    handleUnselect(item);
                                                }
                                            }}
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                            }}
                                            onClick={() => handleUnselect(item)}
                                        >
                                            <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                        </div>
                                    </Badge>
                                ))}
                            </div>
                            {selected.length === 0 && <span className="text-muted-foreground opacity-0">Placeholder</span>}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 absolute right-3 top-1/2 -translate-y-1/2" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                        <Command>
                            <CommandInput placeholder={`Search ${label.toLowerCase()}...`} />
                            <CommandList>
                                <CommandEmpty>No {label.toLowerCase()} found.</CommandEmpty>
                                <CommandGroup className="max-h-64 overflow-auto">
                                    {options.map((option) => (
                                        <CommandItem
                                            key={option.value}
                                            onSelect={() => handleSelect(option.value)}
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    selected.includes(option.value)
                                                        ? "opacity-100"
                                                        : "opacity-0"
                                                )}
                                            />
                                            {option.label}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>

                <label
                    className={cn(
                        "absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground transition-all pointer-events-none bg-background px-1 z-20",
                        (open || hasValue) && "top-0 text-xs text-primary"
                    )}
                >
                    {label}
                </label>
            </div>
        );
    }
);

FloatingMultiSelect.displayName = "FloatingMultiSelect";

export { FloatingMultiSelect };
