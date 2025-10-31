import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Application = () => {
  const [isRegistered, setIsRegistered] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();

  const [registrationData, setRegistrationData] = useState({
    applicationType: "Open Distance and eLearning Application 2025/2026",
    modeOfEntry: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [personalData, setPersonalData] = useState({
    surname: "",
    middleName: "",
    firstName: "",
    placeOfBirth: "",
    dateOfBirth: "",
    sex: "",
    maritalStatus: "",
    phone: "",
    country: "",
    state: "",
    lga: "",
    hometown: "",
  });

  const [contactData, setContactData] = useState({
    address: "",
    country: "",
    state: "",
    lga: "",
  });

  const [kinData, setKinData] = useState({
    name: "",
    phone: "",
    relationship: "",
    address: "",
  });

  const handleRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!registrationData.modeOfEntry) {
      toast({ title: "Please select mode of entry", variant: "destructive" });
      return;
    }
    if (!registrationData.email || !registrationData.password) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }
    if (registrationData.password !== registrationData.confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    setIsRegistered(true);
    toast({ title: "Registration successful! Please complete your profile." });
  };

  const handleNext = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const handlePrevious = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleReset = () => {
    if (currentStep === 1) setPersonalData({
      surname: "", middleName: "", firstName: "", placeOfBirth: "", dateOfBirth: "",
      sex: "", maritalStatus: "", phone: "", country: "", state: "", lga: "", hometown: ""
    });
    if (currentStep === 2) setContactData({ address: "", country: "", state: "", lga: "" });
    if (currentStep === 3) setKinData({ name: "", phone: "", relationship: "", address: "" });
  };

  const getProgress = () => (currentStep / 3) * 100;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {!isRegistered ? (
            <Card className="p-8">
              <h1 className="text-2xl font-bold mb-6">New application</h1>
              
              <form onSubmit={handleRegistration} className="space-y-4">
                <div>
                  <Input
                    value={registrationData.applicationType}
                    disabled
                    className="bg-muted"
                  />
                </div>

                <div>
                  <Select
                    value={registrationData.modeOfEntry}
                    onValueChange={(value) => setRegistrationData({ ...registrationData, modeOfEntry: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Mode of entry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="100level">100 Level</SelectItem>
                      <SelectItem value="200level">200 Level</SelectItem>
                      <SelectItem value="300level">300 Level</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Input
                    type="email"
                    placeholder="Email address"
                    value={registrationData.email}
                    onChange={(e) => setRegistrationData({ ...registrationData, email: e.target.value })}
                  />
                </div>

                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={registrationData.password}
                    onChange={(e) => setRegistrationData({ ...registrationData, password: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm Password"
                    value={registrationData.confirmPassword}
                    onChange={(e) => setRegistrationData({ ...registrationData, confirmPassword: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                <p className="text-sm text-muted-foreground">
                  Already registered?{" "}
                  <a href="#" className="text-primary hover:underline">
                    Login
                  </a>
                </p>

                <div className="flex justify-end">
                  <Button type="submit" className="bg-muted text-muted-foreground hover:bg-muted/80">
                    Proceed
                  </Button>
                </div>
              </form>
            </Card>
          ) : (
            <div className="space-y-6">
              <Card className="p-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">{Math.round(getProgress())}%</span>
                  <span className="text-sm text-muted-foreground">100%</span>
                </div>
                <div className="mb-2">
                  <span className="text-sm text-muted-foreground">Open Distance and eLearning Application</span>
                </div>
                <Progress value={getProgress()} className="h-2" />
              </Card>

              <Card className="p-8">
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <h2 className="text-lg font-semibold text-center text-primary">PERSONAL DETAILS</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Input placeholder="Surname" value={personalData.surname} onChange={(e) => setPersonalData({ ...personalData, surname: e.target.value })} />
                      <Input placeholder="Middle name" value={personalData.middleName} onChange={(e) => setPersonalData({ ...personalData, middleName: e.target.value })} />
                      <Input placeholder="First name" value={personalData.firstName} onChange={(e) => setPersonalData({ ...personalData, firstName: e.target.value })} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Input placeholder="Place of birth" value={personalData.placeOfBirth} onChange={(e) => setPersonalData({ ...personalData, placeOfBirth: e.target.value })} />
                      <Input type="date" placeholder="Date of birth" value={personalData.dateOfBirth} onChange={(e) => setPersonalData({ ...personalData, dateOfBirth: e.target.value })} />
                      <Select value={personalData.sex} onValueChange={(value) => setPersonalData({ ...personalData, sex: value })}>
                        <SelectTrigger><SelectValue placeholder="Sex" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Select value={personalData.maritalStatus} onValueChange={(value) => setPersonalData({ ...personalData, maritalStatus: value })}>
                        <SelectTrigger><SelectValue placeholder="Marital Status" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="single">Single</SelectItem>
                          <SelectItem value="married">Married</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input placeholder="Phone" value={personalData.phone} onChange={(e) => setPersonalData({ ...personalData, phone: e.target.value })} />
                      <Select value={personalData.country} onValueChange={(value) => setPersonalData({ ...personalData, country: value })}>
                        <SelectTrigger><SelectValue placeholder="Country" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="nigeria">Nigeria</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Select value={personalData.state} onValueChange={(value) => setPersonalData({ ...personalData, state: value })}>
                        <SelectTrigger><SelectValue placeholder="State" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="nasarawa">Nasarawa</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={personalData.lga} onValueChange={(value) => setPersonalData({ ...personalData, lga: value })}>
                        <SelectTrigger><SelectValue placeholder="LGA" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="keffi">Keffi</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input placeholder="Hometown" value={personalData.hometown} onChange={(e) => setPersonalData({ ...personalData, hometown: e.target.value })} />
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-6">
                    <h2 className="text-lg font-semibold text-center text-primary">CONTACT DETAILS</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Input placeholder="Address" value={contactData.address} onChange={(e) => setContactData({ ...contactData, address: e.target.value })} />
                      <Select value={contactData.country} onValueChange={(value) => setContactData({ ...contactData, country: value })}>
                        <SelectTrigger><SelectValue placeholder="Country" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="nigeria">Nigeria</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={contactData.state} onValueChange={(value) => setContactData({ ...contactData, state: value })}>
                        <SelectTrigger><SelectValue placeholder="State" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="nasarawa">Nasarawa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Select value={contactData.lga} onValueChange={(value) => setContactData({ ...contactData, lga: value })}>
                        <SelectTrigger><SelectValue placeholder="LGA" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="keffi">Keffi</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="space-y-6">
                    <h2 className="text-lg font-semibold text-center text-primary">NEXT OF KIN DETAILS</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Input placeholder="Name" value={kinData.name} onChange={(e) => setKinData({ ...kinData, name: e.target.value })} />
                      <Input placeholder="phone" value={kinData.phone} onChange={(e) => setKinData({ ...kinData, phone: e.target.value })} />
                      <Select value={kinData.relationship} onValueChange={(value) => setKinData({ ...kinData, relationship: value })}>
                        <SelectTrigger><SelectValue placeholder="Relationship" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="parent">Parent</SelectItem>
                          <SelectItem value="sibling">Sibling</SelectItem>
                          <SelectItem value="spouse">Spouse</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Input placeholder="Address" value={kinData.address} onChange={(e) => setKinData({ ...kinData, address: e.target.value })} />
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 mt-8">
                  {currentStep > 1 && (
                    <Button onClick={handlePrevious} variant="secondary">
                      Previous
                    </Button>
                  )}
                  <Button onClick={handleReset} variant="destructive">
                    Reset
                  </Button>
                  <Button onClick={handleNext} className="bg-muted text-muted-foreground hover:bg-muted/80">
                    Proceed
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Application;
