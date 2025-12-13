import { useState, useEffect } from 'react';
import axios from 'axios';

export interface Admission {
    id: number;
    name: string;
    open: boolean;
}

// Mock data for testing (remove when backend is ready)
const MOCK_ADMISSIONS: Admission[] = [
    { id: 1, name: '2024/2025 Academic Session', open: true },
    { id: 2, name: '2025/2026 Academic Session', open: true },
];

export const useActiveAdmissions = () => {
    const [admissions, setAdmissions] = useState<Admission[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAdmissions = async () => {
            try {
                // Try to fetch from API first
                const response = await axios.get(`${import.meta.env.VITE_API_BASE}/admission/get-active-admissions`);

                // Debug: Log the raw response
                console.log('Raw API response:', response.data);

                // Ensure it's an array; fallback to empty if not
                const data = Array.isArray(response.data) ? response.data : [];
                setAdmissions(data);

                if (data.length === 0) {
                    setError('No active admissions found.');
                }
            } catch (err: any) {
                console.warn('Admissions fetch error, using mock data:', err);
                // Use mock data if API fails
                setAdmissions(MOCK_ADMISSIONS);
            } finally {
                setLoading(false);
            }
        };

        fetchAdmissions();
    }, []);

    return { admissions, loading, error };
};