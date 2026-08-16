import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

function RecruiterApplicants() {

  const navigate = useNavigate();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  // =====================================================
  // LOAD APPLICATIONS
  // =====================================================

  useEffect(() => {

    loadApplications();

  }, []);


  const loadApplications = async () => {

    try {

      setLoading(true);
      setError("");

      const response = await API.get(
        "/recruiter/applications"
      );

      setApplications(
        response.data
      );

    } catch (error) {

      console.error(
        "Failed to load applicants:",
        error
      );

      setError(
        error.response?.data?.message ||
        "Failed to load applicants"
      );

    } finally {

      setLoading(false);

    }

  };


  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {

    return (

      <div className="dashboard">

        <main className="dashboard-content">

          <div className="loading">
            Loading applicants...
          </div>

        </main>

      </div>

    );

  }


  // =====================================================
  // UI
  // =====================================================

  return (

    <div className="dashboard">


      {/* =================================================
          NAVBAR
      ================================================= */}

      <nav className="dashboard-nav">


        <div className="brand">

          <div className="brand-icon">
            H
          </div>

          HireAI

        </div>


        <div className="nav-user">

          <button
            onClick={() =>
              navigate("/recruiter")
            }
          >
            ← Back to Dashboard
          </button>

        </div>


      </nav>



      {/* =================================================
          CONTENT
      ================================================= */}

      <main className="dashboard-content">


        {/* =================================================
            HEADER
        ================================================= */}

        <div className="dashboard-heading">

          <div>

            <span className="eyebrow">
              RECRUITMENT
            </span>

            <h1>
              Applicants
            </h1>

            <p>
              Review candidates who applied to your jobs.
            </p>

          </div>

        </div>



        {/* =================================================
            ERROR
        ================================================= */}

        {error && (

          <div className="error-message">
            {error}
          </div>

        )}



        {/* =================================================
            APPLICATION COUNT
        ================================================= */}

        <div className="stats">

          <div className="stat-card">

            <span>
              Total Applications
            </span>

            <strong>
              {applications.length}
            </strong>

          </div>


          <div className="stat-card">

            <span>
              Candidates
            </span>

            <strong>
              {applications.length}
            </strong>

          </div>


          <div className="stat-card">

            <span>
              AI Screening
            </span>

            <strong>
              ✓
            </strong>

          </div>

        </div>



        {/* =================================================
            APPLICANT LIST
        ================================================= */}

        <section className="applications-section">


          <div className="section-header">

            <div>

              <h2>
                Candidate Applications
              </h2>

              <p>
                Select a candidate to view their resume
                and AI-powered job match analysis.
              </p>

            </div>

          </div>



          {applications.length === 0 ? (

            /* =============================================
               NO APPLICATIONS
            ============================================= */

            <div className="empty-state">

              <div className="empty-icon">
                👤
              </div>

              <h3>
                No applications yet
              </h3>

              <p>
                Candidates who apply for your jobs
                will appear here.
              </p>

              <button
                className="post-job-btn"
                onClick={() =>
                  navigate("/recruiter")
                }
              >
                Back to Jobs
              </button>

            </div>

          ) : (

            /* =============================================
               APPLICATION LIST
            ============================================= */

            <div className="applicant-list">


              {applications.map(
                (application) => (

                  <div
                    className="applicant-card"
                    key={application._id}
                  >


                    {/* =================================
                        CANDIDATE AVATAR
                    ================================= */}

                    <div className="applicant-avatar">

                      {application.candidate_name
                        ?.charAt(0)
                        ?.toUpperCase()}

                    </div>



                    {/* =================================
                        CANDIDATE INFORMATION
                    ================================= */}

                    <div className="applicant-info">


                      <h3>
                        {application.candidate_name}
                      </h3>


                      <p>
                        {application.candidate_email}
                      </p>


                      <span>

                        Applied for{" "}

                        <strong>
                          {application.job_title}
                        </strong>

                      </span>


                      {application.company && (

                        <small>

                          {application.company}

                        </small>

                      )}


                    </div>



                    {/* =================================
                        STATUS
                    ================================= */}

                    <div className="applicant-status">

                      <span className="status-badge">

                        {application.status ||
                          "Applied"}

                      </span>

                    </div>



                    {/* =================================
                        ACTIONS
                    ================================= */}

                    <div className="applicant-actions">


                      <button
  className="view-resume-btn"
  onClick={() =>
    navigate(
      `/recruiter/applications/${application._id}/analyze`
    )
  }
>
  View Candidate
</button>

                    </div>


                  </div>

                )
              )}

            </div>

          )}

        </section>


      </main>

    </div>

  );

}

export default RecruiterApplicants;