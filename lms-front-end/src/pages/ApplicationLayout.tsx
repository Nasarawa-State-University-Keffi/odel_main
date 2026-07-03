import { Outlet } from "react-router-dom";
import SideBar from "./SideBar";
import NavBar from "./NavBar";

const ApplicationLayout = () => {
    return (
        <div className="flex h-screen w-full bg-zinc-50 dark:bg-zinc-950 overflow-hidden">

            <SideBar />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

                <NavBar />

                <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 relative">
                    <Outlet />
                </main>

            </div>
        </div>
    );
};

export default ApplicationLayout;