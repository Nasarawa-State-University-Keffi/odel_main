import { ApplicationType } from "@/features/admin/types/admission";
import { Card, CardContent } from "@/components/ui/card";
import ApplicationCategoryHeader from "./application-category/ApplicationCategoryHeader";
import ApplicationRequirements from "./application-category/ApplicationRequirements";
import ApplicationFees from "./application-category/ApplicationFees";
import ApplicationAutomation from "./application-category/ApplicationAutomation";
import ApplicationTechnicalDetails from "./application-category/ApplicationTechnicalDetails";

interface ApplicationCategoryCardProps {
    type: ApplicationType;
    onEdit: (type: ApplicationType) => void;
}

const ApplicationCategoryCard = ({ type, onEdit }: ApplicationCategoryCardProps) => {
    return (
        <Card className="shadow-xl border-border/40 bg-background/60 backdrop-blur-md overflow-hidden hover:shadow-2xl transition-all duration-300 group ring-1 ring-border/50">
            <ApplicationCategoryHeader
                type={{
                    ...type,
                    // Shim status from array if single status is missing
                    status: type.status || (type as any).statuses?.[0] || ((type as any).changeProgrammesStatus?.[0]) || "ACTIVE",
                    // Ensure admissionType has a fallback
                    admissionType: type.admissionType || "GENERAL"
                }}
                onEdit={onEdit}
            />

            <CardContent className="p-6 space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <ApplicationRequirements requirements={type.requirements || {
                        utmeRequired: (type as any).utmeDetailsEnabled,
                        ssceRequired: (type as any).ssceDetailsEnabled,
                        screeningRequired: (type as any).screeningDetailsEnabled,
                        nyscRequired: (type as any).nyscDetailsEnabled,
                        qualificationDetailsRequired: (type as any).qualificationDetailsEnabled,
                        qualificationDocumentsRequired: (type as any).qualificationDocumentEnabled,
                        nextOfKinRequired: (type as any).nextOfKinDetailsEnabled,
                        refereeRequired: (type as any).refereeDetailsEnabled
                    }} />
                    <ApplicationFees
                        fees={type.fees || {
                            application: type.applicationFee || 0,
                            admission: type.admissionFee || 0,
                            screening: type.screeningFee || 0,
                            programmeChange: type.changeProgrammeFee || 0
                        }}
                        paymentCodes={type.paymentCodes || {
                            acceptance: type.acceptanceFeeServiceCode || "",
                            screening: type.screeningFeeServiceCode || ""
                        }}
                        verificationFee={type.verificationFee}
                        verificationFeeServiceCode={type.verificationFeeServiceCode}
                    />
                </div>
            </CardContent>
        </Card>
    );
};

export default ApplicationCategoryCard;
