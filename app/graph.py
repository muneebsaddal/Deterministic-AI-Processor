from langgraph.graph import StateGraph, END
from app.state import GraphState
from app.nodes.extract import extract_node
from app.nodes.validate import validate_node
from app.nodes.fix_or_fail import fix_or_fail_node

def should_retry(state: GraphState) -> str:
    """
    Conditional edge logic.
    If validation error exists, go to fix_or_fail.
    Otherwise, end the graph.
    """
    return "fix_or_fail" if state["validation_error"] else END

def build_graph():
    """
    Build the deterministic processing graph.
    
    Flow:
    1. extract → validate
    2. validate → (if error) → fix_or_fail → validate
    3. validate → (if success) → END
    """
    graph = StateGraph(GraphState)

    # Add nodes
    graph.add_node("extract", extract_node)
    graph.add_node("validate", validate_node)
    graph.add_node("fix_or_fail", fix_or_fail_node)

    # Set entry point
    graph.set_entry_point("extract")

    # Add edges
    graph.add_edge("extract", "validate")
    graph.add_edge("fix_or_fail", "validate")

    # Conditional edge from validate
    graph.add_conditional_edges(
        "validate",
        should_retry,
        {
            "fix_or_fail": "fix_or_fail",
            END: END
        }
    )

    return graph.compile()
