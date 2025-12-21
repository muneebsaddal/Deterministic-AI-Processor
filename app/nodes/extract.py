from app.state import GraphState
from app.llm import extract_with_llm

def extract_node(state: GraphState) -> GraphState:
    """
    Node 1: Extract data using LLM.
    No validation here - just extraction.
    """
    text = state["input_text"]
    state["logs"].append("🔍 Starting extraction...")

    try:
        extracted = extract_with_llm(text, is_retry=False)
        state["extracted_data"] = extracted
        state["logs"].append(f"✓ Extraction completed: {list(extracted.keys())}")
    except Exception as e:
        state["logs"].append(f"✗ Extraction failed: {str(e)}")
        state["extracted_data"] = None

    return state
