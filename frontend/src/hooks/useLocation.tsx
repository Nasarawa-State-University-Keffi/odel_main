import { useState, useEffect } from "react";
import { staffService } from "@/features/admin/services/staffService";

interface SelectOption {
    value: string;
    label: string;
}

export const useLocation = () => {
    const [countries, setCountries] = useState<SelectOption[]>([]);
    const [states, setStates] = useState<SelectOption[]>([]);
    const [lgas, setLgas] = useState<SelectOption[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Store raw countries data to access nested states
    const [rawCountries, setRawCountries] = useState<any[]>([]);

    useEffect(() => {
        fetchCountries();
    }, []);

    const fetchCountries = async () => {
        try {
            setIsLoading(true);
            const data = await staffService.getCountries();
            setRawCountries(data);
            const formattedCountries = data.map((c) => ({
                value: c.id.toString(),
                label: c.name,
            }));
            setCountries(formattedCountries);
        } catch (error) {
            console.error("Failed to fetch countries", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchStates = (countryId: string) => {
        // Find country in raw data
        const country = rawCountries.find((c) => c.id.toString() === countryId);
        if (country && country.states) {
            const formattedStates = country.states.map((s: any) => ({
                value: s.id.toString(),
                label: s.name,
            }));
            setStates(formattedStates);
        } else {
            setStates([]);
        }
        setLgas([]); // Clear LGAs when state/country changes
    };

    const fetchLGAs = async (_countryId: string, stateId: string) => {
        try {
            setIsLoading(true);
            const data = await staffService.getLgasByState(Number(stateId));
            const formattedLgas = data.map((l) => ({
                value: l.id.toString(),
                label: l.name,
            }));
            setLgas(formattedLgas);
        } catch (error) {
            console.error("Failed to fetch LGAs", error);
            setLgas([]);
        } finally {
            setIsLoading(false);
        }
    };

    return {
        countries,
        states,
        lgas,
        isLoading,
        fetchStates,
        fetchLGAs,
    };
};
