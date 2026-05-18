import json
from typing import TypedDict, Dict, Any, Optional
from pydantic import BaseModel, Field

class FinalAnalysisOutput(BaseModel):
    result: Dict[str, Any] = Field(description="The structured JSON data extracted from the image and reasoning.")
    confidence: float = Field(description="Confidence score between 0.0 and 1.0")
    needs_review: bool = Field(description="Flag indicating if human review is recommended")

class WorkflowState(TypedDict):
    image_bytes: bytes
    content_type: str
    prompt: str
    vision_description: Optional[str]
    reasoning: Optional[str]
    critic_feedback: Optional[str]
    final_result: Optional[dict]
    iterations: int
