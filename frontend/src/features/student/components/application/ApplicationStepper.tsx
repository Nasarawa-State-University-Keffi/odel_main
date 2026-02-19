import React from 'react';

interface Step {
    id: string;
    title: string;
}

interface ApplicationStepperProps {
    steps: Step[];
    currentStep: number;
}

export const ApplicationStepper: React.FC<ApplicationStepperProps> = ({ steps, currentStep }) => {
    return (
        <div className="mb-8 overflow-x-auto pb-4">
            <div className="flex items-center justify-between min-w-max md:min-w-0 px-2">
                {steps.map((step, index) => {
                    const isActive = index === currentStep;
                    const isCompleted = index < currentStep;

                    return (
                        <div key={step.id} className="flex flex-col items-center relative z-10 mx-2">
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all duration-300
                                ${isActive ? 'bg-primary border-primary text-primary-foreground scale-110 shadow-lg shadow-primary/30' :
                                        isCompleted ? 'bg-green-500 border-green-500 text-white' :
                                            'bg-background border-border text-muted-foreground'}`}
                            >
                                {isCompleted ? '✓' : index + 1}
                            </div>
                            <span className={`text-[10px] uppercase tracking-wider font-bold mt-2 transition-colors duration-300
                                ${isActive ? 'text-primary' : isCompleted ? 'text-green-500' : 'text-muted-foreground'}`}>
                                {step.title}
                            </span>
                            {index < steps.length - 1 && (
                                <div className={`hidden md:block absolute top-5 left-1/2 w-full h-[2px] -z-10 transition-colors duration-500
                                    ${isCompleted ? 'bg-green-500' : 'bg-border/30'}`}
                                    style={{ width: 'calc(100% + 2rem)' }}
                                />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
