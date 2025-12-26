import { ApplicationType } from "../../../types/admission";
import { BookOpen, CheckCircle2, XCircle } from "lucide-react";

interface ApplicationRequirementsProps {
    requirements: ApplicationType["requirements"];
}

const RequirementItem = ({ label, required }: { label: string; required: boolean | undefined }) => {
    return (
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-background/50 border border-border/40 shadow-sm">
            <span className="text-[11px] font-bold text-muted-foreground/80">{label}</span>
            {required ? (
                <div className="flex items-center gap-1.5 text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span className="text-[9px] font-black uppercase tracking-tighter">Required</span>
                </div>
            ) : (
                <div className="flex items-center gap-1.5 text-slate-400 bg-slate-400/10 px-2 py-0.5 rounded-lg border border-slate-400/20">
                    <XCircle className="h-3.5 w-3.5" />
                    <span className="text-[9px] font-black uppercase tracking-tighter">No</span>
                </div>
            )}
        </div>
    );
};

const ApplicationRequirements = ({ requirements }: ApplicationRequirementsProps) => {
    return (
        <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 rounded-lg bg-primary/10">
                    <BookOpen className="h-4 w-4 text-primary" />
                </div>
                <h3 className="text-sm font-black uppercase tracking-tight text-foreground/80">Requirements Checklist</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <RequirementItem label="UTME Required" required={requirements?.utmeRequired} />
                <RequirementItem label="SSCE Required" required={requirements?.ssceRequired} />
                <RequirementItem label="Screening" required={requirements?.screeningRequired} />
                <RequirementItem label="NYSC Clearance" required={requirements?.nyscRequired} />
                <RequirementItem label="Qual. Details" required={requirements?.qualificationDetailsRequired} />
                <RequirementItem label="Qual. Documents" required={requirements?.qualificationDocumentsRequired} />
                <RequirementItem label="Next of Kin" required={requirements?.nextOfKinRequired} />
                <RequirementItem label="Referee Data" required={requirements?.refereeRequired} />
            </div>
        </div>
    );
};

export default ApplicationRequirements;
