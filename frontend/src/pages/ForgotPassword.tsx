import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FloatingInput } from "@/components/ui/floating-input";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email) {
            toast({
                title: "Email Required",
                description: "Please enter your email address",
                variant: "destructive",
            });
            return;
        }

        setIsLoading(true);

        // Simulate API call
        setTimeout(() => {
            setIsLoading(false);
            setIsSubmitted(true);
            toast({
                title: "Reset Link Sent",
                description: "Check your email for password reset instructions",
            });
        }, 1500);
    };

    const handleReset = () => {
        setEmail("");
        setIsSubmitted(false);
    };

    if (isSubmitted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4">
                <div className="w-full max-w-md">
                    <div className="bg-card rounded-2xl shadow-2xl p-8 md:p-10 border border-border/50 backdrop-blur-sm">
                        <div className="text-center space-y-6">
                            <div className="flex justify-center">
                                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                                    <CheckCircle className="h-10 w-10 text-primary" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                                    Check Your Email
                                </h1>
                                <p className="text-muted-foreground">
                                    We've sent password reset instructions to
                                </p>
                                <p className="font-semibold text-foreground">{email}</p>
                            </div>

                            <div className="pt-4 space-y-3">
                                <Button
                                    onClick={handleReset}
                                    variant="outline"
                                    className="w-full"
                                >
                                    Try Another Email
                                </Button>

                                <Link to="/login" className="block">
                                    <Button variant="ghost" className="w-full">
                                        <ArrowLeft className="mr-2 h-4 w-4" />
                                        Back to Login
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4">
            <div className="w-full max-w-md">
                <div className="bg-card rounded-2xl shadow-2xl p-8 md:p-10 border border-border/50 backdrop-blur-sm">
                    {/* Header */}
                    <div className="text-center space-y-2 mb-8">
                        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                            Forgot Password?
                        </h1>
                        <p className="text-muted-foreground text-sm md:text-base">
                            No worries! Enter your email and we'll send you reset instructions
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <FloatingInput
                                label="Email Address"
                                type="email"
                                icon={<Mail className="h-4 w-4" />}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-3">
                            <Button
                                type="submit"
                                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                        Sending...
                                    </div>
                                ) : (
                                    "Send Reset Link"
                                )}
                            </Button>

                            <Button
                                type="button"
                                onClick={handleReset}
                                variant="outline"
                                className="w-full"
                            >
                                Clear
                            </Button>
                        </div>
                    </form>

                    {/* Back to Login */}
                    <div className="mt-6 text-center">
                        <Link
                            to="/login"
                            className="inline-flex items-center text-sm text-primary hover:text-primary/80 transition-colors font-medium"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Login
                        </Link>
                    </div>
                </div>

                {/* Additional Help */}
                <div className="mt-6 text-center">
                    <p className="text-sm text-muted-foreground">
                        Still having trouble?{" "}
                        <a
                            href="mailto:support@odel.edu.ng"
                            className="text-primary hover:text-primary/80 font-medium"
                        >
                            Contact Support
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
