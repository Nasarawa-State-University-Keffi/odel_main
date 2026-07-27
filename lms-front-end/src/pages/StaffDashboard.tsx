import { useStaffDashboard } from "@/service/useStaffDashboard"
import { useEffect } from "react"


const StaffDashboard = () => {
    const { fetchStaffData, isPending } = useStaffDashboard()

    // useEffect(() => {
    //     (async () => {
    //         await fetchStaffData()
    //     })()
    // }, [])
    return (
        <div>StaffDashboard</div>
    )
}

export default StaffDashboard