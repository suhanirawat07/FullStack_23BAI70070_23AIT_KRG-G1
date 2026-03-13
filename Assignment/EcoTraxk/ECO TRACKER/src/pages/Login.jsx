import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Login = () => {
    const {setIsAuthenticated} = useAuth();
    const navigate = useNavigate();

    const handleLogin = () => {
        setIsAuthenticated(true);
        navigate("/");
    }
    return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <div style={{ border: "1px solid gray", padding: "20px", width: "400px", margin: "auto" }}>
        
        <div style={{ marginBottom: "20px" }}>
          Dashboard &nbsp;&nbsp; Water Tracker &nbsp;&nbsp; Logout
        </div>

        <h2>Login Page</h2>

        <button
          onClick={onLogin}
          style={{
            padding: "10px 40px",
            marginTop: "40px",
            backgroundColor: "#4a6fdc",
            color: "white",
            border: "none"
          }}
        >
          Login
        </button>

      </div>
    </div>
  );
}
export default Login;