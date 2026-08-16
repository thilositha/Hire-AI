import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/api";

function ApplicantAnalysis() {

  const { applicationId } = useParams();

  const navigate = useNavigate();

  // =====================================================
  // ANALYSIS DATA
  // =====================================================

  const [data, setData] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");


  // =====================================================
  // CHATBOT
  // =====================================================

  const [question, setQuestion] = useState("");

  const [chatAnswer, setChatAnswer] = useState("");

  const [chatLoading, setChatLoading] = useState(false);


  // =====================================================
  // RESUME
  // =====================================================

  const [resumeLoading, setResumeLoading] = useState(false);


  // =====================================================
  // LOAD AI ANALYSIS
  // =====================================================

  useEffect(() => {

    loadAnalysis();

  }, [applicationId]);


  const loadAnalysis = async () => {

    try {

      setLoading(true);

      setError("");

      const response = await API.get(
        `/recruiter/applications/${applicationId}/analyze`
      );

      setData(
        response.data
      );

    } catch (error) {

      console.error(
        "Analysis error:",
        error
      );

      setError(
        error.response?.data?.message ||
        "Failed to analyze candidate"
      );

    } finally {

      setLoading(false);

    }

  };


  // =====================================================
  // VIEW RESUME
  // =====================================================

  const handleViewResume = async () => {

    try {

      setResumeLoading(true);

      const response = await API.get(
        `/recruiter/applications/${applicationId}/resume`,
        {
          responseType: "blob"
        }
      );

      const fileURL =
        window.URL.createObjectURL(
          new Blob(
            [response.data],
            {
              type: "application/pdf"
            }
          )
        );

      window.open(
        fileURL,
        "_blank"
      );

    } catch (error) {

      console.error(
        "Resume error:",
        error
      );

      setError(
        error.response?.data?.message ||
        "Unable to open resume"
      );

    } finally {

      setResumeLoading(false);

    }

  };


  // =====================================================
  // CHAT WITH HIREAI
  // =====================================================

  const handleChat = async (e) => {

    e.preventDefault();

    if (!question.trim()) {

      return;

    }

    try {

      setChatLoading(true);

      setChatAnswer("");

      const response = await API.post(
        `/recruiter/applications/${applicationId}/chat`,
        {
          question: question.trim()
        }
      );

      setChatAnswer(
        response.data.answer
      );

    } catch (error) {

      console.error(
        "Chat error:",
        error
      );

      setChatAnswer(
        error.response?.data?.message ||
        "HireAI could not answer your question."
      );

    } finally {

      setChatLoading(false);

    }

  };


  // =====================================================
  // QUICK QUESTIONS
  // =====================================================

  const askQuickQuestion = (text) => {

    setQuestion(text);

  };


  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {

    return (

      <div className="dashboard">

        <main className="dashboard-content">

          <div className="loading">

            🤖 HireAI is analyzing the candidate's resume...

          </div>

        </main>

      </div>

    );

  }


  // =====================================================
  // ERROR
  // =====================================================

  if (error && !data) {

    return (

      <div className="dashboard">

        <main className="dashboard-content">

          <div className="error-message">

            {error}

          </div>

          <button
            className="post-job-btn"
            onClick={() =>
              navigate("/recruiter/applicants")
            }
          >
            ← Back to Applicants
          </button>

        </main>

      </div>

    );

  }


  // =====================================================
  // MAIN UI
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


        <button
          onClick={() =>
            navigate("/recruiter/applicants")
          }
        >
          ← Back to Applicants
        </button>

      </nav>



      {/* =================================================
          CONTENT
      ================================================= */}

      <main className="dashboard-content">


        {/* =================================================
            HEADER
        ================================================= */}

        <span className="eyebrow">
          AI CANDIDATE ANALYSIS
        </span>


        <h1>
          {data?.candidate?.name}
        </h1>


        <p>
          {data?.candidate?.email}
        </p>


        {/* =================================================
            ERROR
        ================================================= */}

        {error && (

          <div className="error-message">
            {error}
          </div>

        )}



        {/* =================================================
            JOB CARD
        ================================================= */}

        <div className="analysis-job-card">

          <div>

            <span className="eyebrow">
              APPLIED POSITION
            </span>

            <h2>
              {data?.job?.title}
            </h2>

            <p>
              {data?.job?.company}
            </p>

          </div>


          {/* RESUME BUTTON */}

          <button
            className="view-resume-btn"
            onClick={handleViewResume}
            disabled={resumeLoading}
          >

            {resumeLoading
              ? "Opening Resume..."
              : "📄 View Resume"}

          </button>

        </div>



        {/* =================================================
            RESUME INFORMATION
        ================================================= */}

        {data?.resume && (

          <div className="resume-info-card">

            <div className="resume-icon">
              📄
            </div>

            <div>

              <strong>
                Candidate Resume
              </strong>

              <p>
                {data.resume.filename}
              </p>

            </div>

          </div>

        )}



        {/* =================================================
            MATCH SCORE
        ================================================= */}

        <div className="match-card">

          <div className="match-header">

            <span>
              AI Match Score
            </span>

            <strong>
              {data?.match_score}%
            </strong>

          </div>


          <div className="score-bar">

            <div
              className="score-fill"
              style={{
                width:
                  `${data?.match_score || 0}%`
              }}
            />

          </div>


          <p>

            Based on the candidate's resume
            and the required skills for this job.

          </p>

        </div>



        {/* =================================================
            SKILLS
        ================================================= */}

        <div className="analysis-grid">


          {/* MATCHING */}

          <div className="skill-card">

            <h2>
              ✓ Matching Skills
            </h2>


            {data?.matching_skills?.length === 0 ? (

              <p>
                No required skills matched.
              </p>

            ) : (

              <div className="skill-list">

                {data.matching_skills.map(
                  (skill, index) => (

                    <span key={index}>
                      ✓ {skill}
                    </span>

                  )
                )}

              </div>

            )}

          </div>



          {/* MISSING */}

          <div className="skill-card missing">

            <h2>
              ⚠ Missing Skills
            </h2>


            {data?.missing_skills?.length === 0 ? (

              <p>
                No required skills are missing.
              </p>

            ) : (

              <div className="skill-list">

                {data.missing_skills.map(
                  (skill, index) => (

                    <span key={index}>
                      ⚠ {skill}
                    </span>

                  )
                )}

              </div>

            )}

          </div>


        </div>



        {/* =================================================
            AI ANALYSIS
        ================================================= */}

        <div className="ai-analysis-card">


          <div className="ai-title">

            <div className="ai-icon">
              🤖
            </div>

            <div>

              <h2>
                HireAI Recruiter Assistant
              </h2>

              <p>
                AI-powered resume evaluation
              </p>

            </div>

          </div>


          <div className="ai-response">

            {data?.ai_analysis}

          </div>


        </div>



        {/* =================================================
            CHATBOT
        ================================================= */}

        <div className="chatbot-card">


          {/* CHATBOT HEADER */}

          <div className="chatbot-header">

            <div className="chatbot-icon">
              🤖
            </div>

            <div>

              <h2>
                Ask HireAI
              </h2>

              <p>
                Ask questions about this candidate
                and their match for the job.
              </p>

            </div>

          </div>



          {/* QUICK QUESTIONS */}

          <div className="quick-questions">

            <button
              onClick={() =>
                askQuickQuestion(
                  "Does this candidate match the job description?"
                )
              }
            >
              Does this candidate match the job?
            </button>


            <button
              onClick={() =>
                askQuickQuestion(
                  "What are the most important missing skills in this candidate's resume?"
                )
              }
            >
              What skills are missing?
            </button>


            <button
              onClick={() =>
                askQuickQuestion(
                  "What are the strongest skills mentioned in the candidate's resume?"
                )
              }
            >
              What are the candidate's strengths?
            </button>


            <button
              onClick={() =>
                askQuickQuestion(
                  "What interview questions should I ask this candidate?"
                )
              }
            >
              Suggest interview questions
            </button>

          </div>



          {/* CHAT ANSWER */}

          {chatAnswer && (

            <div className="chat-answer">

              <div className="chat-answer-icon">
                🤖
              </div>

              <div>

                <strong>
                  HireAI
                </strong>

                <p>
                  {chatAnswer}
                </p>

              </div>

            </div>

          )}



          {/* CHAT FORM */}

          <form
            className="chat-form"
            onSubmit={handleChat}
          >

            <input
              type="text"
              value={question}
              onChange={(e) =>
                setQuestion(e.target.value)
              }
              placeholder="Ask HireAI about this candidate..."
              disabled={chatLoading}
            />


            <button
              type="submit"
              disabled={
                chatLoading ||
                !question.trim()
              }
            >

              {chatLoading
                ? "Thinking..."
                : "Ask AI →"}

            </button>

          </form>


        </div>



        {/* =================================================
            BACK BUTTON
        ================================================= */}

        <button
          className="back-btn"
          onClick={() =>
            navigate("/recruiter/applicants")
          }
        >
          ← Back to Applicants
        </button>


      </main>

    </div>

  );

}

export default ApplicantAnalysis;