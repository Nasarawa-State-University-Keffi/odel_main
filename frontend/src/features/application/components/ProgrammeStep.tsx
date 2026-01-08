import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import React from "react";
import { FloatingSelect } from "@/features/admin/components/admission/components/ui/floating-select";
import { Button } from "@/features/admin/components/admission/components/ui/button";
import { Checkbox } from "@/features/admin/components/admission/components/ui/checkbox";
import { Upload, GraduationCap } from "lucide-react";

const programmeSchema = z.object({
  programme: z.string().min(1, "Programme is required"),
  declaration: z.boolean().refine((val) => val === true, {
    message: "You must accept the declaration",
  }),
});

type ProgrammeForm = z.infer<typeof programmeSchema>;

interface ProgrammeStepProps {
  formData: Record<string, unknown>;
  setFormData: (data: Record<string, unknown>) => void;
  onValidationChange?: (isValid: boolean) => void;
}

const ProgrammeStep = ({ formData, setFormData, onValidationChange }: ProgrammeStepProps) => {
  const [passport, setPassport] = useState<string | null>(null);
  const [declarationChecked, setDeclarationChecked] = useState(false);

  const { register, control, formState: { errors, isValid }, setValue } = useForm<ProgrammeForm>({
    resolver: zodResolver(programmeSchema),
    mode: "onChange",
    defaultValues: formData,
  });

  React.useEffect(() => {
    onValidationChange?.(isValid && passport !== null);
  }, [isValid, passport, onValidationChange]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPassport(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div>
      <h3 className="text-center text-sm font-medium text-muted-foreground mb-6 uppercase tracking-wide">
        Programme Selection
      </h3>

      <div className="space-y-6">
        <div>
          <Controller
            name="programme"
            control={control}
            render={({ field }) => (
              <FloatingSelect
                label="Programme of study"
                icon={<GraduationCap className="h-4 w-4" />}
                options={[
                  { value: "bsc-public-admin", label: "B.Sc Public Administration (ODEL)" },
                  { value: "bsc-computer-science", label: "B.Sc Computer Science (ODEL)" },
                  { value: "ba-english", label: "B.A English (ODEL)" },
                  { value: "other", label: "Other Programmes" },
                ]}
                {...field}
              />
            )}
          />
          {errors.programme && <p className="text-xs text-destructive mt-1">{errors.programme.message}</p>}
        </div>

        <div className="flex flex-col items-center">
          <label className="text-sm text-muted-foreground mb-3">Passport (recent)</label>
          <div className="w-32 h-32 bg-muted rounded flex items-center justify-center mb-3 overflow-hidden border-2 border-input">
            {passport ? (
              <img src={passport} alt="Passport" className="w-full h-full object-cover" />
            ) : (
              <svg className="w-20 h-20 text-muted-foreground" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            )}
          </div>
          <label htmlFor="passport-upload">
            <Button type="button" variant="default" asChild>
              <span className="cursor-pointer">
                <Upload className="h-4 w-4 mr-2" />
                {passport ? "Change Photo" : "Upload Photo"}
              </span>
            </Button>
          </label>
          <input
            id="passport-upload"
            type="file"
            accept="image/jpeg,image/png"
            onChange={handleFileChange}
            className="hidden"
          />
          {!passport && <p className="text-xs text-destructive mt-2">Passport photo is required</p>}
        </div>

        <div className="border-2 border-input rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Checkbox
              id="declaration"
              checked={declarationChecked}
              onCheckedChange={(checked) => {
                setDeclarationChecked(checked as boolean);
                setValue("declaration", checked as boolean);
              }}
            />
            <label htmlFor="declaration" className="text-sm text-foreground leading-relaxed cursor-pointer">
              I hereby declare that particulars given in this form are to best of my knowledge and belief correct,
              and that if admitted into the University, I shall regard myself bound by Act Status and Regulations
              of the University as they affect me. I also accept that the University reserves the right to withdraw
              admission made in error, and cancel my admission or enrolment if it is subsequently discovered
              that I have given false information or withheld information to aid my application or admission. The decision of
              the University on all matters pertaining to this application is final and no communication will be
              entertained from any candidate whose application is unsuccessful
            </label>
          </div>
          {errors.declaration && <p className="text-xs text-destructive mt-2">{errors.declaration.message}</p>}
        </div>
      </div>
    </div>
  );
};

export default ProgrammeStep;
