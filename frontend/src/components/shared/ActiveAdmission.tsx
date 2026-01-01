import React, { useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useActiveAdmissions, type Admission } from '@/hooks/useActiveAdmission';

interface ActiveAdmissionProps {
    selectedId: number | null;
    onSelect: (id: number | null) => void;
    className?: string;
    programmeType?: string;
}

const ActiveAdmission: React.FC<ActiveAdmissionProps> = ({ selectedId, onSelect, className, programmeType }) => {
    const { admissions, loading, error } = useActiveAdmissions(programmeType);
    // Auto-select first if only one and none selected
    useEffect(() => {
        if (Array.isArray(admissions) && admissions.length === 1 && selectedId === null) {
            onSelect(admissions[0].id);
        }
    }, [admissions, selectedId, onSelect]);

    // Determine placeholder text based on state
    let placeholder = "Select an available admission";
    let isDisabled = false;

    if (loading) {
        placeholder = "Loading available admissions...";
        isDisabled = true;
    } else if (error) {
        placeholder = "Error loading available admissions";
        isDisabled = true;
    } else if (!Array.isArray(admissions) || admissions.length === 0) {
        placeholder = "No available admissions available";
        isDisabled = true;
    }

    // Helper to truncate admission name to "Admission for [Semester] [Year/Year]"
    const formatAdmissionName = (name: string) => {
        const match = name.match(/Admission for .*?\d{4}\/\d{4}/i);
        return match ? match[0] : name;
    };

    return (
        <div className={className}>
            <label className="block text-sm font-medium mb-2 text-foreground">Available Admission *</label>
            <Select
                value={selectedId?.toString() || ''}
                onValueChange={(value) => onSelect(value ? parseInt(value) : null)}
                disabled={isDisabled}
            >
                <SelectTrigger className={`w-full ${error ? "border-destructive" : ""}`}>
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                    {Array.isArray(admissions) && admissions.length > 0 ? (
                        admissions.map((adm: Admission) => (
                            <SelectItem
                                key={adm.id}
                                value={adm.id.toString()}
                                className="flex items-center justify-between"
                            >
                                <span className="font-medium">
                                    {formatAdmissionName(adm.name)}
                                </span>

                                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                                    {adm.admissionMode}
                                    <span
                                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${adm.open
                                                ? "bg-green-100 text-green-700"
                                                : "bg-red-100 text-red-700"
                                            }`}
                                    >
                                        {adm.open ? "Open" : "Closed"}
                                    </span>
                                </span>
                            </SelectItem>
                        ))
                    ) : (
                        <SelectItem value="none" disabled>
                            No options available
                        </SelectItem>
                    )}
                </SelectContent>
            </Select>
            {error && (
                <p className="text-xs text-destructive mt-1">{error}</p>
            )}
        </div>
    );
};

export default ActiveAdmission;
