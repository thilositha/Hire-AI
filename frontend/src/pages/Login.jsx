import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("candidate");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await API.post("/auth/login", {
        email,
        password,
      });

      const { access_token, user } = response.data;

      // Store login information
      localStorage.setItem("token", access_token);
      localStorage.setItem("user", JSON.stringify(user));

      // Check selected role against actual database role
      if (user.role !== role) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        setError(
          `This account is registered as a ${user.role}. Please select ${user.role} login.`
        );

        return;
      }

      // Redirect based on actual role
      if (user.role === "recruiter") {
        navigate("/recruiter");
      } else {
        navigate("/candidate");
      }

    } catch (error) {

      setError(
        error.response?.data?.message ||
        "Login failed. Please try again."
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">

      <div className="auth-left">

        <div className="brand">
          <div className="brand-icon">H</div>
          <span>HireAI</span>
        </div>

        <div className="auth-hero">

          <span className="eyebrow">
            AI-POWERED RECRUITMENT
          </span>

          <h1>
            Find the right
            <span> talent.</span>
          </h1>

          <p>
            HireAI connects recruiters with talented candidates
            using intelligent recruitment technology.
          </p>

          <div className="feature-list">
            <div>
              <span>✓</span>
              Smart candidate matching
            </div>

            <div>
              <span>✓</span>
              AI-powered recruitment
            </div>

            <div>
              <span>✓</span>
              Faster hiring decisions
            </div>
          </div>

        </div>

      </div>


      <div className="auth-right">

        <div className="auth-card">

          <div className="mobile-logo">
            <div className="brand-icon">H</div>
            <span>HireAI</span>
          </div>

          <h2>Welcome back</h2>

          <p className="auth-subtitle">
            Login to continue to HireAI
          </p>


          <div className="role-selector">

            <button
              type="button"
              className={role === "candidate" ? "active" : ""}
              onClick={() => setRole("candidate")}
            >
              👤 Candidate
            </button>

            <button
              type="button"
              className={role === "recruiter" ? "active" : ""}
              onClick={() => setRole("recruiter")}
            >
              💼 Recruiter
            </button>

          </div>


          {error && (
            <div className="error-message">
              {error}
            </div>
          )}


          <form onSubmit={handleLogin}>

            <div className="form-group">

              <label>Email address</label>

              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

            </div>


            <div className="form-group">

              <label>Password</label>

              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

            </div>


            <button
              className="primary-btn"
              type="submit"
              disabled={loading}
            >

              {loading ? "Signing in..." : "Sign in →"}

            </button>

          </form>


          <p className="switch-auth">

            Don't have an account?

            <Link to="/register">
              Create account
            </Link>

          </p>

        </div>

      </div>

    </div>
  );
}

export default Login;