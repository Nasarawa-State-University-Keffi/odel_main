import { useEffect, useState, useRef } from "react";
import { Camera, Smartphone, ScanFace, Mail, Phone, CalendarRange, GraduationCap, Building2, BookOpen, Layers, CheckCircle2, Loader2, Pencil } from "lucide-react";
import { Card, CardContent } from "@/features/admin/components/admission/components/ui/card";
import { Button } from "@/features/admin/components/admission/components/ui/button";
import { Skeleton } from "@/features/admin/components/admission/components/ui/skeleton";
import apiClient from "@/lib/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { cn } from "@/lib/utils";
import { Badge } from "@/features/admin/components/admission/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { applicationService } from "@/features/student/services/applicationService";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/features/admin/components/admission/components/ui/dialog";
import { Label } from "@/features/admin/components/admission/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/features/admin/components/admission/components/ui/select";

interface StudentProfileCardProps {
    userData: any;
    className?: string;
}

export const StudentProfileCard = ({ userData, className }: StudentProfileCardProps) => {
    const { data: currentUser } = useCurrentUser();
    const [imageObjectUrl, setImageObjectUrl] = useState<string | null>(null);

    // Authenticated Image Fetching
    useEffect(() => {
        let objectUrl: string | null = null;
        if (currentUser?.profileImage) {
            apiClient.get(currentUser.profileImage, { responseType: 'blob' })
                .then(response => {
                    objectUrl = URL.createObjectURL(response.data);
                    setImageObjectUrl(objectUrl);
                })
                .catch(err => console.error("Failed to load profile image", err));
        }
        return () => {
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [currentUser?.profileImage]);

    // Extract Data - Based on provided JSON structure
    const applicant = userData?.data || {};
    const admission = applicant.admission || {};
    const yearOfAdmission = applicant.yearOfAdmission || {};

    const applicationType = admission.applicationType || applicant.applicationType || {};
    const programmeType = applicationType.programmeType || yearOfAdmission.programmeType || applicant.programmeType || {};

    const programme = admission.programme || applicant.programme || {};
    const department = programme.department || applicant.department || {};
    const faculty = department.faculty || {};

    // Status Logic
    const status = applicant.applicationStatus || "PENDING";
    const isAdmitted = status === "ADMITTED" || status === "COMPLETED";

    const [isEditModeOpen, setIsEditModeOpen] = useState(false);
    const [modesOfEntry, setModesOfEntry] = useState<any[]>([]);
    const [selectedModeEntryId, setSelectedModeEntryId] = useState<string>("");
    const [isLoadingModes, setIsLoadingModes] = useState(false);
    const [isSavingMode, setIsSavingMode] = useState(false);

    const handleEditClick = async () => {
        setIsEditModeOpen(true);
        if (modesOfEntry.length === 0) {
            try {
                setIsLoadingModes(true);
                // Try to get programmeType ID from various possible locations in userData
                const progTypeId = applicationType.programmeType?.id ||
                    programmeType.id ||
                    applicant.programmeType?.id; // Fallback

                if (progTypeId) {
                    const modes = await import("@/features/admin/services/modeOfEntryService").then(m => m.modeOfEntryService.getAllModeOfEntries(progTypeId));
                    setModesOfEntry(modes);
                } else {
                    toast({ variant: "destructive", title: "Config Error", description: "Could not determine programme type to fetch modes." });
                }
            } catch (error) {
                console.error("Failed to fetch modes", error);
                toast({ variant: "destructive", title: "Error", description: "Failed to load modes of entry." });
            } finally {
                setIsLoadingModes(false);
            }
        }
        // Set initial value
        if (applicant.modeOfEntry?.id) setSelectedModeEntryId(applicant.modeOfEntry.id.toString());
        else if (applicant.modeOfEntryId) setSelectedModeEntryId(applicant.modeOfEntryId.toString());
    };

    const handleSaveMode = async () => {
        if (!selectedModeEntryId) return;
        setIsSavingMode(true);
        try {
            await applicationService.updateModeOfEntry(applicant.id, { modeOfEntry: Number(selectedModeEntryId) });
            toast({ title: "Success", description: "Mode of entry updated." });
            window.location.reload();
        } catch (error) {
            console.error("Update failed", error);
            toast({ variant: "destructive", title: "Update Failed", description: "Could not update mode of entry." });
        } finally {
            setIsSavingMode(false);
            setIsEditModeOpen(false);
        }
    };


    const InfoCard = ({ icon: Icon, label, value, className, action }: any) => (
        <div className={cn("bg-muted/30 border border-border/50 rounded-2xl p-4 flex flex-col gap-3 hover:bg-muted/50 transition-colors group relative", className)}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground/70 group-hover:text-primary/80 transition-colors">
                    <Icon className="h-4 w-4" />
                    <span className="text-[10px] uppercase font-bold tracking-widest">{label}</span>
                </div>
                {action}
            </div>
            <p className="font-bold text-sm md:text-base text-foreground truncate" title={value}>
                {value || "N/A"}
            </p>
        </div>
    );

    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Basic Validation
        if (file.size > 5 * 1024 * 1024) {
            toast({ variant: "destructive", title: "File too large", description: "Max file size is 5MB." });
            return;
        }

        const email = currentUser?.email || applicant.email;
        if (!email) {
            toast({ variant: "destructive", title: "Error", description: "User email not found." });
            return;
        }

        try {
            setIsUploading(true);
            await applicationService.updatePassport(email, file);

            // Invalidate queries to refresh image everywhere
            await queryClient.invalidateQueries({ queryKey: ['currentUser'] });

            toast({ title: "Success", description: "Profile picture updated successfully." });
            window.location.reload();
        } catch (error) {
            console.error("Upload failed", error);
            toast({ variant: "destructive", title: "Upload Failed", description: "Could not update profile picture." });
        } finally {
            setIsUploading(false);
            // Reset input so same file can be selected again if needed
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const triggerUpload = () => {
        fileInputRef.current?.click();
    };

    return (
        <>
            <Card className={cn("overflow-hidden border-border/60 shadow-lg bg-card relative", className)}>

                {/* Patterned Header */}
                <div className="h-40 bg-emerald-50/80 dark:bg-emerald-950/20 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-[0.4]" style={{
                        backgroundImage: 'radial-gradient(#10b981 1px, transparent 1px)',
                        backgroundSize: '20px 20px'
                    }}></div>
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-card/90"></div>
                </div>

                <CardContent className="px-6 md:px-10 pb-10 relative">

                    {/* Centered Avatar Group */}
                    <div className="flex flex-col items-center -mt-20 mb-8 relative z-10">
                        <div className="relative group">
                            <div className="h-36 w-36 rounded-full border-[6px] border-card bg-muted shadow-xl overflow-hidden relative">
                                {imageObjectUrl ? (
                                    <img
                                        src={imageObjectUrl}
                                        alt="Profile"
                                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                ) : currentUser?.profileImage ? (
                                    <Skeleton className="h-full w-full" />
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center bg-emerald-100 text-emerald-600 font-black text-5xl">
                                        {applicant.name?.[0] || "?"}
                                    </div>
                                )}
                            </div>

                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/jpeg,image/png,image/jpg"
                                onChange={handleFileChange}
                            />

                            <Button
                                size="icon"
                                className="absolute bottom-1 right-1 h-10 w-10 rounded-full bg-emerald-500 hover:bg-emerald-600 border-4 border-card shadow-lg text-white"
                                title="Update Photo"
                                onClick={triggerUpload}
                                disabled={isUploading}
                            >
                                {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                            </Button>
                        </div>

                        <div className="text-center mt-4 space-y-2">
                            <h2 className="text-3xl font-black tracking-tight text-foreground uppercase">
                                {applicant.name}
                            </h2>

                            <div className="flex items-center justify-center gap-2 text-muted-foreground font-medium text-sm">
                                <Mail className="h-3 w-3" />
                                {applicant.email}
                            </div>

                            <Badge
                                variant="outline"
                                className={cn(
                                    "mt-2 px-4 py-1.5 rounded-full border-2 font-bold uppercase tracking-wide text-xs",
                                    isAdmitted
                                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                        : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                )}
                            >
                                Application Status: {status === "APPLICATION_PENDING" ? "Application Pending" : status}
                            </Badge>
                        </div>
                    </div>


                    {/* Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">

                        {/* ID & User Info - Featured */}
                        <InfoCard icon={ScanFace} label="Applicant ID" value={applicant.userId || "N/A"} className="md:col-span-2 bg-primary/5 border-primary/10" />

                        <InfoCard icon={Phone} label="Phone Number" value={applicant.phone || applicant.phoneNumber || "N/A"} />
                        <InfoCard icon={CalendarRange} label="Admission Year" value={yearOfAdmission.name || applicant.admissionYear || "N/A"} />

                        <InfoCard icon={Layers} label="Programme Type" value={applicationType.name || applicant.applicationType?.name || "N/A"} />
                        <InfoCard icon={Building2} label="Faculty" value={faculty.name || "N/A"} />

                        <InfoCard icon={BookOpen} label="Department" value={department.name} />
                        <InfoCard icon={GraduationCap} label="Programme" value={programme.name} className="md:col-span-2" />

                        <InfoCard
                            icon={CheckCircle2}
                            label="Mode of Entry"
                            value={applicant.modeOfEntry?.name || applicant.modeOfEntry || "Direct Entry"}
                            action={
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-primary" onClick={handleEditClick}>
                                    <Pencil className="h-3 w-3" />
                                </Button>
                            }
                        />
                        <InfoCard icon={Layers} label="Mode of Study" value={programmeType.modeOfStudy || programme.modeOfStudy || "ODEL"} />
                        <InfoCard icon={Smartphone} label="Session" value={admission.session?.name} />
                    </div>

                    {/* Footer / Reset Action */}
                    <div className="mt-8 flex justify-center border-t border-border/40 pt-6">
                        <Button variant="ghost" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 text-xs font-bold uppercase tracking-widest opacity-60 hover:opacity-100 transition-all">
                            Reset Application Data
                        </Button>
                    </div>

                </CardContent>
            </Card>

            {/* Edit Dialog */}
            <Dialog open={isEditModeOpen} onOpenChange={setIsEditModeOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Update Mode of Entry</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Select Mode of Entry</Label>
                            {isLoadingModes ? (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin" /> Loading options...
                                </div>
                            ) : (
                                <Select value={selectedModeEntryId} onValueChange={setSelectedModeEntryId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select mode..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {modesOfEntry.map((mode) => (
                                            <SelectItem key={mode.id} value={mode.id.toString()}>
                                                {mode.name || mode.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                        <Button onClick={handleSaveMode} disabled={isSavingMode || !selectedModeEntryId} className="w-full">
                            {isSavingMode && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Update
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};
