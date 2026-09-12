"""
RetailIQ GenAI Service — Member 3 (GenAI Business Intelligence)

Wraps the tested notebook functions into FastAPI endpoints so Node.js
(and the rest of the team) can call them over HTTP.

Endpoints:
    POST /assistant   -> answer a business question
    POST /report       -> generate a daily/weekly/monthly report
    POST /voice         -> full voice pipeline (speech in -> speech out)
    GET  /health        -> simple health check

Run locally with:
    uvicorn main:app --reload --port 8000

Then test at:
    http://127.0.0.1:8000/docs   (interactive Swagger UI, auto-generated)
"""

import os
import shutil
import tempfile

import whisper
from dotenv import load_dotenv
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.responses import FileResponse
from google import genai
from gtts import gTTS
from pydantic import BaseModel

# ---------------------------------------------------------------------------
# Setup — runs once when the server starts
# ---------------------------------------------------------------------------

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise RuntimeError(
        "GEMINI_API_KEY is missing. Create a .env file next to this script "
        "with GEMINI_API_KEY=your_key_here"
    )

client = genai.Client(api_key=GEMINI_API_KEY)

print("Loading Whisper model (small)... this happens once, at startup.")
whisper_model = whisper.load_model("tiny")
print("Whisper model loaded.")

app = FastAPI(
    title="RetailIQ GenAI Service",
    description="Business assistant, report generator, and multi-language voice assistant.",
    version="1.0.0",
)


# ---------------------------------------------------------------------------
# Request/response schemas
# ---------------------------------------------------------------------------

class AssistantRequest(BaseModel):
    question: str
    business_data: dict


class AssistantResponse(BaseModel):
    answer: str


class ReportRequest(BaseModel):
    business_data: dict
    period: str = "weekly"  # "daily" | "weekly" | "monthly"


class ReportResponse(BaseModel):
    report: str


class VoiceTextResponse(BaseModel):
    """Returned alongside the audio file, so the caller also gets the raw text."""
    question_text: str
    answer_text: str
    audio_file: str


# ---------------------------------------------------------------------------
# Core functions — same logic as the notebook, unchanged
# ---------------------------------------------------------------------------

def answer_business_question(question: str, business_data: dict) -> str:
    prompt = f"""
You are RetailIQ's business assistant, helping a retail store owner
understand their business.

Rules:
- Use ONLY the data provided below. Do not assume or invent any numbers.
- If the data doesn't contain enough info to answer, say so clearly.
- Be concise (2-3 sentences max) and use actual numbers from the data.

Business Data:
{business_data}

Question: {question}

Answer:
"""
    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=prompt,
    )
    return response.text


def generate_business_report(business_data: dict, period: str = "weekly") -> str:
    prompt = f"""
You are RetailIQ's report generator. Create a {period} business report
for a retail store owner using ONLY the data provided below.

Rules:
- Use ONLY the data given. Do not invent numbers.
- Structure the report with short sections: Sales, Inventory, Forecast, Anomalies.
- Keep it readable — 4-6 sentences total, not a huge essay.
- Highlight anything urgent (low stock, anomalies) clearly.

Business Data:
{business_data}

Generate the {period} report:
"""
    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=prompt,
    )
    return response.text


def run_voice_assistant(audio_file_path: str, business_data: dict, language: str = "hi") -> dict:
    """
    Full pipeline: speech (any supported language) -> text -> Gemini answer
    (same language) -> spoken audio response.

    Supported language codes: hi (Hindi), mr (Marathi), ta (Tamil),
    te (Telugu), kn (Kannada), ml (Malayalam), en (English)
    """
    # Step 1: Speech to text
    transcription = whisper_model.transcribe(audio_file_path, language=language)
    question_text = transcription["text"]

    # Step 2: Get answer from Gemini, in the same language
    prompt = f"""
You are RetailIQ's business assistant. Answer the retailer's question
in {language} language, using ONLY the data provided below.

Rules:
- Use ONLY the data provided below. Do not assume or invent any numbers.
- If the data doesn't contain enough info to answer, say so clearly, in {language}.
- Be concise (2-3 sentences max) and use actual numbers from the data.
- Respond ONLY in {language} language, written in its native script.

Business Data:
{business_data}

Question: {question_text}

Answer (in {language}):
"""
    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=prompt,
    )
    answer_text = response.text

    # Step 3: Text to speech
    output_path = os.path.join(tempfile.gettempdir(), f"assistant_response_{language}.mp3")
    gTTS(text=answer_text, lang=language).save(output_path)

    return {
        "question_text": question_text,
        "answer_text": answer_text,
        "audio_file": output_path,
    }


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/health")
def health_check():
    """Simple check that the service is up and Gemini/Whisper loaded correctly."""
    return {"status": "ok"}


@app.post("/assistant", response_model=AssistantResponse)
def assistant_endpoint(payload: AssistantRequest):
    """
    Answer a retailer's business question using the supplied business_data.

    Example request body:
    {
        "question": "What were today's sales?",
        "business_data": { "sales": {...}, "inventory": {...} }
    }
    """
    try:
        answer = answer_business_question(payload.question, payload.business_data)
        return AssistantResponse(answer=answer)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/report", response_model=ReportResponse)
def report_endpoint(payload: ReportRequest):
    """
    Generate a daily/weekly/monthly business report.

    Example request body:
    {
        "business_data": { "sales": {...}, "inventory": {...} },
        "period": "daily"
    }
    """
    try:
        report = generate_business_report(payload.business_data, payload.period)
        return ReportResponse(report=report)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/voice")
async def voice_endpoint(
    audio: UploadFile = File(..., description="Voice recording (.ogg, .mp3, .wav, etc.)"),
    business_data: str = Form(..., description="JSON string of the business data"),
    language: str = Form("hi", description="Language code: hi, mr, ta, te, kn, ml, en"),
):
    """
    Full voice pipeline. Accepts an uploaded audio file (multipart/form-data)
    plus business_data as a JSON string and a language code.

    Returns the spoken answer as an MP3 file. The transcribed question and
    answer text are included in the X-Question-Text / X-Answer-Text headers,
    since a file response can't carry a JSON body.
    """
    import json

    try:
        data_dict = json.loads(business_data)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="business_data must be valid JSON")

    # Save the uploaded audio to a temp file so Whisper can read it
    suffix = os.path.splitext(audio.filename)[1] or ".ogg"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        shutil.copyfileobj(audio.file, tmp)
        tmp_path = tmp.name

    try:
        result = run_voice_assistant(tmp_path, data_dict, language)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    finally:
        os.remove(tmp_path)

        import base64
    with open(result["audio_file"], "rb") as f:
        audio_bytes = f.read()
    audio_base64 = base64.b64encode(audio_bytes).decode("utf-8")

    return {
        "question_text": result["question_text"],
        "answer_text": result["answer_text"],
        "audio_base64": audio_base64,
    }
