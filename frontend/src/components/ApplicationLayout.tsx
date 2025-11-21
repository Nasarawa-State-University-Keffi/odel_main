
import Header from "@/components/dashboardComponents/Header";

const ApplicationLayout = ({ children }: { children: React.ReactNode }) => {


  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="p-4 md:p-6">{children}</main>
    </div>
  );
};

export default ApplicationLayout;
