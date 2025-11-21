import { useState, useEffect } from "react";
import { COUNTRIES, getStatesForCountry, getLGAsForState, type LocationOption } from "@/data/locationData";

export const useLocation = () => {
    const [countries, setCountries] = useState<LocationOption[]>([]);
    const [states, setStates] = useState<LocationOption[]>([]);
    const [lgas, setLgas] = useState<LocationOption[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Load countries instantly from local data
        setCountries(COUNTRIES);
    }, []);

    const fetchStates = (country: string) => {
        setIsLoading(true);
        // Use local data for instant loading
        setTimeout(() => {
            const stateOptions = getStatesForCountry(country);
            setStates(stateOptions);
            setLgas([]); // Reset LGAs when country changes
            setIsLoading(false);
        }, 0);
    };

    const fetchLGAs = (country: string, state: string) => {
        setIsLoading(true);
        // Use local data for instant loading
        setTimeout(() => {
            const lgaOptions = getLGAsForState(country, state);
            setLgas(lgaOptions);
            setIsLoading(false);
        }, 0);
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
