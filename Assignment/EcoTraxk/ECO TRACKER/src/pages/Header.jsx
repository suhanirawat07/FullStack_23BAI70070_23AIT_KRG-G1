import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

const Header = () => {
    const {isAuthenticated} = useAuth();
    return (
        <header style = {{
            padding: '10px',
            backgroundColor: '#dc9de3',
            color : 'white',
            textAlign : 'center',
        }}> 
        <h1>ECO TRACKER</h1>
        <div className="items">
            <Link to = "/">Dashboard</Link>{" "}
            <Link to = "/logs">Logs</Link>{" "}
            {isAuthenticated ? (
                <Link to = "/logout">Logout</Link>
            ) : (
                <Link to = "/login">Login</Link>
            )}
        </div>
        </header>
    )
}
export default Header;