import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, MapPin, Mail, ShieldCheck, Calendar } from "lucide-react";
import { DetailItem } from "./StudentDetailItem";

interface StudentOverviewTabProps {
    student: any;
}

export const StudentOverviewTab = ({ student: s }: StudentOverviewTabProps) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="space-y-6">
                <Card className="border-border/50 shadow-sm overflow-hidden">
                    <CardHeader className="bg-muted/10 border-b border-border/40 py-3">
                        <CardTitle className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground flex items-center gap-2">
                            <User className="h-3.5 w-3.5" />
                            Personal Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 grid gap-6">
                        <div className="grid grid-cols-2 gap-6">
                            <DetailItem label="First Name" value={s.firstName} />
                            <DetailItem label="Last Name" value={s.lastName} />
                            <DetailItem label="Middle Name" value={s.middleName} />
                            <DetailItem label="Gender" value={s.genderName} />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-border/50 shadow-sm overflow-hidden">
                    <CardHeader className="bg-muted/10 border-b border-border/40 py-3">
                        <CardTitle className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5" />
                            Contact & Location
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 grid gap-6">
                        <DetailItem label="Mobile Phone" value={s.phone} className="col-span-2" />
                        <DetailItem label="State of Origin" value={s.stateName} icon={MapPin} />
                        <DetailItem label="LGA" value={s.lgaName} icon={MapPin} />
                        <DetailItem label="Country" value={s.countryName} icon={MapPin} />
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-6">
                <Card className="border-border/50 shadow-sm overflow-hidden">
                    <CardHeader className="bg-muted/10 border-b border-border/40 py-3">
                        <CardTitle className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground flex items-center gap-2">
                            <Mail className="h-3.5 w-3.5" />
                            Account & System
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 grid gap-6">
                        <DetailItem label="Email Address" value={s.email} icon={Mail} className="col-span-2" />
                        <DetailItem label="Userame / ID" value={s.userId} icon={ShieldCheck} />
                        <DetailItem
                            label="Registration Date"
                            value={s.user?.creationTime ? new Date(s.user.creationTime).toLocaleDateString() : undefined}
                            icon={Calendar}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
