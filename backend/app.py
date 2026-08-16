from flask import Flask, request, jsonify, send_file
from flask_pymongo import PyMongo
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    jwt_required,
    get_jwt_identity
)
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
from bson import ObjectId
from pypdf import PdfReader

import ollama
import os
from datetime import datetime


# =========================================================
# LOAD ENVIRONMENT VARIABLES
# =========================================================

load_dotenv()


# =========================================================
# FLASK APP
# =========================================================

app = Flask(__name__)


# =========================================================
# CONFIGURATION
# =========================================================

app.config["MONGO_URI"] = os.getenv("MONGO_URI")
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")

mongo = PyMongo(app)
jwt = JWTManager(app)

CORS(app)


# =========================================================
# RESUME UPLOAD CONFIGURATION
# =========================================================

UPLOAD_FOLDER = os.path.join(
    os.path.dirname(__file__),
    "uploads"
)

os.makedirs(
    UPLOAD_FOLDER,
    exist_ok=True
)

ALLOWED_EXTENSIONS = {
    "pdf"
}

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER


# =========================================================
# OLLAMA LOCAL AI
# =========================================================

OLLAMA_MODEL = os.getenv(
    "OLLAMA_MODEL",
    "llama3.2"
)


# =========================================================
# HOME
# =========================================================

@app.route("/")
def home():

    return jsonify({
        "message": "HireAI API is running"
    })


# =========================================================
# REGISTER
# =========================================================

@app.route("/api/auth/register", methods=["POST"])
def register():

    try:

        data = request.get_json()

        name = data.get("name")
        email = data.get("email")
        password = data.get("password")
        role = data.get("role", "candidate")

        if not name or not email or not password:

            return jsonify({
                "message":
                    "Name, email and password are required"
            }), 400

        if role not in ["candidate", "recruiter"]:

            return jsonify({
                "message":
                    "Invalid role"
            }), 400

        email = email.lower().strip()

        existing_user = mongo.db.users.find_one({
            "email": email
        })

        if existing_user:

            return jsonify({
                "message":
                    "Email already registered"
            }), 409

        hashed_password = generate_password_hash(
            password
        )

        user = {

            "name":
                name,

            "email":
                email,

            "password":
                hashed_password,

            "role":
                role

        }

        result = mongo.db.users.insert_one(user)

        return jsonify({

            "message":
                "Registration successful",

            "user_id":
                str(result.inserted_id)

        }), 201

    except Exception as e:

        return jsonify({
            "message":
                str(e)
        }), 500


# =========================================================
# LOGIN
# =========================================================

@app.route("/api/auth/login", methods=["POST"])
def login():

    try:

        data = request.get_json()

        email = data.get("email")
        password = data.get("password")

        if not email or not password:

            return jsonify({
                "message":
                    "Email and password are required"
            }), 400

        email = email.lower().strip()

        user = mongo.db.users.find_one({
            "email": email
        })

        if not user:

            return jsonify({
                "message":
                    "Invalid email or password"
            }), 401

        if not check_password_hash(
            user["password"],
            password
        ):

            return jsonify({
                "message":
                    "Invalid email or password"
            }), 401

        token = create_access_token(
            identity=str(user["_id"])
        )

        return jsonify({

            "message":
                "Login successful",

            "access_token":
                token,

            "user": {

                "id":
                    str(user["_id"]),

                "name":
                    user["name"],

                "email":
                    user["email"],

                "role":
                    user["role"]

            }

        }), 200

    except Exception as e:

        return jsonify({
            "message":
                str(e)
        }), 500


# =========================================================
# PROFILE
# =========================================================

@app.route("/api/profile", methods=["GET"])
@jwt_required()
def profile():

    try:

        user_id = get_jwt_identity()

        user = mongo.db.users.find_one({

            "_id":
                ObjectId(user_id)

        })

        if not user:

            return jsonify({
                "message":
                    "User not found"
            }), 404

        return jsonify({

            "id":
                str(user["_id"]),

            "name":
                user["name"],

            "email":
                user["email"],

            "role":
                user["role"]

        }), 200

    except Exception:

        return jsonify({
            "message":
                "Invalid user"
        }), 400


# =========================================================
# UPLOAD RESUME
# =========================================================

@app.route(
    "/api/candidate/resume",
    methods=["POST"]
)
@jwt_required()
def upload_resume():

    try:

        current_user = get_jwt_identity()

        # -----------------------------------------
        # Check candidate
        # -----------------------------------------

        candidate = mongo.db.users.find_one({

            "_id":
                ObjectId(current_user)

        })

        if not candidate:

            return jsonify({
                "message":
                    "User not found"
            }), 404

        if candidate["role"] != "candidate":

            return jsonify({
                "message":
                    "Only candidates can upload resumes"
            }), 403

        # -----------------------------------------
        # Check file
        # -----------------------------------------

        print(
            "FILES RECEIVED:",
            request.files
        )

        if "resume" not in request.files:

            return jsonify({
                "message":
                    "Please select a resume"
            }), 400

        file = request.files["resume"]

        if file.filename == "":

            return jsonify({
                "message":
                    "Please select a resume"
            }), 400

        # -----------------------------------------
        # Only PDF
        # -----------------------------------------

        if not file.filename.lower().endswith(".pdf"):

            return jsonify({
                "message":
                    "Only PDF resumes are allowed"
            }), 400

        # -----------------------------------------
        # Secure filename
        # -----------------------------------------

        filename = secure_filename(
            file.filename
        )

        filename = (
            current_user + "_" + filename
        )

        filepath = os.path.join(

            app.config["UPLOAD_FOLDER"],

            filename

        )

        # -----------------------------------------
        # Save PDF
        # -----------------------------------------

        file.save(filepath)

        # -----------------------------------------
        # Extract PDF text
        # -----------------------------------------

        reader = PdfReader(filepath)

        resume_text = ""

        for page in reader.pages:

            text = page.extract_text()

            if text:

                resume_text += text + "\n"

        if not resume_text.strip():

            return jsonify({

                "message":
                    "Could not extract text from this PDF"

            }), 400

        # -----------------------------------------
        # Store resume in MongoDB
        # -----------------------------------------

        mongo.db.users.update_one(

            {
                "_id":
                    ObjectId(current_user)
            },

            {
                "$set": {

                    "resume": {

                        "filename":
                            file.filename,

                        "stored_filename":
                            filename,

                        "resume_text":
                            resume_text,

                        "uploaded_at":
                            datetime.utcnow()

                    }

                }

            }

        )

        return jsonify({

            "message":
                "Resume uploaded successfully",

            "filename":
                file.filename

        }), 200

    except Exception as e:

        return jsonify({

            "message":
                str(e)

        }), 500


# =========================================================
# GET MY RESUME
# =========================================================

@app.route(
    "/api/candidate/resume",
    methods=["GET"]
)
@jwt_required()
def get_my_resume():

    try:

        current_user = get_jwt_identity()

        candidate = mongo.db.users.find_one({

            "_id":
                ObjectId(current_user)

        })

        if not candidate:

            return jsonify({
                "message":
                    "User not found"
            }), 404

        resume = candidate.get("resume")

        if not resume:

            return jsonify({
                "uploaded":
                    False
            }), 200

        return jsonify({

            "uploaded":
                True,

            "filename":
                resume.get("filename"),

            "uploaded_at":
                resume.get("uploaded_at")

        }), 200

    except Exception as e:

        return jsonify({

            "message":
                str(e)

        }), 500


# =========================================================
# RECRUITER VIEW CANDIDATE RESUME
# =========================================================

@app.route(
    "/api/recruiter/applications/<application_id>/resume",
    methods=["GET"]
)
@jwt_required()
def recruiter_view_resume(application_id):

    try:

        current_user = get_jwt_identity()

        # -----------------------------------------
        # Get application
        # -----------------------------------------

        application = mongo.db.applications.find_one({

            "_id":
                ObjectId(application_id)

        })

        if not application:

            return jsonify({

                "message":
                    "Application not found"

            }), 404

        # -----------------------------------------
        # Get job
        # -----------------------------------------

        job = mongo.db.jobs.find_one({

            "_id":
                ObjectId(application["job_id"])

        })

        if not job:

            return jsonify({

                "message":
                    "Job not found"

            }), 404

        # -----------------------------------------
        # Security
        # -----------------------------------------

        if job["created_by"] != current_user:

            return jsonify({

                "message":
                    "You cannot view this candidate's resume"

            }), 403

        # -----------------------------------------
        # Get candidate
        # -----------------------------------------

        candidate = mongo.db.users.find_one({

            "_id":
                ObjectId(
                    application["candidate_id"]
                )

        })

        if not candidate:

            return jsonify({

                "message":
                    "Candidate not found"

            }), 404

        # -----------------------------------------
        # Get resume
        # -----------------------------------------

        resume = candidate.get("resume")

        if not resume:

            return jsonify({

                "message":
                    "Candidate has not uploaded a resume"

            }), 404

        stored_filename = resume.get(
            "stored_filename"
        )

        if not stored_filename:

            return jsonify({

                "message":
                    "Resume file not found"

            }), 404

        # -----------------------------------------
        # File path
        # -----------------------------------------

        filepath = os.path.join(

            app.config["UPLOAD_FOLDER"],

            stored_filename

        )

        if not os.path.exists(filepath):

            return jsonify({

                "message":
                    "Resume file does not exist"

            }), 404

        # -----------------------------------------
        # Send PDF
        # -----------------------------------------

        return send_file(

            filepath,

            mimetype="application/pdf",

            as_attachment=False,

            download_name=resume.get(

                "filename",

                stored_filename

            )

        )

    except Exception as e:

        return jsonify({

            "message":
                str(e)

        }), 500


# =========================================================
# CREATE JOB
# =========================================================

@app.route(
    "/api/jobs",
    methods=["POST"]
)
@jwt_required()
def create_job():

    try:

        current_user = get_jwt_identity()

        user = mongo.db.users.find_one({

            "_id":
                ObjectId(current_user)

        })

        if not user:

            return jsonify({

                "message":
                    "User not found"

            }), 404

        if user["role"] != "recruiter":

            return jsonify({

                "message":
                    "Only recruiters can create jobs"

            }), 403

        data = request.get_json()

        title = data.get("title")
        company = data.get("company")
        description = data.get("description")
        skills = data.get("skills", [])
        location = data.get("location")
        salary = data.get("salary")

        if not title or not company or not description:

            return jsonify({

                "message":
                    "Title, company and description are required"

            }), 400

        job = {

            "title":
                title,

            "company":
                company,

            "description":
                description,

            "skills":
                skills,

            "location":
                location,

            "salary":
                salary,

            "created_by":
                current_user

        }

        result = mongo.db.jobs.insert_one(job)

        return jsonify({

            "message":
                "Job created successfully",

            "job_id":
                str(result.inserted_id)

        }), 201

    except Exception as e:

        return jsonify({

            "message":
                str(e)

        }), 500


# =========================================================
# GET ALL JOBS
# =========================================================

@app.route(
    "/api/jobs",
    methods=["GET"]
)
def get_jobs():

    try:

        jobs = list(

            mongo.db.jobs.find().sort(
                "_id",
                -1
            )

        )

        for job in jobs:

            job["_id"] = str(
                job["_id"]
            )

            job["created_by"] = str(
                job["created_by"]
            )

        return jsonify(jobs), 200

    except Exception as e:

        return jsonify({

            "message":
                str(e)

        }), 500


# =========================================================
# GET RECRUITER JOBS
# =========================================================

@app.route(
    "/api/recruiter/jobs",
    methods=["GET"]
)
@jwt_required()
def recruiter_jobs():

    try:

        current_user = get_jwt_identity()

        jobs = list(

            mongo.db.jobs.find({

                "created_by":
                    current_user

            }).sort(
                "_id",
                -1
            )

        )

        for job in jobs:

            job["_id"] = str(
                job["_id"]
            )

            job["created_by"] = str(
                job["created_by"]
            )

        return jsonify(jobs), 200

    except Exception as e:

        return jsonify({

            "message":
                str(e)

        }), 500


# =========================================================
# EDIT JOB
# =========================================================

@app.route(
    "/api/jobs/<job_id>",
    methods=["PUT"]
)
@jwt_required()
def edit_job(job_id):

    try:

        current_user = get_jwt_identity()

        job = mongo.db.jobs.find_one({

            "_id":
                ObjectId(job_id)

        })

        if not job:

            return jsonify({

                "message":
                    "Job not found"

            }), 404

        if job["created_by"] != current_user:

            return jsonify({

                "message":
                    "You can only edit your own jobs"

            }), 403

        data = request.get_json()

        title = data.get("title")
        company = data.get("company")
        description = data.get("description")
        skills = data.get("skills", [])
        location = data.get("location")
        salary = data.get("salary")

        if not title or not company or not description:

            return jsonify({

                "message":
                    "Title, company and description are required"

            }), 400

        mongo.db.jobs.update_one(

            {
                "_id":
                    ObjectId(job_id)
            },

            {
                "$set": {

                    "title":
                        title,

                    "company":
                        company,

                    "description":
                        description,

                    "skills":
                        skills,

                    "location":
                        location,

                    "salary":
                        salary

                }
            }

        )

        return jsonify({

            "message":
                "Job updated successfully"

        }), 200

    except Exception as e:

        return jsonify({

            "message":
                str(e)

        }), 500


# =========================================================
# DELETE JOB
# =========================================================

@app.route(
    "/api/jobs/<job_id>",
    methods=["DELETE"]
)
@jwt_required()
def delete_job(job_id):

    try:

        current_user = get_jwt_identity()

        job = mongo.db.jobs.find_one({

            "_id":
                ObjectId(job_id)

        })

        if not job:

            return jsonify({

                "message":
                    "Job not found"

            }), 404

        if job["created_by"] != current_user:

            return jsonify({

                "message":
                    "You cannot delete this job"

            }), 403

        mongo.db.jobs.delete_one({

            "_id":
                ObjectId(job_id)

        })

        mongo.db.applications.delete_many({

            "job_id":
                job_id

        })

        return jsonify({

            "message":
                "Job and related applications deleted successfully"

        }), 200

    except Exception as e:

        return jsonify({

            "message":
                str(e)

        }), 500


# =========================================================
# APPLY FOR JOB
# =========================================================

@app.route(
    "/api/jobs/<job_id>/apply",
    methods=["POST"]
)
@jwt_required()
def apply_for_job(job_id):

    try:

        current_user = get_jwt_identity()

        candidate = mongo.db.users.find_one({

            "_id":
                ObjectId(current_user)

        })

        if not candidate:

            return jsonify({

                "message":
                    "User not found"

            }), 404

        if candidate["role"] != "candidate":

            return jsonify({

                "message":
                    "Only candidates can apply for jobs"

            }), 403

        job = mongo.db.jobs.find_one({

            "_id":
                ObjectId(job_id)

        })

        if not job:

            return jsonify({

                "message":
                    "Job not found"

            }), 404

        existing_application = mongo.db.applications.find_one({

            "job_id":
                job_id,

            "candidate_id":
                current_user

        })

        if existing_application:

            return jsonify({

                "message":
                    "You have already applied for this job"

            }), 409

        application = {

            "job_id":
                job_id,

            "candidate_id":
                current_user,

            "candidate_name":
                candidate["name"],

            "candidate_email":
                candidate["email"],

            "job_title":
                job["title"],

            "company":
                job["company"],

            "status":
                "Applied",

            "applied_at":
                datetime.utcnow()

        }

        result = mongo.db.applications.insert_one(
            application
        )

        return jsonify({

            "message":
                "Application submitted successfully",

            "application_id":
                str(result.inserted_id)

        }), 201

    except Exception as e:

        return jsonify({

            "message":
                str(e)

        }), 500


# =========================================================
# GET CANDIDATE APPLICATIONS
# =========================================================

@app.route(
    "/api/candidate/applications",
    methods=["GET"]
)
@jwt_required()
def candidate_applications():

    try:

        current_user = get_jwt_identity()

        applications = list(

            mongo.db.applications.find({

                "candidate_id":
                    current_user

            }).sort(
                "_id",
                -1
            )

        )

        for application in applications:

            application["_id"] = str(
                application["_id"]
            )

        return jsonify(
            applications
        ), 200

    except Exception as e:

        return jsonify({

            "message":
                str(e)

        }), 500


# =========================================================
# GET RECRUITER APPLICATIONS
# =========================================================

@app.route(
    "/api/recruiter/applications",
    methods=["GET"]
)
@jwt_required()
def recruiter_applications():

    try:

        current_user = get_jwt_identity()

        recruiter = mongo.db.users.find_one({

            "_id":
                ObjectId(current_user)

        })

        if not recruiter:

            return jsonify({

                "message":
                    "User not found"

            }), 404

        if recruiter["role"] != "recruiter":

            return jsonify({

                "message":
                    "Only recruiters can view applications"

            }), 403

        recruiter_jobs = list(

            mongo.db.jobs.find({

                "created_by":
                    current_user

            })

        )

        job_ids = [

            str(job["_id"])

            for job in recruiter_jobs

        ]

        applications = list(

            mongo.db.applications.find({

                "job_id": {

                    "$in":
                        job_ids

                }

            }).sort(
                "_id",
                -1
            )

        )

        for application in applications:

            application["_id"] = str(
                application["_id"]
            )

        return jsonify(
            applications
        ), 200

    except Exception as e:

        return jsonify({

            "message":
                str(e)

        }), 500


# =========================================================
# AI ANALYZE CANDIDATE
# =========================================================

@app.route(
    "/api/recruiter/applications/<application_id>/analyze",
    methods=["GET"]
)
@jwt_required()
def analyze_candidate(application_id):

    try:

        current_user = get_jwt_identity()

        # -----------------------------------------
        # Get application
        # -----------------------------------------

        application = mongo.db.applications.find_one({

            "_id":
                ObjectId(application_id)

        })

        if not application:

            return jsonify({

                "message":
                    "Application not found"

            }), 404

        # -----------------------------------------
        # Get job
        # -----------------------------------------

        job = mongo.db.jobs.find_one({

            "_id":
                ObjectId(application["job_id"])

        })

        if not job:

            return jsonify({

                "message":
                    "Job not found"

            }), 404

        # -----------------------------------------
        # Security
        # -----------------------------------------

        if job["created_by"] != current_user:

            return jsonify({

                "message":
                    "You cannot analyze this candidate"

            }), 403

        # -----------------------------------------
        # Get candidate
        # -----------------------------------------

        candidate = mongo.db.users.find_one({

            "_id":
                ObjectId(
                    application["candidate_id"]
                )

        })

        if not candidate:

            return jsonify({

                "message":
                    "Candidate not found"

            }), 404

        # -----------------------------------------
        # Get resume
        # -----------------------------------------

        resume = candidate.get("resume")

        if not resume:

            return jsonify({

                "message":
                    "Candidate has not uploaded a resume"

            }), 400

        resume_text = resume.get(
            "resume_text",
            ""
        )

        # -----------------------------------------
        # Job information
        # -----------------------------------------

        job_skills = job.get(
            "skills",
            []
        )

        job_description = job.get(
            "description",
            ""
        )

        # -----------------------------------------
        # Basic skill matching
        # -----------------------------------------

        resume_lower = resume_text.lower()

        matching_skills = []

        missing_skills = []

        for skill in job_skills:

            if skill.lower() in resume_lower:

                matching_skills.append(skill)

            else:

                missing_skills.append(skill)

        # -----------------------------------------
        # Match score
        # -----------------------------------------

        if len(job_skills) > 0:

            match_score = round(

                (
                    len(matching_skills)
                    /
                    len(job_skills)
                ) * 100

            )

        else:

            match_score = 0

        # -----------------------------------------
        # AI prompt
        # -----------------------------------------

        prompt = f"""
You are HireAI, an AI recruitment assistant.

Analyze the candidate resume against the job.

JOB TITLE:
{job.get("title", "")}

JOB DESCRIPTION:
{job_description}

REQUIRED SKILLS:
{", ".join(job_skills)}

CANDIDATE RESUME:
{resume_text[:12000]}

SKILLS MATCHED BY THE SYSTEM:
{", ".join(matching_skills)}

SKILLS NOT FOUND BY THE SYSTEM:
{", ".join(missing_skills)}

SYSTEM MATCH SCORE:
{match_score}%

Provide a concise recruiter-friendly analysis.

Include:

1. Overall assessment
2. Matching skills
3. Missing skills
4. Candidate strengths
5. Recommended interview areas

Do NOT invent experience that is not present in the resume.
Do NOT make a final hiring decision.
"""

        # -----------------------------------------
        # OLLAMA LOCAL AI
        # -----------------------------------------

        ai_response = ollama.chat(

            model=OLLAMA_MODEL,

            messages=[

                {
                    "role":
                        "user",

                    "content":
                        prompt
                }

            ]

        )

        ai_analysis = ai_response[
            "message"
        ][
            "content"
        ]

        # -----------------------------------------
        # Return analysis
        # -----------------------------------------

        return jsonify({

            "candidate": {

                "name":
                    candidate["name"],

                "email":
                    candidate["email"]

            },

            "job": {

                "title":
                    job["title"],

                "company":
                    job["company"]

            },

            "resume": {

                "filename":
                    resume["filename"]

            },

            "match_score":
                match_score,

            "matching_skills":
                matching_skills,

            "missing_skills":
                missing_skills,

            "ai_analysis":
                ai_analysis

        }), 200

    except Exception as e:

        print(
            "AI ANALYSIS ERROR:",
            str(e)
        )

        return jsonify({

            "message":
                str(e)

        }), 500


# =========================================================
# RECRUITER AI CHATBOT
# =========================================================

@app.route(
    "/api/recruiter/applications/<application_id>/chat",
    methods=["POST"]
)
@jwt_required()
def recruiter_chat(application_id):

    try:

        current_user = get_jwt_identity()

        data = request.get_json()

        question = data.get(
            "question",
            ""
        ).strip()

        if not question:

            return jsonify({

                "message":
                    "Question is required"

            }), 400

        # -----------------------------------------
        # Get application
        # -----------------------------------------

        application = mongo.db.applications.find_one({

            "_id":
                ObjectId(application_id)

        })

        if not application:

            return jsonify({

                "message":
                    "Application not found"

            }), 404

        # -----------------------------------------
        # Get job
        # -----------------------------------------

        job = mongo.db.jobs.find_one({

            "_id":
                ObjectId(application["job_id"])

        })

        if not job:

            return jsonify({

                "message":
                    "Job not found"

            }), 404

        # -----------------------------------------
        # Security
        # -----------------------------------------

        if job["created_by"] != current_user:

            return jsonify({

                "message":
                    "You cannot access this candidate"

            }), 403

        # -----------------------------------------
        # Get candidate
        # -----------------------------------------

        candidate = mongo.db.users.find_one({

            "_id":
                ObjectId(
                    application["candidate_id"]
                )

        })

        if not candidate:

            return jsonify({

                "message":
                    "Candidate not found"

            }), 404

        # -----------------------------------------
        # Get resume
        # -----------------------------------------

        resume = candidate.get("resume")

        if not resume:

            return jsonify({

                "message":
                    "Candidate has no uploaded resume"

            }), 400

        resume_text = resume.get(
            "resume_text",
            ""
        )

        # -----------------------------------------
        # AI prompt
        # -----------------------------------------

        prompt = f"""
You are HireAI, an AI assistant for a recruiter.

You are helping the recruiter evaluate ONE candidate
for ONE specific job.

JOB:
{job.get("title", "")}

COMPANY:
{job.get("company", "")}

JOB DESCRIPTION:
{job.get("description", "")}

REQUIRED SKILLS:
{", ".join(job.get("skills", []))}

CANDIDATE:
{candidate.get("name", "")}

CANDIDATE RESUME:
{resume_text[:12000]}

RECRUITER QUESTION:
{question}

Instructions:

- Answer only using information from the job description
  and candidate resume.
- Do not invent candidate experience.
- If something is not mentioned in the resume, clearly say
  that it is not mentioned.
- Explain your reasoning clearly.
- You may identify matching and missing skills.
- You may suggest interview questions.
- Do not make an automatic hiring decision.
- Treat the response as recruiter decision support.

Give a concise and useful recruiter-oriented answer.
"""

        # -----------------------------------------
        # OLLAMA LOCAL AI
        # -----------------------------------------

        response = ollama.chat(

            model=OLLAMA_MODEL,

            messages=[

                {
                    "role":
                        "user",

                    "content":
                        prompt
                }

            ]

        )

        answer = response[
            "message"
        ][
            "content"
        ]

        return jsonify({

            "answer":
                answer

        }), 200

    except Exception as e:

        print(
            "CHATBOT ERROR:",
            str(e)
        )

        return jsonify({

            "message":
                str(e)

        }), 500


# =========================================================
# RUN SERVER
# =========================================================

if __name__ == "__main__":

    app.run(

        debug=True,

        port=5000

    )