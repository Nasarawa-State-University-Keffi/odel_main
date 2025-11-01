import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { countries, locationData } from "@/data/location";

const Application = () => {
  const [currentStep, setCurrentStep] = useState(1);

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

  const handleNext = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const handlePrevious = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleReset = () => {
    if (currentStep === 1)
      setPersonalData({
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
    if (currentStep === 2)
      setContactData({ address: "", country: "", state: "", lga: "" });
    if (currentStep === 3)
      setKinData({ name: "", phone: "", relationship: "", address: "" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Stepper / Progress bar */}
          <Card className="p-6 bg-gradient-to-br from-primary/5 to-secondary/5">
            <h3 className="text-center text-sm font-semibold mb-6 text-muted-foreground">
              Open Distance and eLearning Application - Profile Completion
            </h3>

            <div className="relative flex items-center justify-between max-w-3xl mx-auto">
              <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted mx-[8%]" />
              <motion.div
                initial={{ width: "0%" }}
                animate={{
                  width:
                    currentStep === 1
                      ? "0%"
                      : currentStep === 2
                      ? "50%"
                      : "100%",
                }}
                transition={{ duration: 0.5 }}
                className="absolute top-5 left-[8%] h-0.5 bg-gradient-to-r from-secondary to-accent"
                style={{ width: `${((currentStep - 1) / 2) * 84}%` }}
              />

              {[
                { step: 1, title: "Personal Details", color: "from-primary to-primary/80" },
                { step: 2, title: "Contact Details", color: "from-secondary to-secondary/80" },
                { step: 3, title: "Next of Kin", color: "from-accent to-accent/80" },
              ].map((item) => (
                <div
                  key={item.step}
                  className="flex flex-col items-center flex-1 relative z-10"
                >
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: item.step * 0.1 }}
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all shadow-lg ${
                      currentStep > item.step
                        ? "bg-secondary border-secondary"
                        : currentStep === item.step
                        ? `bg-gradient-to-br ${item.color} border-transparent`
                        : "bg-background border-muted"
                    }`}
                  >
                    {currentStep > item.step ? (
                      <CheckCircle className="w-5 h-5 text-white" />
                    ) : (
                      <span
                        className={`text-sm font-bold ${
                          currentStep === item.step
                            ? "text-white"
                            : "text-muted-foreground"
                        }`}
                      >
                        {item.step}
                      </span>
                    )}
                  </motion.div>
                  <span
                    className={`text-xs mt-2 text-center font-medium transition-colors ${
                      currentStep >= item.step
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {item.title}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Step Content */}
          <Card className="p-8">
            {currentStep === 1 && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-center text-primary">
                  PERSONAL DETAILS
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    placeholder="Surname"
                    value={personalData.surname}
                    onChange={(e) =>
                      setPersonalData({ ...personalData, surname: e.target.value })
                    }
                  />
                  <Input
                    placeholder="Middle name"
                    value={personalData.middleName}
                    onChange={(e) =>
                      setPersonalData({
                        ...personalData,
                        middleName: e.target.value,
                      })
                    }
                  />
                  <Input
                    placeholder="First name"
                    value={personalData.firstName}
                    onChange={(e) =>
                      setPersonalData({
                        ...personalData,
                        firstName: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    placeholder="Place of birth"
                    value={personalData.placeOfBirth}
                    onChange={(e) =>
                      setPersonalData({
                        ...personalData,
                        placeOfBirth: e.target.value,
                      })
                    }
                  />
                  <Input
                    type="date"
                    placeholder="Date of birth"
                    value={personalData.dateOfBirth}
                    onChange={(e) =>
                      setPersonalData({
                        ...personalData,
                        dateOfBirth: e.target.value,
                      })
                    }
                  />
                  <Select
                    value={personalData.sex}
                    onValueChange={(value) =>
                      setPersonalData({ ...personalData, sex: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sex" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Select
                    value={personalData.maritalStatus}
                    onValueChange={(value) =>
                      setPersonalData({ ...personalData, maritalStatus: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Marital Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="married">Married</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Phone"
                    value={personalData.phone}
                    onChange={(e) =>
                      setPersonalData({ ...personalData, phone: e.target.value })
                    }
                  />
                  <Select
                    value={personalData.country}
                    onValueChange={(value) =>
                      setPersonalData({
                        ...personalData,
                        country: value,
                        state: "",
                        lga: "",
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Select
                    value={personalData.state}
                    onValueChange={(value) =>
                      setPersonalData({
                        ...personalData,
                        state: value,
                        lga: "",
                      })
                    }
                    disabled={!personalData.country}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="State" />
                    </SelectTrigger>
                    <SelectContent>
                      {personalData.country &&
                        locationData[personalData.country]?.states &&
                        Object.keys(
                          locationData[personalData.country].states
                        ).map((state) => (
                          <SelectItem key={state} value={state}>
                            {state}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={personalData.lga}
                    onValueChange={(value) =>
                      setPersonalData({ ...personalData, lga: value })
                    }
                    disabled={!personalData.state}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="LGA" />
                    </SelectTrigger>
                    <SelectContent>
                      {personalData.country &&
                        personalData.state &&
                        locationData[personalData.country]?.states[
                          personalData.state
                        ]?.map((lga) => (
                          <SelectItem key={lga} value={lga}>
                            {lga}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>

                  <Input
                    placeholder="Hometown"
                    value={personalData.hometown}
                    onChange={(e) =>
                      setPersonalData({
                        ...personalData,
                        hometown: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-center text-primary">
                  CONTACT DETAILS
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    placeholder="Address"
                    value={contactData.address}
                    onChange={(e) =>
                      setContactData({
                        ...contactData,
                        address: e.target.value,
                      })
                    }
                  />
                  <Select
                    value={contactData.country}
                    onValueChange={(value) =>
                      setContactData({
                        ...contactData,
                        country: value,
                        state: "",
                        lga: "",
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={contactData.state}
                    onValueChange={(value) =>
                      setContactData({
                        ...contactData,
                        state: value,
                        lga: "",
                      })
                    }
                    disabled={!contactData.country}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="State" />
                    </SelectTrigger>
                    <SelectContent>
                      {contactData.country &&
                        locationData[contactData.country]?.states &&
                        Object.keys(
                          locationData[contactData.country].states
                        ).map((state) => (
                          <SelectItem key={state} value={state}>
                            {state}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Select
                    value={contactData.lga}
                    onValueChange={(value) =>
                      setContactData({ ...contactData, lga: value })
                    }
                    disabled={!contactData.state}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="LGA" />
                    </SelectTrigger>
                    <SelectContent>
                      {contactData.country &&
                        contactData.state &&
                        locationData[contactData.country]?.states[
                          contactData.state
                        ]?.map((lga) => (
                          <SelectItem key={lga} value={lga}>
                            {lga}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-center text-primary">
                  NEXT OF KIN DETAILS
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    placeholder="Name"
                    value={kinData.name}
                    onChange={(e) =>
                      setKinData({ ...kinData, name: e.target.value })
                    }
                  />
                  <Input
                    placeholder="Phone"
                    value={kinData.phone}
                    onChange={(e) =>
                      setKinData({ ...kinData, phone: e.target.value })
                    }
                  />
                  <Select
                    value={kinData.relationship}
                    onValueChange={(value) =>
                      setKinData({ ...kinData, relationship: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Relationship" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="parent">Parent</SelectItem>
                      <SelectItem value="sibling">Sibling</SelectItem>
                      <SelectItem value="spouse">Spouse</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    placeholder="Address"
                    value={kinData.address}
                    onChange={(e) =>
                      setKinData({ ...kinData, address: e.target.value })
                    }
                  />
                </div>
              </div>
            )}

            {/* Step Buttons */}
            <div className="flex justify-end gap-3 mt-8">
              {currentStep > 1 && (
                <Button onClick={handlePrevious} variant="secondary">
                  Previous
                </Button>
              )}
              <Button onClick={handleReset} variant="destructive">
                Reset
              </Button>
              <Button
                onClick={handleNext}
                className="bg-muted text-muted-foreground hover:bg-muted/80"
              >
                {currentStep < 3 ? "Proceed" : "Finish"}
              </Button>
            </div>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Application;
