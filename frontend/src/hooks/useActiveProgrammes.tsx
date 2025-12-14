import { useState, useEffect } from 'react';
import axios from 'axios';

export interface Programme {
    id: number;
    name: string;
    code: string;
    active: boolean;
}

// Mock data for testing (remove when backend is ready)
const MOCK_PROGRAMMES: Programme[] = [
    { id: 1, name: 'B.Sc Public Administration (ODEL)', code: 'BSC-PA-ODEL', active: true },
    { id: 2, name: 'B.Sc Computer Science (ODEL)', code: 'BSC-CS-ODEL', active: true },
    { id: 3, name: 'B.A English (ODEL)', code: 'BA-ENG-ODEL', active: true },
    { id: 4, name: 'B.Sc Economics (ODEL)', code: 'BSC-ECO-ODEL', active: true },
    { id: 5, name: 'B.Sc Mathematics (ODEL)', code: 'BSC-MATH-ODEL', active: true },
];

export const useActiveProgrammes = () => {
    const [programmes, setProgrammes] = useState<Programme[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProgrammes = async () => {
            try {
                // Try to fetch from API first
                const response = await axios.get(`${import.meta.env.VITE_API_BASE}/admission/get-active-programmes`);

                // Debug: Log the raw response
                console.log('Raw API response (programmes):', response.data);

                // Ensure it's an array; fallback to empty if not
                const data = Array.isArray(response.data) ? response.data : [];
                setProgrammes(data);

                if (data.length === 0) {
                    setError('No active programmes found.');
                }
            } catch (err: any) {
                console.warn('Programmes fetch error, using mock data:', err);
                // Use mock data if API fails
                setProgrammes(MOCK_PROGRAMMES);
            } finally {
                setLoading(false);
            }
        };

        fetchProgrammes();
    }, []);

    return { programmes, loading, error };
};
