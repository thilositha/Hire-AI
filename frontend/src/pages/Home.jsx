import { Link } from "react-router-dom";

function Home() {

  return (

    <div className="home-page">

      <nav className="navbar">

        <div className="brand">

          <div className="brand-icon">
            H
          </div>

          <span>
            HireAI
          </span>

        </div>


        <div className="nav-links">

          <Link to="/login">
            Login
          </Link>

          <Link
            to="/register"
            className="nav-button"
          >
            Get Started
          </Link>

        </div>

      </nav>


      <main className="hero-section">

        <div className="hero-content">

          <div className="hero-badge">
            ✦ AI-POWERED RECRUITMENT
          </div>

          <h1>
            Hiring made
            <span> intelligent.</span>
          </h1>

          <p>
            HireAI helps companies discover the right talent
            and helps candidates find opportunities that match
            their skills.
          </p>


          <div className="hero-buttons">

            <Link
              to="/register"
              className="hero-primary"
            >
              Start Hiring →
            </Link>

            <Link
              to="/register"
              className="hero-secondary"
            >
              Find Opportunities
            </Link>

          </div>


          <div className="hero-stats">

            <div>
              <strong>AI</strong>
              <span>Smart Matching</span>
            </div>

            <div>
              <strong>24/7</strong>
              <span>Recruitment</span>
            </div>

            <div>
              <strong>100%</strong>
              <span>Secure</span>
            </div>

          </div>

        </div>


        <div className="hero-visual">

          <div className="floating-card card-one">
            <span>✓</span>
            Candidate matched
          </div>

          <div className="ai-circle">

            <div className="ai-inner">
              <span>H</span>
            </div>

          </div>

          <div className="floating-card card-two">
            <span>✦</span>
            AI-powered matching
          </div>

        </div>

      </main>


      <section className="features">

        <div className="feature">

          <div className="feature-icon">
            ✦
          </div>

          <h3>
            AI Matching
          </h3>

          <p>
            Match candidates with relevant opportunities.
          </p>

        </div>


        <div className="feature">

          <div className="feature-icon">
            ◈
          </div>

          <h3>
            Smart Hiring
          </h3>

          <p>
            Give recruiters better tools for hiring.
          </p>

        </div>


        <div className="feature">

          <div className="feature-icon">
            ◎
          </div>

          <h3>
            Secure Platform
          </h3>

          <p>
            Your account information stays protected.
          </p>

        </div>

      </section>

    </div>
  );
}

export default Home;