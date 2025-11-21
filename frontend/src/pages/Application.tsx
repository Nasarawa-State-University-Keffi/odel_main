import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ApplicationLayout from "@/components/ApplicationLayout";
import PersonalDetailsStep from "@/components/application/PersonalDetailsStep";
import ContactDetailsStep from "@/components/application/ContactDetailsStep";
import NextOfKinStep from "@/components/application/NextOfKinStep";
import ProgrammeStep from "@/components/application/ProgrammeStep";
import PaymentStep from "@/components/application/PaymentStep";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { useToast } from "@/hooks/use-toast";

const Application = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [isStepValid, setIsStepValid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const totalSteps = 5;
  const progress = (currentStep / totalSteps) * 100;

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
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs md:text-sm text-muted-foreground">{Math.round(progress)}%</span>
            <span className="text-xs md:text-sm font-medium text-muted-foreground text-center">
              ODEL Application
            </span>
            <span className="text-xs md:text-sm text-muted-foreground">100%</span>
          </div>
          <div className="w-full h-2 md:h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
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
