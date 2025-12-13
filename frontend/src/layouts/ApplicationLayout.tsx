
import Header from "@/features/dashboard/components/Header";

const ApplicationLayout = ({ children }: { children: React.ReactNode }) => {


  return (
    <div className="h-full bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1 p-4 md:p-6 overflow-y-auto">{children}</main>
    </div>
  );
};

export default ApplicationLayout;
