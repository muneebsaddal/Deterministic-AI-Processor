import json
import requests
from app.schemas import OrderSchema
from typing import Any

def extract_with_llm(text: str, is_retry: bool = False) -> dict[str, Any]:

    system_msg = (
        "You are a data extraction specialist. Extract order information and return ONLY valid JSON.\n"
        "Required fields: customer_name, item, quantity (integer > 0), order_date (YYYY-MM-DD), "
        "total_amount (number > 0), currency (USD/EUR/GBP).\n"
        "Do NOT add any extra fields. Do NOT guess missing values - if unclear, use reasonable defaults.\n"
        "Return ONLY the JSON object, no explanations."
    )

    if is_retry:
        system_msg = (
            "RETRY: Previous extraction had errors. Re-read carefully and fix them.\n"
            "Return ONLY valid JSON with all required fields."
        )

    prompt = f"Extract order data from this text as JSON:\n\n{text}\n\nJSON:"

    try:
        print(f"[DEBUG] Calling Ollama with model: mistral:latest")

        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "mistral:latest",
                "prompt": f"[INST] {system_msg}\n\n{prompt} [/INST]",
                "stream": False,
                "options": {
                    "temperature": 0.1,
                    "num_predict": 500
                }
            },
            timeout=60
        )

        print(f"[DEBUG] Ollama status code: {response.status_code}")
        print(f"[DEBUG] Ollama raw response: {response.text[:500]}")  # First 500 chars

        # Check if request was successful
        response.raise_for_status()

        # Parse response
        result = response.json()
        print(f"[DEBUG] Parsed JSON keys: {result.keys()}")

        # Check if 'response' key exists
        if 'response' not in result:
            print(f"[DEBUG] Full response structure: {result}")
            raise ValueError(f"Unexpected Ollama response format: {list(result.keys())}")

        response_text = result["response"].strip()
        print(f"[DEBUG] Extracted text: {response_text[:200]}")

        # Find JSON object in response
        start_idx = response_text.find('{')
        end_idx = response_text.rfind('}') + 1

        if start_idx == -1 or end_idx == 0:
            raise ValueError(f"No JSON found in response: {response_text}")

        json_str = response_text[start_idx:end_idx]
        print(f"[DEBUG] Extracted JSON string: {json_str}")

        parsed = json.loads(json_str)

        # Ensure date is string format
        if "order_date" in parsed and not isinstance(parsed["order_date"], str):
            parsed["order_date"] = str(parsed["order_date"])

        print(f"[DEBUG] Successfully parsed: {parsed}")
        return parsed

    except requests.exceptions.ConnectionError as e:
        print(f"[DEBUG] Connection error: {e}")
        raise ConnectionError(
            "Cannot connect to Ollama. Make sure it's running: 'ollama serve'"
        )
    except json.JSONDecodeError as e:
        print(f"[DEBUG] JSON decode error: {e}")
        raise ValueError(f"Failed to parse JSON from Ollama response: {e}")
    except Exception as e:
        print(f"[DEBUG] Unexpected error: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        raise RuntimeError(f"Ollama extraction failed: {str(e)}")


