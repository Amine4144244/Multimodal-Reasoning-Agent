import os
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
from dotenv import load_dotenv

from orchestrator import run_analysis_workflow

load_dotenv()

app = FastAPI(title="AI Reasoning Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/analyze")
async def analyze(prompt: str = Form(...), image: UploadFile = File(...)):
    try:
        # Read image bytes
        image_bytes = await image.read()
        
        # Run LangGraph workflow
        result = run_analysis_workflow(image_bytes, prompt, image.content_type)
        
        return result
    except Exception as e:
        print(f"Error processing request: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
