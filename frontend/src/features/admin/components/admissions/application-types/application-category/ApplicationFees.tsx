import { ApplicationType } from "../../../types/admission";
import { DollarSign, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ApplicationFeesProps {
    fees: ApplicationType["fees"];
    paymentCodes: ApplicationType["paymentCodes"];
    verificationFee?: number;
    verificationFeeServiceCode?: string;
}

const FeeItem = ({ label, amount, code }: { label: string; amount?: number; code?: string }) => {
    return (
        <div className="flex flex-col gap-1 p-3 rounded-xl bg-primary/5 border border-primary/10">
            <span className="text-[9px] font-black uppercase tracking-widest text-primary/60">{label}</span>
            <div className="flex items-center justify-between">
                <span className="text-sm font-black text-primary">
                    {amount !== undefined && amount !== null ? `₦${amount.toLocaleString()}` : "N/A"}
                </span>
                {code && (
                    <Badge variant="outline" className="text-[9px] font-mono border-primary/20 bg-background text-primary/80">
                        {code}
                    </Badge>
                )}
            </div>
        </div>
    );
};

const ApplicationFees = ({ fees, paymentCodes, verificationFee, verificationFeeServiceCode }: ApplicationFeesProps) => {
    return (
        <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 rounded-lg bg-emerald-100">
                    <DollarSign className="h-4 w-4 text-emerald-600" />
                </div>
                <h3 className="text-sm font-black uppercase tracking-tight text-foreground/80">Fees & Financials</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FeeItem label="Application Fee" amount={fees?.application} />
                <FeeItem label="Admission/Acceptance" amount={fees?.admission} code={paymentCodes?.acceptance} />
                <FeeItem label="Screening Fee" amount={fees?.screening} code={paymentCodes?.screening} />
                <FeeItem label="Prog. Change Fee" amount={fees?.programmeChange} />
                <FeeItem label="Verification Fee" amount={verificationFee} code={verificationFeeServiceCode} />
            </div>

        </div>
    );
};

export default ApplicationFees;
