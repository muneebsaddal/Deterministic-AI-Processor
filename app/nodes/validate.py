from app.state import GraphState
from app.schemas import OrderSchema
from pydantic import ValidationError

def validate_node(state: GraphState) -> GraphState:

    state["logs"].append("✓ Validating against schema...")

    if not state["extracted_data"]:
        state["validation_error"] = "No data to validate"
        state["logs"].append("✗ Validation failed: No extracted data")
        return state

    try:
        # Attempt to validate
        validated = OrderSchema.model_validate(state["extracted_data"])
        state["validation_error"] = None
        state["final_output"] = validated.model_dump()
        state["logs"].append("✓ Validation passed")
    except ValidationError as e:
        # Capture validation errors
        error_details = "; ".join([f"{err['loc'][0]}: {err['msg']}" for err in e.errors()])
        state["validation_error"] = error_details
        state["logs"].append(f"✗ Validation failed: {error_details}")

    return state
