// src/components/shared/ActiveProgrammes.tsx
import React, { useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/features/admin/components/admission/components/ui/select';
import { useActiveProgrammes, type Programme } from '@/hooks/useActiveProgrammes';

interface ActiveProgrammesProps {
    selectedId: number | null;
    onSelect: (id: number | null) => void;
    className?: string;
}

const ActiveProgrammes: React.FC<ActiveProgrammesProps> = ({ selectedId, onSelect, className }) => {
    const { programmes, loading, error } = useActiveProgrammes();

    // Debug: Log before processing
    console.log('Programmes state:', programmes, typeof programmes, Array.isArray(programmes));

    // Auto-select first if only one and none selected
    useEffect(() => {
        if (Array.isArray(programmes) && programmes.length === 1 && selectedId === null) {
            onSelect(programmes[0].id);
        }
    }, [programmes, selectedId, onSelect]);

    // Determine placeholder text based on state
    let placeholder = "Select a programme";
    let isDisabled = false;

    if (loading) {
        placeholder = "Loading programmes...";
        isDisabled = true;
    } else if (error) {
        placeholder = "Error loading programmes";
        isDisabled = true;
    } else if (!Array.isArray(programmes) || programmes.length === 0) {
        placeholder = "No active programmes available";
        isDisabled = true;
    }

    return (
        <div className={className}>
            <label className="block text-sm font-medium mb-2 text-foreground">Programme *</label>
            <Select
                value={selectedId?.toString() || ''}
                onValueChange={(value) => onSelect(value ? parseInt(value) : null)}
                disabled={isDisabled}
            >
                <SelectTrigger className={error ? "border-destructive" : ""}>
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                    {Array.isArray(programmes) && programmes.length > 0 ? (
                        programmes.map((prog: Programme) => (
                            <SelectItem key={prog.id} value={prog.id.toString()}>
                                {prog.name} {prog.code ? `(${prog.code})` : ''}
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

export default ActiveProgrammes;
