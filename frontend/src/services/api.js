import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});


// =====================================================
// AXIOS REQUEST INTERCEPTOR
// =====================================================

API.interceptors.request.use(

  (config) => {

    // Get JWT token
    const token = localStorage.getItem("token");


    // Add token to request
    if (token) {

      config.headers.Authorization =
        `Bearer ${token}`;

    }


    // =================================================
    // IMPORTANT FOR RESUME UPLOAD
    // =================================================
    //
    // When FormData is being sent, DON'T manually
    // set Content-Type.
    //
    // Browser will automatically create:
    //
    // multipart/form-data;
    // boundary=-------------------------
    //
    // Flask needs that boundary to read request.files.
    // =================================================

    if (config.data instanceof FormData) {

      delete config.headers["Content-Type"];

    }


    return config;

  },

  (error) => {

    return Promise.reject(error);

  }

);


export default API;