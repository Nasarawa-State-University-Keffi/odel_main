import { useState, useEffect } from 'react';
import { admissionService } from '@/features/admin/services/admissionService';

export interface Admission {
    id: number;
    name: string;
    open: boolean;
    admissionMode?: string;
    programmeType?: string | {
        name: string;
        code: string;
    };

    applicationType?: {
        programmeType?: {
            name: string;
            code: string;
        }
    }
}
export const useActiveAdmissions = (filterProgrammeType?: string) => {
    const [admissions, setAdmissions] = useState<Admission[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAdmissions = async () => {
            try {
                // Use the service to fetch admissions
                const data = await admissionService.getActiveAdmissions();

                // Filter logic
                const filteredData = data.filter((admission: any) => {
                    if (!filterProgrammeType) return true;
                    // ... (existing filter checks) ...
                    // Check direct string match
                    const type = admission.programmeType;
                    const nestedType = admission.applicationType?.programmeType;
                    const filter = filterProgrammeType.toUpperCase();

                    if (typeof type === 'string' && type.toUpperCase().includes(filter)) return true;
                    // Check object match (name or code)
                    if (typeof type === 'object') {
                        if (type.name?.toUpperCase().includes(filter)) return true;
                        if (type.code?.toUpperCase().includes(filter)) return true;
                    }

                    // Check nested applicationType match
                    if (nestedType) {
                        if (typeof nestedType === 'string' && nestedType.toUpperCase().includes(filter)) return true;
                        if (typeof nestedType === 'object') {
                            if (nestedType.name?.toUpperCase().includes(filter)) return true;
                            if (nestedType.code?.toUpperCase().includes(filter)) return true;
                        }
                    }

                    return false;
                }).map((admission: any) => ({
                    ...admission,
                    name: admission.name || `${admission.applicationType?.name || 'Admission'} for ${admission.session?.name || ''}`,
                    open: admission.isOpen !== undefined ? admission.isOpen : admission.open,
                }));

                setAdmissions(filteredData);

            } catch (err: any) {
                console.warn('could not fetch available admissions:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchAdmissions();
    }, [filterProgrammeType]);

    return { admissions, loading, error };
};