import { useState, Fragment } from "react";
import { Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ApplicationLayout from "@/layouts/ApplicationLayout";
import PersonalDetailsStep from "@/features/application/components/PersonalDetailsStep";
import ContactDetailsStep from "@/features/application/components/ContactDetailsStep";
import NextOfKinStep from "@/features/application/components/NextOfKinStep";
import ProgrammeStep from "@/features/application/components/ProgrammeStep";
import PaymentStep from "@/features/application/components/PaymentStep";
import { Button } from "@/features/admin/components/admission/components/ui/button";
import { Loader } from "@/features/admin/components/admission/components/ui/loader";
import { useToast } from "@/hooks/use-toast";

const Application = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [isStepValid, setIsStepValid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const totalSteps = 5;


  const handleNext = () => {
    if (!isStepValid && currentStep < 5) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields correctly.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1);
        setIsStepValid(false);
      } else {
        navigate("/dashboard");
      }
      setIsLoading(false);
    }, 500);
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setIsLoading(true);
      setTimeout(() => {
        setCurrentStep(currentStep - 1);
        setIsLoading(false);
      }, 300);
    }
  };

  const handleReset = () => {
    if (confirm("Are you sure you want to reset all form data?")) {
      setFormData({});
      setCurrentStep(1); // Reset to first step
      setIsStepValid(false);
      toast({
        title: "Form Reset",
        description: "All form data has been cleared.",
      });
    }
  };

  return (
    <ApplicationLayout>
      <div className="max-w-4xl mx-auto pt-20">
        <div className="bg-white rounded-lg shadow-sm border p-4 md:p-6 mb-6">
          <div className="flex items-center justify-between w-full px-2">
            {Array.from({ length: totalSteps }).map((_, index) => {
              const stepNumber = index + 1;
              const isCompleted = stepNumber < currentStep;
              const isActive = stepNumber === currentStep;
              const isLastStep = stepNumber === totalSteps;

              return (
                <Fragment key={stepNumber}>
                  {/* Step Circle */}
                  <div className="flex flex-col items-center relative z-10">
                    <div
                      className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300
                        ${isActive ? 'border-primary text-primary bg-white scale-110' :
                          isCompleted ? 'border-primary bg-primary text-primary-foreground' : 'border-gray-200 text-gray-400 bg-white'}
                      `}
                    >
                      {isCompleted ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <span className="text-sm md:text-base font-semibold">{stepNumber}</span>
                      )}
                    </div>
                  </div>

                  {/* Connector Line */}
                  {!isLastStep && (
                    <div className="flex-1 h-[2px] bg-gray-200 mx-2">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: stepNumber < currentStep ? '100%' : '0%' }}
                      />
                    </div>
                  )}
                </Fragment>
              );
            })}
          </div>
          <div className="mt-4 text-center">
            <span className="text-sm font-medium text-muted-foreground">
              Step {currentStep} of {totalSteps}
            </span>
          </div>
        </div>

        <div className="bg-card rounded-lg shadow-sm border p-4 md:p-8">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader size="lg" />
              <p className="text-muted-foreground mt-4">Loading...</p>
            </div>
          ) : (
            <>
              {currentStep === 1 && (
                <PersonalDetailsStep
                  formData={formData}
                  setFormData={setFormData}
                  onValidationChange={setIsStepValid}
                />
              )}
              {currentStep === 2 && (
                <ContactDetailsStep
                  formData={formData}
                  setFormData={setFormData}
                  onValidationChange={setIsStepValid}
                />
              )}
              {currentStep === 3 && (
                <NextOfKinStep
                  formData={formData}
                  setFormData={setFormData}
                  onValidationChange={setIsStepValid}
                />
              )}
              {currentStep === 4 && (
                <ProgrammeStep
                  formData={formData}
                  setFormData={setFormData}
                  onValidationChange={setIsStepValid}
                />
              )}
              {currentStep === 5 && <PaymentStep />}

              <div className="flex flex-col-reverse md:flex-row items-center justify-end gap-3 mt-8">
                {currentStep > 1 && currentStep < 5 && (
                  <Button
                    onClick={handlePrevious}
                    variant="secondary"
                    disabled={isLoading}
                  >
                    Previous
                  </Button>
                )}
                {currentStep < 5 && (
                  <Button
                    onClick={handleReset}
                    variant="destructive"
                    disabled={isLoading}
                  >
                    Reset
                  </Button>
                )}
                {currentStep < 5 && (
                  <Button
                    onClick={handleNext}
                    disabled={isLoading || !isStepValid}
                  >
                    Proceed
                  </Button>
                )}
                {currentStep === 5 && (
                  <Button
                    onClick={handlePrevious}
                    variant="secondary"
                    disabled={isLoading}
                  >
                    Previous
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </ApplicationLayout>
  );
};

export default Application;
