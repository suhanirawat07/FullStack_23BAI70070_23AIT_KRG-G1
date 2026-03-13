import { Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import Logout from "./pages/Logout";
import DashboardAnalytics from "./pages/DashboardAnalytics";
import DashboardLayout from "./pages/DashboardLayouts";
import DashboardSummary from "./pages/DashboardSummary";
import DashboardSettings from "./pages/DashboardSettings";
import ProtectedRoute from "./routes/ProtectedRoute";
import Logs from "./data/LogsDetails";
import Header from "./pages/Header";

function App() {
    return (
        <>
        <Header />
        <Routes>
          
            <Route path = "/Login" element = {<Login/>} />
            <Route path = "/Logout" element = {<Logout/>}/>
            <Route path = "/" 
            element = {
                <ProtectedRoute>
                <DashboardLayout/>
                </ProtectedRoute>
            }>
            <Route index element = {<DashboardSummary/>}/>
            <Route path = "settings" element = {<DashboardSettings/>}/>
            <Route path = "summary" element = {<DashboardSummary/>}/>
            <Route path = "analytics" element = {<DashboardAnalytics/>}/>
            </Route>
            <Route path = "/logs"
            element = {
                <ProtectedRoute>
                <Logs/>
                </ProtectedRoute>
            }>
            </Route>
        </Routes>
        </>
    )
}
export default App;