import React from 'react';

interface ApplicationNavigationProps {
    currentStep: number;
    stepId: string;
    onPrev: () => void;
    onNext: () => void;
    onSkip?: () => void;
    showSkip?: boolean;
}

export const ApplicationNavigation: React.FC<ApplicationNavigationProps> = ({
    currentStep,
    stepId,
    onPrev,
    onNext,
    onSkip,
    showSkip
}) => {
    // Navigation Buttons for all steps except the last one (Review handles its own submit)
    if (stepId !== 'review') {
        return (
            <div className="mt-8 flex justify-between">
                <button
                    type="button"
                    onClick={onPrev}
                    disabled={currentStep === 0}
                    className={`px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs transition-all
                        ${currentStep === 0
                            ? 'opacity-0 pointer-events-none'
                            : 'bg-muted hover:bg-muted/80 text-foreground'}`}
                >
                    Previous
                </button>

                <div className="flex gap-3">
                    {showSkip && onSkip && (
                        <button
                            type="button"
                            onClick={onSkip}
                            className="px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs border-2 border-primary/20 text-primary hover:bg-primary/5 transition-all"
                        >
                            Skip / Continue
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={onNext}
                        className="px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-xs bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        Next Step
                    </button>
                </div>
            </div>
        );
    }

    // Special case for Review step to allow going back
    return (
        <div className="mt-4">
            <button
                type="button"
                onClick={onPrev}
                className="text-muted-foreground hover:text-foreground text-xs font-bold uppercase tracking-widest"
            >
                ← Back to Uploads
            </button>
        </div>
    );
};
