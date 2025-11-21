import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { FloatingInput } from "@/components/ui/floating-input";
import { FloatingSelect } from "@/components/ui/floating-select";
import { User, Phone, MapPin, Mail } from "lucide-react";
import React from "react";

const nextOfKinSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  email: z.string().email("Valid email is required"),
  address: z.string().min(5, "Address is required"),
  relationship: z.string().min(1, "Relationship is required"),
});

type NextOfKinForm = z.infer<typeof nextOfKinSchema>;

interface NextOfKinStepProps {
  formData: Record<string, unknown>;
  setFormData: (data: Record<string, unknown>) => void;
  onValidationChange?: (isValid: boolean) => void;
}

const NextOfKinStep = ({ formData, setFormData, onValidationChange }: NextOfKinStepProps) => {
  const { register, control, formState: { errors, isValid } } = useForm<NextOfKinForm>({
    resolver: zodResolver(nextOfKinSchema),
    mode: "onChange",
    defaultValues: formData,
  });

  React.useEffect(() => {
    onValidationChange?.(isValid);
  }, [isValid, onValidationChange]);

  return (
    <div>
      <h3 className="text-center text-sm font-medium text-muted-foreground mb-6 uppercase tracking-wide">
        Next of Kin Details
      </h3>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <FloatingInput
              label="Full Name"
              icon={<User className="h-4 w-4" />}
              {...register("fullName")}
            />
            {errors.fullName && <p className="text-xs text-destructive mt-1">{errors.fullName.message}</p>}
          </div>
          <div>
            <FloatingInput
              label="Phone Number"
              icon={<Phone className="h-4 w-4" />}
              {...register("phone")}
            />
            {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <FloatingInput
              label="Email"
              type="email"
              icon={<Mail className="h-4 w-4" />}
              {...register("email")}
            />
            {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <FloatingInput
              label="Address"
              icon={<MapPin className="h-4 w-4" />}
              {...register("address")}
            />
            {errors.address && <p className="text-xs text-destructive mt-1">{errors.address.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Controller
              name="relationship"
              control={control}
              render={({ field }) => (
                <FloatingSelect
                  label="Relationship"
                  icon={<User className="h-4 w-4" />}
                  options={[
                    { value: "parent", label: "Parent" },
                    { value: "sibling", label: "Sibling" },
                    { value: "spouse", label: "Spouse" },
                    { value: "other", label: "Other" },
                  ]}
                  {...field}
                />
              )}
            />
            {errors.relationship && <p className="text-xs text-destructive mt-1">{errors.relationship.message}</p>}
          </div>
          <div></div>
        </div>
      </div>
    </div>
  );
};

export default NextOfKinStep;
