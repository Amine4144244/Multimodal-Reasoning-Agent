from langchain_core.messages import SystemMessage, HumanMessage
from langchain_groq import ChatGroq
from schema_validator import WorkflowState

def run_reasoner_agent(state: WorkflowState) -> WorkflowState:
    print("--- REASONER AGENT ---")
    prompt = state["prompt"]
    vision_description = state["vision_description"]
    critic_feedback = state.get("critic_feedback", "")

    # We can use a fast reasoning model here, e.g., llama-3.3-70b-versatile or llama-3.1-8b-instant
    # Let's use llama-3.3-70b-versatile for high quality reasoning
    llm = ChatGroq(
        model="llama-3.3-70b-versatile",
        temperature=0.2
    )

    system_prompt = """You are the Reasoning Agent in a multimodal pipeline.
Your job is to read the detailed vision description of an image and the user's original goal/prompt.
Based on this, determine exactly what information the user needs.
Formulate a clear logical reasoning step-by-step on how to extract and structure this information.
CRITICAL INSTRUCTION: You MUST extract the ACTUAL DATA from the vision description. Do NOT invent or hallucinate dummy data (like "John Doe" or "Task 1"). If the information is not present in the vision description, explicitly state that it is missing.
Do NOT output JSON yet, just provide the logical reasoning and the actual extracted data to be formatted.
"""

    if critic_feedback:
        system_prompt += f"\n\nCRITIC FEEDBACK FROM PREVIOUS ITERATION:\n{critic_feedback}\nPlease adjust your reasoning to address this feedback."

    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=f"User Goal: {prompt}\n\nVision Analysis: {vision_description}")
    ]

    response = llm.invoke(messages)

    return {"reasoning": response.content}
