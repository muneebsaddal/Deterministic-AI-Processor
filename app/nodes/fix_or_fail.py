from app.state import GraphState
from app.llm import extract_with_llm

def fix_or_fail_node(state: GraphState) -> GraphState:
    """
    Node 3: Retry extraction once with error context.
    If attempts >= 1, this node raises an exception to stop the graph.
    """
    if state["attempts"] >= 1:
        state["logs"].append("✗ Max retries reached. Stopping.")
        raise RuntimeError(f"Validation failed after retry: {state['validation_error']}")

    state["attempts"] += 1
    state["logs"].append(f"🔄 Retry attempt {state['attempts']}...")

    # Build enhanced prompt with error context
    retry_text = (
        f"Original text: {state['input_text']}\n\n"
        f"Previous errors: {state['validation_error']}\n\n"
        f"Fix these issues and extract again."
    )

    try:
        fixed = extract_with_llm(retry_text, is_retry=True)
        state["extracted_data"] = fixed
        state["logs"].append("✓ Retry extraction completed")
    except Exception as e:
        state["logs"].append(f"✗ Retry extraction failed: {str(e)}")

    return state
