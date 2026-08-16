import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

function CandidateDashboard() {

  const navigate = useNavigate();

  // =====================================================
  // USER
  // =====================================================

  const [user, setUser] = useState(null);

  // =====================================================
  // JOBS
  // =====================================================

  const [jobs, setJobs] = useState([]);

  // =====================================================
  // APPLICATIONS
  // =====================================================

  const [applications, setApplications] = useState([]);

  // =====================================================
  // LOADING
  // =====================================================

  const [loading, setLoading] = useState(true);

  const [applying, setApplying] = useState(null);

  // =====================================================
  // MESSAGES
  // =====================================================

  const [message, setMessage] = useState("");

  const [error, setError] = useState("");

  // =====================================================
  // RESUME
  // =====================================================

  const [resumeInfo, setResumeInfo] = useState(null);

  const [uploadingResume, setUploadingResume] =
    useState(false);


  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {

    const storedUser =
      localStorage.getItem("user");

    if (!storedUser) {

      navigate("/login");

      return;
    }

    const parsedUser =
      JSON.parse(storedUser);

    if (parsedUser.role !== "candidate") {

      navigate("/recruiter");

      return;
    }

    setUser(parsedUser);

    loadData();

    loadResume();

  }, [navigate]);


  // =====================================================
  // LOAD JOBS + APPLICATIONS
  // =====================================================

  const loadData = async () => {

    try {

      const [
        jobsResponse,
        applicationsResponse
      ] = await Promise.all([

        API.get("/jobs"),

        API.get(
          "/candidate/applications"
        )

      ]);


      setJobs(
        jobsResponse.data
      );

      setApplications(
        applicationsResponse.data
      );

    } catch (error) {

      console.error(error);

      setError(
        error.response?.data?.message ||
        "Failed to load data"
      );

    } finally {

      setLoading(false);

    }

  };


  // =====================================================
  // LOAD RESUME
  // =====================================================

  const loadResume = async () => {

    try {

      const response =
        await API.get(
          "/candidate/resume"
        );


      if (response.data.uploaded) {

        setResumeInfo({

          filename:
            response.data.filename,

          uploaded_at:
            response.data.uploaded_at

        });

      } else {

        setResumeInfo(null);

      }

    } catch (error) {

      console.error(
        "Failed to load resume:",
        error
      );

    }

  };


  // =====================================================
  // RESUME UPLOAD
  // =====================================================

 const handleResumeUpload = async (e) => {

  const file = e.target.files[0];

  console.log("Selected file:", file);


  if (!file) {

    setError("Please select a resume");

    return;

  }


  // =====================================================
  // CHECK FILE TYPE
  // =====================================================

  if (
    file.type !== "application/pdf"
  ) {

    setError(
      "Please upload a PDF resume."
    );

    setMessage("");

    return;

  }


  // =====================================================
  // CHECK FILE SIZE
  // =====================================================

  if (
    file.size > 5 * 1024 * 1024
  ) {

    setError(
      "Resume must be smaller than 5 MB."
    );

    setMessage("");

    return;

  }


  setUploadingResume(true);

  setError("");

  setMessage("");


  try {

    // ===================================================
    // CREATE FORMDATA
    // ===================================================

    const formData =
      new FormData();


    formData.append(
      "resume",
      file
    );


    // Debugging

    console.log(
      "FormData file:",
      formData.get("resume")
    );


    // ===================================================
    // SEND TO FLASK
    // ===================================================

    const response =
      await API.post(
        "/candidate/resume",
        formData
      );


    console.log(
      "Upload response:",
      response.data
    );


    // ===================================================
    // SUCCESS
    // ===================================================

    setMessage(
      response.data.message ||
      "Resume uploaded successfully!"
    );


    setResumeInfo({

      filename:
        response.data.filename

    });


  } catch (error) {

    console.error(
      "Resume upload error:",
      error
    );


    console.error(
      "Backend response:",
      error.response?.data
    );


    setError(
      error.response?.data?.message ||
      "Resume upload failed."
    );


  } finally {

    setUploadingResume(false);

    // Allow selecting the same PDF again

    e.target.value = "";

  }

};


  // =====================================================
  // CHECK IF ALREADY APPLIED
  // =====================================================

  const hasApplied = (jobId) => {

    return applications.some(
      (application) =>
        application.job_id === jobId
    );

  };


  // =====================================================
  // APPLY FOR JOB
  // =====================================================

  const handleApply = async (jobId) => {

    setApplying(jobId);

    setMessage("");

    setError("");


    // ---------------------------------------------
    // Require resume before applying
    // ---------------------------------------------

    if (!resumeInfo) {

      setError(
        "Please upload your resume before applying."
      );

      setApplying(null);

      // Scroll to resume section

      document
        .getElementById("resume-section")
        ?.scrollIntoView({
          behavior: "smooth"
        });

      return;

    }


    try {

      const response =
        await API.post(
          `/jobs/${jobId}/apply`
        );


      setMessage(
        response.data.message
      );


      // Refresh applications

      const responseApplications =
        await API.get(
          "/candidate/applications"
        );


      setApplications(
        responseApplications.data
      );


    } catch (error) {

      setError(
        error.response?.data?.message ||
        "Failed to apply for this job"
      );

    } finally {

      setApplying(null);

    }

  };


  // =====================================================
  // LOGOUT
  // =====================================================

  const logout = () => {

    localStorage.removeItem(
      "token"
    );

    localStorage.removeItem(
      "user"
    );

    navigate("/login");

  };


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

          <span>
            {user?.name}
          </span>


          <button
            onClick={logout}
          >
            Logout
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
              CANDIDATE
            </span>


            <h1>
              Find your next opportunity.
            </h1>


            <p>
              Explore jobs that match your
              skills and interests.
            </p>

          </div>


        </div>



        {/* =================================================
            MESSAGES
        ================================================= */}

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



        {/* =================================================
            APPLICATION COUNT
        ================================================= */}

        <div className="stats">


          <div className="stat-card">

            <span>
              Available Jobs
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


          <div className="stat-card">

            <span>
              Resume
            </span>

            <strong>
              {resumeInfo ? "✓" : "!"}
            </strong>

          </div>


        </div>



        {/* =================================================
            RESUME
        ================================================= */}

        <section
          className="resume-card"
          id="resume-section"
        >


          <div className="resume-header">


            <div>

              <span className="eyebrow">
                YOUR RESUME
              </span>


              <h2>
                Resume
              </h2>


              <p>
                Upload your resume so recruiters
                can evaluate your application.
              </p>

            </div>


          </div>



          <div className="resume-upload-area">


            {/* ---------------------------------------------
                RESUME ALREADY UPLOADED
            --------------------------------------------- */}

            {resumeInfo ? (

              <div className="resume-file">


                <div className="resume-icon">
                  📄
                </div>


                <div>

                  <strong>
                    {resumeInfo.filename}
                  </strong>


                  <p>
                    ✓ Resume uploaded successfully
                  </p>

                </div>


              </div>


            ) : (


              /* ---------------------------------------------
                 NO RESUME
              --------------------------------------------- */

              <div className="resume-file">


                <div className="resume-icon">
                  📄
                </div>


                <div>

                  <strong>
                    No resume uploaded
                  </strong>


                  <p>
                    Upload a PDF resume before applying.
                  </p>

                </div>


              </div>

            )}



            {/* ---------------------------------------------
                UPLOAD BUTTON
            --------------------------------------------- */}

            <label className="upload-btn">


              {uploadingResume

                ? "Uploading..."

                : resumeInfo

                ? "Replace Resume"

                : "Upload Resume"

              }


              <input

                type="file"

                accept=".pdf,application/pdf"

                onChange={
                  handleResumeUpload
                }

                hidden

                disabled={
                  uploadingResume
                }

              />


            </label>


          </div>


        </section>



        {/* =================================================
            JOBS
        ================================================= */}

        <h2 className="section-title">
          Available jobs
        </h2>



        {loading ? (

          <div className="loading">

            Loading jobs...

          </div>


        ) : jobs.length === 0 ? (


          <div className="empty-state">


            <div className="empty-icon">
              ◈
            </div>


            <h3>
              No jobs available
            </h3>


            <p>
              Recruiters haven't posted
              any jobs yet.
            </p>


          </div>


        ) : (


          <div className="job-grid">


            {jobs.map((job) => {


              const alreadyApplied =
                hasApplied(job._id);


              return (


                <div
                  className="job-card"
                  key={job._id}
                >


                  {/* COMPANY ICON */}

                  <div className="job-icon">

                    {job.company
                      ?.charAt(0)
                      ?.toUpperCase()}

                  </div>



                  {/* JOB TITLE */}

                  <h3>
                    {job.title}
                  </h3>



                  {/* COMPANY */}

                  <p className="company">
                    {job.company}
                  </p>



                  {/* LOCATION */}

                  <p>
                    📍{" "}
                    {job.location ||
                      "Remote"}
                  </p>



                  {/* SALARY */}

                  <p>
                    💰{" "}
                    {job.salary ||
                      "Salary not specified"}
                  </p>



                  {/* SKILLS */}

                  <div className="skills">


                    {Array.isArray(
                      job.skills
                    ) &&

                      job.skills.map(
                        (skill, index) => (

                          <span
                            key={index}
                          >
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



                  {/* APPLY */}

                  <button

                    className={
                      alreadyApplied
                        ? "applied-btn"
                        : "job-button"
                    }

                    disabled={
                      alreadyApplied ||
                      applying === job._id
                    }

                    onClick={() =>
                      handleApply(
                        job._id
                      )
                    }

                  >

                    {alreadyApplied

                      ? "✓ Applied"

                      : applying === job._id

                      ? "Applying..."

                      : "Apply Now →"

                    }

                  </button>


                </div>

              );

            })}


          </div>

        )}



        {/* =================================================
            MY APPLICATIONS
        ================================================= */}

        <section className="applications-section">


          <h2 className="section-title">
            My Applications
          </h2>



          {applications.length === 0 ? (


            <div className="empty-state">

              <p>
                You haven't applied for
                any jobs yet.
              </p>

            </div>


          ) : (


            <div className="application-list">


              {applications.map(
                (application) => (


                  <div
                    className="application-card"
                    key={
                      application._id
                    }
                  >


                    <div>


                      <h3>
                        {application.job_title}
                      </h3>


                      <p>
                        {application.company}
                      </p>


                      <small>
                        Applied as{" "}
                        {application.candidate_email}
                      </small>


                    </div>


                    <span className="status-badge">

                      {application.status}

                    </span>


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

export default CandidateDashboard;