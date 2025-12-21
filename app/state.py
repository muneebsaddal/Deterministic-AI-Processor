from typing import TypedDict, Optional, List, Any

class GraphState(TypedDict):
    """
    State that flows through the graph.
    LangGraph requires TypedDict, not dict subclass.
    """
    input_text: str
    extracted_data: Optional[dict]
    validation_error: Optional[str]
    attempts: int
    logs: List[str]
    final_output: Optional[dict]

