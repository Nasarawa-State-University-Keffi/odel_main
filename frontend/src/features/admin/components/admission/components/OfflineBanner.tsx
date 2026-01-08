import { WifiOff } from "lucide-react";
import { useOnline } from "../../../../../contexts/OnlineStatusContext";

export default function OfflineBanner() {
    const { isOnline } = useOnline();

    if (isOnline) {
        return null;
    }

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center gap-2 bg-destructive p-2 text-center text-sm font-medium text-destructive-foreground">
            <WifiOff className="h-4 w-4" />
            <span>You are currently offline. Please check your internet connection.</span>
        </div>
    );
}
