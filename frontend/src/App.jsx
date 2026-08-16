import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CandidateDashboard from "./pages/CandidateDashboard";
import RecruiterDashboard from "./pages/RecruiterDashboard";

import RecruiterApplicants
  from "./pages/RecruiterApplicants";

import ApplicantAnalysis
  from "./pages/ApplicantAnalysis";
function App() {

  return (

    <BrowserRouter>

      <Routes>

        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/candidate"
          element={<CandidateDashboard />}
        />

        <Route
          path="/recruiter"
          element={<RecruiterDashboard />}
        />
    

        <Route
          path="/recruiter/applicants"
          element={<RecruiterApplicants />}
        />

        <Route
          path="/recruiter/applications/:applicationId/analyze"
          element={<ApplicantAnalysis />}
        />

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />

        

      </Routes>

    </BrowserRouter>
  );
}

export default App;