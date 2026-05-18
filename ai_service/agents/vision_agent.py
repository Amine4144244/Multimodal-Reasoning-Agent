import base64
from langchain_core.messages import HumanMessage
from langchain_groq import ChatGroq
from schema_validator import WorkflowState

def run_vision_agent(state: WorkflowState) -> WorkflowState:
    print("--- VISION AGENT ---")
    image_bytes = state["image_bytes"]
    content_type = state["content_type"] or "image/jpeg"
    prompt = state["prompt"]

    # Convert image to base64
    base64_image = base64.b64encode(image_bytes).decode('utf-8')

    # Initialize the Groq Vision Model
    llm = ChatGroq(
        model="meta-llama/llama-4-scout-17b-16e-instruct",
        temperature=0.1
    )

    # Prepare message for vision model
    message = HumanMessage(
        content=[
            {
                "type": "text", 
                "text": f"Analyze this image carefully. The user's goal is: '{prompt}'. Extract all relevant text, objects, layout structure, and context clues that would help fulfill the user's goal."
            },
            {
                "type": "image_url",
                "image_url": {"url": f"data:{content_type};base64,{base64_image}"}
            }
        ]
    )

    response = llm.invoke([message])
    
    return {"vision_description": response.content}
