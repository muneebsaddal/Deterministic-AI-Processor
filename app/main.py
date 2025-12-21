import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from app.graph import build_graph
from app.state import GraphState

load_dotenv()

app = FastAPI(title="Deterministic AI Processor")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Build graph once at startup
graph = build_graph()

class ProcessRequest(BaseModel):
    text: str

class ProcessResponse(BaseModel):
    success: bool
    data: dict | None
    logs: list[str]
    attempts: int
    error: str | None = None

@app.post("/process", response_model=ProcessResponse)
def process_text(request: ProcessRequest):
    """
    Main endpoint: processes unstructured text through the graph.
    Returns structured output or error.
    """
    if not os.getenv("OPENAI_API_KEY"):
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY not set")

    # Initialize state - use dict for LangGraph compatibility
    initial_state: GraphState = {
        "input_text": request.text,
        "extracted_data": None,
        "validation_error": None,
        "attempts": 0,
        "logs": [],
        "final_output": None
    }

    try:
        # Run the graph
        result = graph.invoke(initial_state)
        
        success = result["validation_error"] is None
        
        return ProcessResponse(
            success=success,
            data=result["final_output"],
            logs=result["logs"],
            attempts=result["attempts"],
            error=result["validation_error"]
        )
    
    except RuntimeError as e:
        # Graph stopped due to max retries
        return ProcessResponse(
            success=False,
            data=None,
            logs=initial_state.get("logs", []) + [str(e)],
            attempts=initial_state.get("attempts", 0),
            error=str(e)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
def root():
    return {
        "message": "Deterministic AI Processor",
        "endpoints": {
            "POST /process": "Process unstructured text",
            "GET /": "This info"
        }
    }

