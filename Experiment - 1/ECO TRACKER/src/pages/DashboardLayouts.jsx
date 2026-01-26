import { Link, Outlet } from "react-router-dom";

const DashboardLayout = () => {
    return (
        <>
        <h3>Dashboard</h3>

        <nav>
            <Link to = "settings">Settings</Link>{" "}
            <Link to = "summary">Summmary</Link>{" "}
            <Link to = "analytics">Analytics</Link>            
        </nav>

        <hr />
        <Outlet />
        </>

    )
}

export default DashboardLayout;