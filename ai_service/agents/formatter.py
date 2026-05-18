from langchain_core.messages import SystemMessage, HumanMessage
from langchain_groq import ChatGroq
from schema_validator import WorkflowState, FinalAnalysisOutput

def run_formatter_agent(state: WorkflowState) -> WorkflowState:
    print("--- FORMATTER AGENT ---")
    prompt = state["prompt"]
    reasoning = state["reasoning"]

    # Use a highly capable JSON formatting model
    llm = ChatGroq(
        model="llama-3.3-70b-versatile",
        temperature=0.0
    ).with_structured_output(FinalAnalysisOutput)

    system_prompt = """You are the Formatter Agent.
Based on the Reasoning provided, format the final output into a structured JSON object.
Use dynamic keys in the 'result' dictionary that best fit the data extracted (e.g. 'items', 'total' for a receipt, or 'pros', 'cons' for a product).
CRITICAL INSTRUCTION: ONLY include the actual data provided in the Reasoning Plan. DO NOT invent, guess, or use placeholder dummy data like "John Doe". If data is missing, leave the field out or set it to null.
Also provide a confidence score (0.0-1.0) based on how certain the reasoner seemed.
Set needs_review to True if the reasoning indicated any uncertainty or missing information."""

    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=f"User Goal: {prompt}\n\nReasoning Plan:\n{reasoning}")
    ]

    final_output = llm.invoke(messages)

    return {"final_result": final_output.dict()}
