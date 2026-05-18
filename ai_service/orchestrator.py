from typing import Dict, Any
from langgraph.graph import StateGraph, END
from schema_validator import WorkflowState

from agents.vision_agent import run_vision_agent
from agents.reasoner import run_reasoner_agent
from agents.critic import run_critic_agent
from agents.formatter import run_formatter_agent

def critic_condition(state: WorkflowState) -> str:
    if state.get("critic_feedback") == "PASS":
        return "formatter_agent"
    return "reasoner_agent"

# Build the Graph
workflow = StateGraph(WorkflowState)

workflow.add_node("vision_agent", run_vision_agent)
workflow.add_node("reasoner_agent", run_reasoner_agent)
workflow.add_node("critic_agent", run_critic_agent)
workflow.add_node("formatter_agent", run_formatter_agent)

workflow.set_entry_point("vision_agent")
workflow.add_edge("vision_agent", "reasoner_agent")
workflow.add_edge("reasoner_agent", "critic_agent")

workflow.add_conditional_edges(
    "critic_agent",
    critic_condition,
    {
        "formatter_agent": "formatter_agent",
        "reasoner_agent": "reasoner_agent"
    }
)

workflow.add_edge("formatter_agent", END)

app = workflow.compile()

def run_analysis_workflow(image_bytes: bytes, prompt: str, content_type: str) -> Dict[str, Any]:
    print(f"Starting LangGraph workflow for prompt: '{prompt}'")
    
    initial_state = {
        "image_bytes": image_bytes,
        "content_type": content_type,
        "prompt": prompt,
        "iterations": 0
    }
    
    final_state = app.invoke(initial_state)
    
    return final_state["final_result"]
