from typing import TypedDict, Optional, List

class GraphState(TypedDict):

    input_text: str
    extracted_data: Optional[dict]
    validation_error: Optional[str]
    attempts: int
    logs: List[str]
    final_output: Optional[dict]

