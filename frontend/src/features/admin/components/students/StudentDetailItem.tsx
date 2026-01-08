import { Label } from "@/features/admin/components/admission/components/ui/label";

interface DetailItemProps {
    label: string;
    value: string | undefined | null;
    icon?: any;
    className?: string;
}

export const DetailItem = ({
    label,
    value,
    icon: Icon,
    className = "",
}: DetailItemProps) => (
    <div className={`space-y-1.5 ${className}`}>
        <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground flex items-center gap-1.5">
            {Icon && <Icon className="h-3 w-3 opacity-70" />}
            {label}
        </Label>
        <p className="font-medium text-sm text-foreground/90 pl-0.5">
            {value || <span className="text-muted-foreground/40 italic text-xs">Not Recorded</span>}
        </p>
    </div>
);
