import DepartmentList from "@/features/admin/components/departments/DepartmentList";

const DepartmentManagement = () => {
    return (
        <div className="flex flex-col h-full bg-muted/10">
            <DepartmentList />
        </div>
    );
};

export default DepartmentManagement;
