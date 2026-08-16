import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";

function Register() {

  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("candidate");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {

    e.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    try {

      const response = await API.post("/auth/register", {
        name,
        email,
        password,
        role,
      });

      setSuccess(response.data.message);

      setTimeout(() => {
        navigate("/login");
      }, 1200);

    } catch (error) {

      setError(
        error.response?.data?.message ||
        "Registration failed"
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
            BUILD YOUR FUTURE
          </span>

          <h1>
            One platform.
            <span> Endless possibilities.</span>
          </h1>

          <p>
            Whether you're looking for your next opportunity
            or your next great hire, HireAI makes recruitment smarter.
          </p>

        </div>

      </div>


      <div className="auth-right">

        <div className="auth-card">

          <div className="mobile-logo">
            <div className="brand-icon">H</div>
            <span>HireAI</span>
          </div>

          <h2>Create account</h2>

          <p className="auth-subtitle">
            Join the future of recruitment
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

          {success && (
            <div className="success-message">
              {success}
            </div>
          )}


          <form onSubmit={handleRegister}>

            <div className="form-group">

              <label>Full name</label>

              <input
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

            </div>


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
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength="6"
                required
              />

            </div>


            <button
              type="submit"
              className="primary-btn"
              disabled={loading}
            >

              {loading ? "Creating account..." : "Create account →"}

            </button>

          </form>


          <p className="switch-auth">

            Already have an account?

            <Link to="/login">
              Sign in
            </Link>

          </p>

        </div>

      </div>

    </div>
  );
}

export default Register;