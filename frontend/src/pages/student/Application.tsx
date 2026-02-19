import { FormProvider } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, AlertCircle } from "lucide-react";
import { PersonalSection } from "@/features/student/components/application/PersonalSection";
import { ContactSection } from "@/features/student/components/application/ContactSection";
import { ProgrammeSection } from "@/features/student/components/application/ProgrammeSection";
import { OLevelSection } from "@/features/student/components/application/OLevelSection";
import { QualificationSection } from "@/features/student/components/application/QualificationSection";
import { NYSCSection } from "@/features/student/components/application/NYSCSection";
import { NextOfKinSection } from "@/features/student/components/application/NextOfKinSection";
import { UtmeSection } from "@/features/student/components/application/UtmeSection";
import { RefereeSection } from "@/features/student/components/application/RefereeSection";
import { PassportUploadSection } from "@/features/student/components/application/PassportUploadSection";
import { ReviewPaymentSection } from "@/features/student/components/application/ReviewPaymentSection";
import { ApplicationStepper } from "@/features/student/components/application/ApplicationStepper";
import { ApplicationNavigation } from "@/features/student/components/application/ApplicationNavigation";
import { useApplicationData } from "@/features/student/hooks/useApplicationData";
import { useApplicationForm } from "@/features/student/hooks/useApplicationForm";
import { LoadingOverlay } from "@/features/student/components/application/LoadingOverlay";

const LoadingScreen = () => (
    <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium text-muted-foreground animate-pulse">Loading application...</p>
        </div>
    </div>
);

const ErrorScreen = ({ message }: { message: string }) => (
    <div className="flex h-screen w-full items-center justify-center bg-background p-4">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
            <AlertCircle className="h-12 w-12 text-destructive/50" />
            <h2 className="text-xl font-bold">Configuration Error</h2>
            <p className="text-sm text-muted-foreground">{message}</p>
        </div>
    </div>
);

const Application = () => {
    const { isLoading, appConfig, applicantId, mappedData, userData } = useApplicationData();

    const {
        methods,
        currentStep,
        steps,
        direction,
        isSubmitting,
        canSkip,
        nextStep,
        prevStep,
        skipStep,
        onSubmit,
        variants
    } = useApplicationForm(appConfig, applicantId, mappedData, userData);

    if (isLoading) return <LoadingScreen />;
    if (!appConfig) return <ErrorScreen message="Unable to load application configuration. Please contact support if this persists." />;

    return (
        <div className="space-y-6">
            <div className="space-y-2 mb-8">
                <h1 className="text-2xl md:text-3xl font-black tracking-tight text-[#01402c] uppercase">
                    Registration <span className="text-primary">flow</span>
                </h1>
                <p className="text-sm text-muted-foreground">
                    Please provide accurate information in all required fields.
                </p>
            </div>

            <ApplicationStepper steps={steps} currentStep={currentStep} />

            <FormProvider {...methods}>
                <form onSubmit={methods.handleSubmit(onSubmit)} className="relative min-h-[400px]">
                    <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
                        <div className="p-6 md:p-8 flex-grow">
                            <AnimatePresence initial={false} custom={direction} mode="wait">
                                <motion.div
                                    key={currentStep}
                                    custom={direction}
                                    variants={variants}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    transition={{
                                        x: { type: "spring", stiffness: 300, damping: 30 },
                                        opacity: { duration: 0.2 }
                                    }}
                                    className="w-full"
                                >
                                    {steps[currentStep].id === 'personal' && <PersonalSection config={appConfig} />}
                                    {steps[currentStep].id === 'contact' && <ContactSection />}
                                    {steps[currentStep].id === 'programme' && <ProgrammeSection />}
                                    {steps[currentStep].id === 'olevel' && <OLevelSection config={appConfig} />}
                                    {steps[currentStep].id === 'qualification' && <QualificationSection />}
                                    {steps[currentStep].id === 'utme' && <UtmeSection />}
                                    {steps[currentStep].id === 'nysc' && <NYSCSection />}
                                    {steps[currentStep].id === 'nextOfKin' && <NextOfKinSection />}
                                    {steps[currentStep].id === 'referees' && <RefereeSection config={appConfig} />}
                                    {steps[currentStep].id === 'documents' && <PassportUploadSection config={appConfig} />}
                                    {steps[currentStep].id === 'review' && <ReviewPaymentSection isLoading={isSubmitting} />}
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        <div className="p-6 bg-muted/30 border-t border-border/50 mt-auto">
                            <ApplicationNavigation
                                currentStep={currentStep}
                                stepId={steps[currentStep].id}
                                onPrev={prevStep}
                                onNext={nextStep}
                                onSkip={skipStep}
                                showSkip={canSkip}
                            />
                        </div>

                        <LoadingOverlay isVisible={isSubmitting} />
                    </div>
                </form>
            </FormProvider>
        </div>
    );
};

export default Application;
