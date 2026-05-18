from langchain_core.messages import SystemMessage, HumanMessage
from langchain_groq import ChatGroq
from pydantic import BaseModel, Field
from schema_validator import WorkflowState

class CriticDecision(BaseModel):
    is_valid: bool = Field(description="True if the reasoning fully addresses the user goal based on the vision data.")
    feedback: str = Field(description="If not valid, explain what is missing or wrong. If valid, leave empty.")

def run_critic_agent(state: WorkflowState) -> WorkflowState:
    print("--- CRITIC AGENT ---")
    prompt = state["prompt"]
    vision_description = state["vision_description"]
    reasoning = state["reasoning"]
    iterations = state.get("iterations", 0)

    # Prevent infinite loops
    if iterations >= 2:
        print("Max iterations reached. Critic passing automatically.")
        return {"critic_feedback": "PASS"}

    llm = ChatGroq(
        model="llama-3.3-70b-versatile",
        temperature=0.0
    ).with_structured_output(CriticDecision)

    system_prompt = """You are the Critic Agent.
Your job is to evaluate the Reasoner's plan against the User Goal and the Vision Analysis.
Are there obvious missing fields? Did the Reasoner misunderstand the intent?
If it's good, set is_valid to True. If it's flawed, set is_valid to False and provide feedback."""

    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=f"User Goal: {prompt}\n\nVision Analysis: {vision_description}\n\nReasoner Plan: {reasoning}")
    ]

    decision = llm.invoke(messages)

    if decision.is_valid:
        return {"critic_feedback": "PASS"}
    else:
        return {"critic_feedback": decision.feedback, "iterations": iterations + 1}
