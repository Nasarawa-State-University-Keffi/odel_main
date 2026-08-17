import { Outlet, useNavigate } from "react-router-dom";
import SideBar from "./SideBar";
import NavBar from "./NavBar";
import { navItems } from "@/data";
import { useUserContext } from "@/context/UserProvider";
import { useEffect, useState } from "react";
import { ROLES } from "@/types/user.types";


const ApplicationLayout = () => {
    const [targetNav, setTargetNav] = useState(navItems.student)

    const { user, isLoading } = useUserContext();

    const navigate = useNavigate();


    useEffect(() => {
        if (!isLoading) {
            if (!user) {
                navigate("/", { replace: true });
                return;
            }

            const isAdmin = user.roles.includes(ROLES.ADMIN);
            const isStaff = user.roles.includes(ROLES.STAFF);
            if (isAdmin) {
                setTargetNav(navItems.admin);
            } else if (isStaff) {
                setTargetNav(navItems.staff);
            } else {
                setTargetNav(navItems.student);
            }

        }
    }, [user, isLoading, navigate, targetNav]);



    return (
        <div className="flex h-screen w-full bg-zinc-50 dark:bg-zinc-950 overflow-hidden">

            <SideBar navItems={targetNav}/>

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

                <NavBar targetNav={targetNav}/>

                <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 relative">
                    <Outlet />
                </main>

            </div>
        </div>
    );
};

export default ApplicationLayout;