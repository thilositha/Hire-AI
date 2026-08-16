import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

function RecruiterDashboard() {

  const navigate = useNavigate();

  // =========================
  // USER & JOB STATES
  // =========================

  const [user, setUser] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);

  // =========================
  // FORM STATES
  // =========================

  const [showForm, setShowForm] = useState(false);
  const [editingJob, setEditingJob] = useState(null);

  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [description, setDescription] = useState("");
  const [skills, setSkills] = useState("");
  const [location, setLocation] = useState("");
  const [salary, setSalary] = useState("");

  // =========================
  // MESSAGE STATES
  // =========================

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");


  // =========================
  // INITIAL LOAD
  // =========================

  useEffect(() => {

    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      navigate("/login");
      return;
    }

    const parsedUser = JSON.parse(storedUser);

    // Candidate should not access recruiter dashboard
    if (parsedUser.role !== "recruiter") {
      navigate("/candidate");
      return;
    }

    setUser(parsedUser);

    loadDashboardData();

  }, [navigate]);


  // =========================
  // LOAD JOBS + APPLICATIONS
  // =========================

  const loadDashboardData = async () => {

    try {

      const [
        jobsResponse,
        applicationsResponse
      ] = await Promise.all([

        API.get("/recruiter/jobs"),

        API.get("/recruiter/applications")

      ]);

      setJobs(jobsResponse.data);

      setApplications(
        applicationsResponse.data
      );

    } catch (error) {

      console.error(error);

      setError(
        error.response?.data?.message ||
        "Failed to load recruiter data"
      );

    }

  };


  // =========================
  // EDIT JOB
  // =========================

  const handleEditClick = (job) => {

    setEditingJob(job);

    setTitle(job.title || "");

    setCompany(job.company || "");

    setDescription(
      job.description || ""
    );

    setSkills(
      Array.isArray(job.skills)
        ? job.skills.join(", ")
        : ""
    );

    setLocation(
      job.location || ""
    );

    setSalary(
      job.salary || ""
    );

    setShowForm(true);

    setMessage("");
    setError("");

  };


  // =========================
  // CREATE / UPDATE JOB
  // =========================

  const handleSubmitJob = async (e) => {

    e.preventDefault();

    setMessage("");
    setError("");

    try {

      const jobData = {

        title,

        company,

        description,

        skills: skills
          .split(",")
          .map((skill) => skill.trim())
          .filter(Boolean),

        location,

        salary

      };


      // =========================
      // UPDATE JOB
      // =========================

      if (editingJob) {

        await API.put(
          `/jobs/${editingJob._id}`,
          jobData
        );

        setMessage(
          "Job updated successfully!"
        );

      }


      // =========================
      // CREATE JOB
      // =========================

      else {

        await API.post(
          "/jobs",
          jobData
        );

        setMessage(
          "Job posted successfully!"
        );

      }


      // =========================
      // RESET FORM
      // =========================

      setTitle("");
      setCompany("");
      setDescription("");
      setSkills("");
      setLocation("");
      setSalary("");

      setEditingJob(null);

      setShowForm(false);

      // Reload jobs + applications
      loadDashboardData();

    } catch (error) {

      setError(
        error.response?.data?.message ||
        "Failed to save job"
      );

    }

  };


  // =========================
  // CANCEL FORM
  // =========================

  const handleCancelForm = () => {

    setTitle("");
    setCompany("");
    setDescription("");
    setSkills("");
    setLocation("");
    setSalary("");

    setEditingJob(null);

    setShowForm(false);

    setMessage("");
    setError("");

  };


  // =========================
  // DELETE JOB
  // =========================

  const handleDelete = async (id) => {

    const confirmed = window.confirm(
      "Are you sure you want to delete this job?"
    );

    if (!confirmed) {
      return;
    }

    try {

      await API.delete(
        `/jobs/${id}`
      );

      setMessage(
        "Job deleted successfully!"
      );

      loadDashboardData();

    } catch (error) {

      setError(
        error.response?.data?.message ||
        "Failed to delete job"
      );

    }

  };


  // =========================
  // LOGOUT
  // =========================

  const logout = () => {

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login");

  };


  // =========================
  // UI
  // =========================

  return (

    <div className="dashboard">


      {/* =================================
          NAVIGATION
      ================================= */}

      <nav className="dashboard-nav">

        <div className="brand">

          <div className="brand-icon">
            H
          </div>

          HireAI

        </div>


        <div className="nav-user">

          <div className="user-info">

            <strong>
              {user?.name}
            </strong>

            <span>
              Recruiter
            </span>

          </div>


          <button onClick={logout}>
            Logout
          </button>

        </div>

      </nav>


      {/* =================================
          MAIN CONTENT
      ================================= */}

      <main className="dashboard-content">


        {/* =================================
            HEADER
        ================================= */}

        <div className="dashboard-heading">

          <div>

            <span className="eyebrow">
              RECRUITER DASHBOARD
            </span>

            <h1>
              Welcome back,{" "}
              {user?.name?.split(" ")[0]} 👋
            </h1>

            <p>
              Manage your job postings and find great talent.
            </p>

          </div>


          <div className="dashboard-header-actions">

            {/* APPLICANTS BUTTON */}

            <button
              className="applicants-btn"
              onClick={() =>
                navigate("/recruiter/applicants")
              }
            >
              View Applicants
            </button>


            {/* POST JOB BUTTON */}

            <button
              className="post-job-btn"
              onClick={() => {

                setEditingJob(null);

                setTitle("");
                setCompany("");
                setDescription("");
                setSkills("");
                setLocation("");
                setSalary("");

                setMessage("");
                setError("");

                setShowForm(!showForm);

              }}
            >

              {showForm
                ? "Close Form"
                : "+ Post New Job"}

            </button>

          </div>

        </div>


        {/* =================================
            MESSAGES
        ================================= */}

        {message && (

          <div className="success-message">
            {message}
          </div>

        )}


        {error && (

          <div className="error-message">
            {error}
          </div>

        )}


        {/* =================================
            STATISTICS
        ================================= */}

        <div className="stats">


          <div className="stat-card">

            <span>
              Total Jobs
            </span>

            <strong>
              {jobs.length}
            </strong>

          </div>


          <div className="stat-card">

            <span>
              Active Jobs
            </span>

            <strong>
              {jobs.length}
            </strong>

          </div>


          <div className="stat-card">

            <span>
              Applications
            </span>

            <strong>
              {applications.length}
            </strong>

          </div>


        </div>


        {/* =================================
            CREATE / EDIT FORM
        ================================= */}

        {showForm && (

          <div className="job-form-card">

            <h2>

              {editingJob
                ? "Edit Job"
                : "Create a new job"}

            </h2>


            <p>

              {editingJob
                ? "Update the details of your job posting."
                : "Add details about the position you're hiring for."}

            </p>


            <form onSubmit={handleSubmitJob}>


              {/* JOB TITLE + COMPANY */}

              <div className="form-row">


                <div className="form-group">

                  <label>
                    Job title
                  </label>

                  <input
                    value={title}
                    onChange={(e) =>
                      setTitle(e.target.value)
                    }
                    placeholder="e.g. Python Developer"
                    required
                  />

                </div>


                <div className="form-group">

                  <label>
                    Company
                  </label>

                  <input
                    value={company}
                    onChange={(e) =>
                      setCompany(e.target.value)
                    }
                    placeholder="Company name"
                    required
                  />

                </div>

              </div>


              {/* DESCRIPTION */}

              <div className="form-group">

                <label>
                  Job description
                </label>

                <textarea
                  value={description}
                  onChange={(e) =>
                    setDescription(e.target.value)
                  }
                  placeholder="Describe the role..."
                  rows="5"
                  required
                />

              </div>


              {/* SKILLS */}

              <div className="form-group">

                <label>
                  Skills
                </label>

                <input
                  value={skills}
                  onChange={(e) =>
                    setSkills(e.target.value)
                  }
                  placeholder="Python, Flask, MongoDB, React"
                />

                <small>
                  Separate skills using commas.
                </small>

              </div>


              {/* LOCATION + SALARY */}

              <div className="form-row">


                <div className="form-group">

                  <label>
                    Location
                  </label>

                  <input
                    value={location}
                    onChange={(e) =>
                      setLocation(e.target.value)
                    }
                    placeholder="Chennai / Remote"
                  />

                </div>


                <div className="form-group">

                  <label>
                    Salary
                  </label>

                  <input
                    value={salary}
                    onChange={(e) =>
                      setSalary(e.target.value)
                    }
                    placeholder="₹6 - ₹8 LPA"
                  />

                </div>

              </div>


              {/* FORM BUTTONS */}

              <div className="form-actions">


                <button
                  type="button"
                  className="cancel-btn"
                  onClick={handleCancelForm}
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className="primary-btn"
                >

                  {editingJob
                    ? "Update Job"
                    : "Publish Job"}

                </button>


              </div>

            </form>

          </div>

        )}


        {/* =================================
            JOB LIST
        ================================= */}

        <div className="jobs-section">


          <div className="section-header">

            <div>

              <h2>
                Your job postings
              </h2>

              <p>
                Jobs you've published on HireAI.
              </p>

            </div>

          </div>


          {/* NO JOBS */}

          {jobs.length === 0 ? (

            <div className="empty-state">

              <div className="empty-icon">
                +
              </div>

              <h3>
                No jobs posted yet
              </h3>

              <p>
                Create your first job posting to start
                finding candidates.
              </p>

              <button
                className="post-job-btn"
                onClick={() => {

                  setEditingJob(null);

                  setTitle("");
                  setCompany("");
                  setDescription("");
                  setSkills("");
                  setLocation("");
                  setSalary("");

                  setShowForm(true);

                }}
              >
                Post your first job
              </button>

            </div>

          ) : (

            /* JOB LIST */

            <div className="job-list">

              {jobs.map((job) => (

                <div
                  className="recruiter-job-card"
                  key={job._id}
                >


                  {/* JOB HEADER */}

                  <div className="job-main">


                    <div className="job-icon">

                      {job.company
                        ?.charAt(0)
                        ?.toUpperCase()}

                    </div>


                    <div>

                      <h3>
                        {job.title}
                      </h3>

                      <p className="company">
                        {job.company}
                      </p>


                      <div className="job-meta">

                        <span>
                          📍{" "}
                          {job.location || "Remote"}
                        </span>

                        <span>
                          💰{" "}
                          {job.salary || "Not specified"}
                        </span>

                      </div>

                    </div>

                  </div>


                  {/* SKILLS */}

                  <div className="job-skills">

                    {Array.isArray(job.skills) &&

                      job.skills.map(
                        (skill, index) => (

                          <span key={index}>
                            {skill}
                          </span>

                        )
                      )

                    }

                  </div>


                  {/* DESCRIPTION */}

                  <p className="job-description">

                    {job.description}

                  </p>


                  {/* ACTION BUTTONS */}

                  <div className="job-actions">


                    <button
                      className="edit-btn"
                      onClick={() =>
                        handleEditClick(job)
                      }
                    >
                      Edit
                    </button>


                    <button
                      className="delete-btn"
                      onClick={() =>
                        handleDelete(job._id)
                      }
                    >
                      Delete
                    </button>


                  </div>

                </div>

              ))}

            </div>

          )}

        </div>


      </main>

    </div>

  );

}

export default RecruiterDashboard;