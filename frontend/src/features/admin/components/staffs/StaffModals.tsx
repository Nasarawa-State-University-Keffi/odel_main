import CreateStaffModal from "./CreateStaffModal";
import UpdateStaffModal from "./UpdateStaffModal";
import ViewAssignedCoursesModal from "./ViewAssignedCoursesModal";
import ViewCourseApprovalsModal from "./ViewCourseApprovalsModal";
import MakeLevelAdviserModal from "./MakeLevelAdviserModal";
import MakeDepartmentExamOfficerModal from "./MakeDepartmentExamOfficerModal";
import { Staff } from "../../types/staff";

interface StaffModalsProps {
    isCreateModalOpen: boolean;
    setIsCreateModalOpen: (open: boolean) => void;
    isUpdateModalOpen: boolean;
    setIsUpdateModalOpen: (open: boolean) => void;
    isViewCoursesModalOpen: boolean;
    setIsViewCoursesModalOpen: (open: boolean) => void;
    isViewCourseApprovalsModalOpen: boolean;
    setIsViewCourseApprovalsModalOpen: (open: boolean) => void;
    isMakeLevelAdviserModalOpen: boolean;
    setIsMakeLevelAdviserModalOpen: (open: boolean) => void;
    isMakeDepartmentExamOfficerModalOpen: boolean;
    setIsMakeDepartmentExamOfficerModalOpen: (open: boolean) => void;
    selectedStaff: Staff | null;
    onRefresh: () => void;
}

const StaffModals = ({
    isCreateModalOpen, setIsCreateModalOpen,
    isUpdateModalOpen, setIsUpdateModalOpen,
    isViewCoursesModalOpen, setIsViewCoursesModalOpen,
    isViewCourseApprovalsModalOpen, setIsViewCourseApprovalsModalOpen,
    isMakeLevelAdviserModalOpen, setIsMakeLevelAdviserModalOpen,
    isMakeDepartmentExamOfficerModalOpen, setIsMakeDepartmentExamOfficerModalOpen,
    selectedStaff,
    onRefresh
}: StaffModalsProps) => {
    return (
        <>
            <CreateStaffModal
                open={isCreateModalOpen}
                onOpenChange={setIsCreateModalOpen}
                onSuccess={onRefresh}
            />

            <UpdateStaffModal
                open={isUpdateModalOpen}
                onOpenChange={setIsUpdateModalOpen}
                staff={selectedStaff}
                onSuccess={onRefresh}
            />

            <ViewAssignedCoursesModal
                open={isViewCoursesModalOpen}
                onOpenChange={setIsViewCoursesModalOpen}
                staff={selectedStaff}
            />

            <ViewCourseApprovalsModal
                open={isViewCourseApprovalsModalOpen}
                onOpenChange={setIsViewCourseApprovalsModalOpen}
                staff={selectedStaff}
            />

            <MakeLevelAdviserModal
                open={isMakeLevelAdviserModalOpen}
                onOpenChange={setIsMakeLevelAdviserModalOpen}
                staff={selectedStaff}
            />

            <MakeDepartmentExamOfficerModal
                open={isMakeDepartmentExamOfficerModalOpen}
                onOpenChange={setIsMakeDepartmentExamOfficerModalOpen}
                staff={selectedStaff}
            />
        </>
    );
};

export default StaffModals;
