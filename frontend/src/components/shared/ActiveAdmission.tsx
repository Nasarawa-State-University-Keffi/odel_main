// src/components/ActiveAdmission.tsx
// Updated with real schema match, guards, and 'open' instead of 'status'
import React, { useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useActiveAdmissions, type Admission } from '@/hooks/useActiveAdmission';

interface ActiveAdmissionProps {
    selectedId: number | null;
    onSelect: (id: number | null) => void;
    className?: string;
}

const ActiveAdmission: React.FC<ActiveAdmissionProps> = ({ selectedId, onSelect, className }) => {
    const { admissions, loading, error } = useActiveAdmissions();

    // Debug: Log before processing
    console.log('Admissions state:', admissions, typeof admissions, Array.isArray(admissions));

    // Auto-select first if only one and none selected
    useEffect(() => {
        if (Array.isArray(admissions) && admissions.length === 1 && selectedId === null) {
            onSelect(admissions[0].id);
        }
    }, [admissions, selectedId, onSelect]);

    // Determine placeholder text based on state
    let placeholder = "Select an admission cycle";
    let isDisabled = false;

    if (loading) {
        placeholder = "Loading admission cycles...";
        isDisabled = true;
    } else if (error) {
        placeholder = "Error loading admissions";
        isDisabled = true;
    } else if (!Array.isArray(admissions) || admissions.length === 0) {
        placeholder = "No active admissions available";
        isDisabled = true;
    }

    return (
        <div className={className}>
            <label className="block text-sm font-medium mb-2 text-foreground">Admission Cycle *</label>
            <Select
                value={selectedId?.toString() || ''}
                onValueChange={(value) => onSelect(value ? parseInt(value) : null)}
                disabled={isDisabled}
            >
                <SelectTrigger className={error ? "border-destructive" : ""}>
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                    {Array.isArray(admissions) && admissions.length > 0 ? (
                        admissions.map((adm: Admission) => (
                            <SelectItem key={adm.id} value={adm.id.toString()}>
                                {adm.name} ({adm.open ? 'OPEN' : 'CLOSED'})
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