import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { FloatingInput } from "@/components/ui/floating-input";
import { FloatingSelect } from "@/components/ui/floating-select";
import { MapPin, Globe, Map } from "lucide-react";
import React, { useEffect } from "react";
import { useLocation } from "@/hooks/useLocation";
import { Loader } from "@/components/ui/loader";

const contactDetailsSchema = z.object({
  address: z.string().min(5, "Address is required"),
  country: z.string().min(1, "Country is required"),
  state: z.string().min(1, "State is required"),
  lga: z.string().min(1, "LGA is required"),
});

type ContactDetailsForm = z.infer<typeof contactDetailsSchema>;

interface ContactDetailsStepProps {
  formData: Record<string, unknown>;
  setFormData: (data: Record<string, unknown>) => void;
  onValidationChange?: (isValid: boolean) => void;
}

const ContactDetailsStep = ({ formData, setFormData, onValidationChange }: ContactDetailsStepProps) => {
  const { register, control, watch, setValue, formState: { errors, isValid } } = useForm<ContactDetailsForm>({
    resolver: zodResolver(contactDetailsSchema),
    mode: "onChange",
    defaultValues: formData,
  });

  const { countries, states, lgas, isLoading, fetchStates, fetchLGAs } = useLocation();
  const selectedCountry = watch("country");
  const selectedState = watch("state");

  useEffect(() => {
    if (selectedCountry) {
      fetchStates(selectedCountry);
    }
  }, [selectedCountry]);

  useEffect(() => {
    if (selectedCountry && selectedState) {
      fetchLGAs(selectedCountry, selectedState);
    }
  }, [selectedState, selectedCountry]);

  React.useEffect(() => {
    onValidationChange?.(isValid);
  }, [isValid, onValidationChange]);

  // Update formData when values change
  React.useEffect(() => {
    const subscription = watch((value) => {
      setFormData({ ...formData, ...value });
    });
    return () => subscription.unsubscribe();
  }, [watch, formData, setFormData]);

  return (
    <div>
      <h3 className="text-center text-sm font-medium text-muted-foreground mb-6 uppercase tracking-wide">
        Contact Details
      </h3>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <FloatingInput
              label="Address"
              icon={<MapPin className="h-4 w-4" />}
              {...register("address")}
            />
            {errors.address && <p className="text-xs text-destructive mt-1">{errors.address.message}</p>}
          </div>
          <div>
            <Controller
              name="country"
              control={control}
              render={({ field }) => (
                <FloatingSelect
                  label="Country"
                  icon={isLoading && countries.length === 0 ? <Loader size="sm" /> : <Globe className="h-4 w-4" />}
                  options={countries}
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    setValue("state", ""); // Reset state
                    setValue("lga", ""); // Reset LGA
                  }}
                />
              )}
            />
            {errors.country && <p className="text-xs text-destructive mt-1">{errors.country.message}</p>}
          </div>
          <div>
            <Controller
              name="state"
              control={control}
              render={({ field }) => (
                <FloatingSelect
                  label="State"
                  icon={isLoading && states.length === 0 && selectedCountry ? <Loader size="sm" /> : <Map className="h-4 w-4" />}
                  options={states}
                  disabled={!selectedCountry || (isLoading && states.length === 0)}
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    setValue("lga", ""); // Reset LGA
                  }}
                />
              )}
            />
            {errors.state && <p className="text-xs text-destructive mt-1">{errors.state.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Controller
              name="lga"
              control={control}
              render={({ field }) => (
                <FloatingSelect
                  label="LGA"
                  icon={isLoading && lgas.length === 0 && selectedState ? <Loader size="sm" /> : <Map className="h-4 w-4" />}
                  options={lgas}
                  disabled={!selectedState || (isLoading && lgas.length === 0)}
                  {...field}
                />
              )}
            />
            {errors.lga && <p className="text-xs text-destructive mt-1">{errors.lga.message}</p>}
          </div>
          <div></div>
          <div></div>
        </div>
      </div>
    </div>
  );
};

export default ContactDetailsStep;
