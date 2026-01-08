import { Button } from "@/features/admin/components/admission/components/ui/button";

const PaymentStep = () => {
  return (
    <div>
      <h3 className="text-center text-sm font-medium text-slate-500 mb-6 uppercase tracking-wide">
        Application Fee
      </h3>

      <div className="flex flex-col items-center py-8">
        <div className="w-full max-w-md space-y-4 px-4 md:px-0">
          <div className="bg-primary/10 text-primary p-4 rounded-lg flex items-center gap-3">
            <svg className="w-6 h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
            <p className="text-sm">Application fee of 10,315 is required.</p>
          </div>

          <Button className="w-full py-6 text-base">
            Pay now
          </Button>

          <Button variant="outline" className="w-full py-6 text-base">
            Download invoice
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentStep;
