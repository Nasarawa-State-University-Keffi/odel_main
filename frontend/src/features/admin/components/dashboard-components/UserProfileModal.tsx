import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogTitle
} from "@/features/admin/components/admission/components/ui/dialog";
import { Button } from "@/features/admin/components/admission/components/ui/button";
import { Badge } from "@/features/admin/components/admission/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/features/admin/components/admission/components/ui/avatar";
import { User, ShieldCheck, Mail, Phone as PhoneIcon, Fingerprint } from "lucide-react";
import { CurrentUser } from "@/lib/api";

interface UserProfileModalProps {
    user: CurrentUser | undefined | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const UserProfileModal = ({ user, open, onOpenChange }: UserProfileModalProps) => {
    if (!user) return null;

    const displayName = user.fullName || user.username || "User";
    const initials = displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95%] max-w-lg p-0 overflow-hidden border-0 shadow-2xl bg-background/95 backdrop-blur-xl sm:rounded-[2rem]">
                <DialogTitle className="sr-only">User Profile</DialogTitle>

                {/* Visual Header */}
                <div className="relative h-40 w-full overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-primary/10 to-transparent" />
                    <div className="absolute -top-10 -right-10 h-64 w-64 rounded-full bg-primary/20 blur-[80px]" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-10 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]" />
                </div>

                <div className="px-6 md:px-8 pb-8 flex flex-col items-center -mt-16 relative z-10">
                    {/* Avatar Profile */}
                    <div className="relative mb-4 group">
                        <div className="absolute -inset-1 bg-gradient-to-br from-primary via-primary/50 to-primary/20 rounded-full blur opacity-50 group-hover:opacity-100 transition duration-500" />
                        <Avatar className="h-32 w-32 border-4 border-background shadow-2xl ring-4 ring-black/5 object-cover relative pointer-events-none">
                            <AvatarImage src={user.profileImage} className="object-cover" />
                            <AvatarFallback className="text-4xl font-black bg-gradient-to-br from-muted/50 to-muted text-primary/80">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                        <div className="absolute bottom-2 right-2 h-6 w-6 bg-green-500 border-4 border-background rounded-full" />
                    </div>

                    {/* Basic Info */}
                    <div className="text-center space-y-1 mb-6">
                        <h2 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">
                            {user.fullName || user.username}
                        </h2>
                        <p className="text-muted-foreground font-medium flex items-center justify-center gap-1.5 text-sm">
                            <Mail className="h-3.5 w-3.5" />
                            {user.email}
                        </p>
                    </div>

                    {/* Roles Badges */}
                    <div className="flex flex-wrap justify-center gap-2 mb-8">
                        {(user.roles || []).map(role => (
                            <Badge
                                key={role}
                                variant="secondary"
                                className="px-3 py-1 font-bold bg-primary/10 text-primary border border-primary/10 tracking-wide uppercase text-[10px]"
                            >
                                <ShieldCheck className="h-3 w-3 mr-1.5" />
                                {role}
                            </Badge>
                        ))}
                    </div>

                    {/* Detailed Info Cards */}
                    <div className="w-full grid gap-3">
                        <div className="grid grid-cols-2 gap-3">
                            {/* User ID */}
                            <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/40 flex flex-col items-start gap-1 group hover:border-primary/20 transition-all">
                                <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                    <Fingerprint className="h-3.5 w-3.5" />
                                    User ID
                                </span>
                                <span className="font-mono font-bold text-sm bg-background/80 px-2 py-0.5 rounded border border-border/50 text-foreground group-hover:text-primary transition-colors">
                                    {user.userId}
                                </span>
                            </div>

                            {/* Username */}
                            <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/40 flex flex-col items-start gap-1 group hover:border-primary/20 transition-all">
                                <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                    <User className="h-3.5 w-3.5" />
                                    Username
                                </span>
                                <span className="font-bold text-sm text-foreground truncate max-w-full">
                                    {user.username}
                                </span>
                            </div>
                        </div>

                        {user.phone && (
                            <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/40 flex items-center justify-between group hover:border-primary/20 transition-all">
                                <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                    <PhoneIcon className="h-3.5 w-3.5" />
                                    Phone
                                </span>
                                <span className="font-mono font-bold text-sm text-foreground">
                                    {user.phone}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className="p-4 bg-muted/20 border-t border-border/40">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        className="w-full font-bold tracking-wide hover:bg-destructive/5 hover:text-destructive"
                    >
                        Close Profile
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default UserProfileModal;
