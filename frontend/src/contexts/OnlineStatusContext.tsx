import { createContext, useContext, ReactNode } from "react";
import { useOnlineStatus } from "../hooks/useOnlineStatus";

interface OnlineStatusContextType {
    isOnline: boolean;
}

const OnlineStatusContext = createContext<OnlineStatusContextType | undefined>(undefined);

export function OnlineStatusProvider({ children }: { children: ReactNode }) {
    const isOnline = useOnlineStatus();

    return (
        <OnlineStatusContext.Provider value={{ isOnline }}>
            {children}
        </OnlineStatusContext.Provider>
    );
}

export function useOnline() {
    const context = useContext(OnlineStatusContext);
    if (context === undefined) {
        throw new Error("useOnline must be used within an OnlineStatusProvider");
    }
    return context;
}
