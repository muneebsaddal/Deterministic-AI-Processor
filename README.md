# Deterministic AI Processor with Ollama

A production-ready LangGraph pipeline that extracts structured data from unstructured text with **controlled LLM behavior**. Runs 100% locally using Ollama - no API costs!

## 🎯 What This Is

✅ A **deterministic processing machine** (not a chatbot)  
✅ A **compiler-like pipeline** where LLM is just one step  
✅ A system with **hard validation** and **bounded retries**  
✅ **100% local** - no API keys, no cloud costs  

## ❌ What This Is NOT

❌ A conversational chatbot  
❌ An AI that "tries its best" and guesses  
❌ A system that produces undefined behavior  

---

## 🏗️ Architecture

```
INPUT TEXT (unstructured)
    ↓
[Extract Node] ← Ollama/Mistral generates JSON
    ↓
[Validate Node] ← Pydantic schema enforcement
    ↓
  Valid? → YES → END (success ✓)
    ↓
   NO (validation error)
    ↓
[Fix/Retry Node] ← Retry once with error context
    ↓
[Validate Again]
    ↓
  Valid? → YES → END (success ✓)
         → NO  → STOP (hard failure ✗)
```

**Key Principle**: Max 1 retry, then hard stop. No endless loops, no guessing.

---

## 🚀 Quick Start

### Prerequisites

1. **Python 3.10+**
2. **Ollama installed** ([ollama.com](https://ollama.com))
3. **Mistral model downloaded**:
   ```bash
   ollama pull mistral:latest
   ```

### Installation

```bash
# 1. Clone/download the project
cd deterministic_ai_processor

# 2. Create virtual environment
python -m venv venv

# 3. Activate virtual environment
# Windows PowerShell:
.\venv\Scripts\Activate.ps1
# Windows CMD:
venv\Scripts\activate.bat
# Mac/Linux:
source venv/bin/activate

# 4. Install dependencies
pip install fastapi uvicorn requests langgraph langchain-core pydantic python-dotenv

# 5. Create empty __init__.py files (important!)
# Windows:
type nul > app\__init__.py
type nul > app\nodes\__init__.py
# Mac/Linux:
touch app/__init__.py app/nodes/__init__.py
```

### Running

```bash
# Terminal 1: Start Ollama (if not already running)
ollama serve

# Terminal 2: Start the API server
python -m uvicorn app.main:app --reload
```

Server will be running at: **http://localhost:8000**

---

## 🧪 Testing

### Test 1: Perfect Input ✓

```bash
curl -X POST http://localhost:8000/process -H "Content-Type: application/json" -d '{"text": "John Doe ordered 3 iPhones on 12 Aug 2024. Total cost was 2997 dollars. Currency: USD"}'
```

**Expected Output**:
```json
{
  "success": true,
  "data": {
    "customer_name": "John Doe",
    "item": "iPhones",
    "quantity": 3,
    "order_date": "2024-08-12",
    "total_amount": 2997.0,
    "currency": "USD"
  },
  "logs": [
    "🔍 Starting extraction...",
    "✓ Extraction completed",
    "✓ Validating against schema...",
    "✓ Validation passed"
  ],
  "attempts": 0,
  "error": null
}
```

### Test 2: Missing Currency (Retry Succeeds) 🔄

```bash
curl -X POST http://localhost:8000/process -H "Content-Type: application/json" -d '{"text": "Jane Smith ordered 5 Macbooks on 15 Sep 2024. Total: 9995 dollars."}'
```

**Expected**: First attempt fails (missing currency), retry infers USD, succeeds with `attempts: 1`.

### Test 3: Impossible Input (Hard Failure) ✗

```bash
curl -X POST http://localhost:8000/process -H "Content-Type: application/json" -d '{"text": "Someone might have ordered something maybe."}'
```

**Expected**: Fails validation twice, then stops with error message.

### Browser Testing (Easiest!)

Go to: **http://localhost:8000/docs**

Interactive Swagger UI where you can test without curl!

---

## 📋 Output Schema

Every successful response returns **exactly** these fields (enforced by Pydantic):

```json
{
  "customer_name": "string",
  "item": "string", 
  "quantity": integer (must be > 0),
  "order_date": "YYYY-MM-DD",
  "total_amount": float (must be > 0),
  "currency": "USD" | "EUR" | "GBP"
}
```

- **No extra fields allowed**
- **No optional fields** (all required)
- **Types strictly enforced**

---

## 📁 Project Structure

```
deterministic_ai_processor/
│
├── .env                     # Environment variables (not needed for Ollama)
├── requirements.txt         # Python dependencies
├── README.md               # This file
├── TECHNICAL_GUIDE.md      # Deep dive explanation
│
└── app/
    ├── __init__.py         # Makes 'app' a package
    ├── main.py             # FastAPI server
    ├── graph.py            # LangGraph definition
    ├── state.py            # State schema (TypedDict)
    ├── schemas.py          # Pydantic output schema
    ├── llm.py              # Ollama integration
    │
    └── nodes/
        ├── __init__.py     # Makes 'nodes' a package
        ├── extract.py      # Extraction node
        ├── validate.py     # Validation node
        └── fix_or_fail.py  # Retry/failure node
```

---

## 🔑 Key Features

| Feature | Description |
|---------|-------------|
| **Schema-First** | Pydantic models define allowed outputs |
| **Bounded Retries** | Max 1 retry, then hard stop |
| **Local Execution** | Runs on your machine via Ollama |
| **No API Costs** | Free forever |
| **Full Auditability** | Every step logged |
| **Type Safety** | Static type checking with Pylance |

---

## 🎓 Why This Matters

This pattern is the **foundation** for production AI systems:

### Real-World Applications
- **Automation Agents**: Execute tasks with guarantees
- **Data Pipelines**: ETL with strict validation
- **Document Processing**: Extract from invoices, forms, contracts
- **API Integrations**: Generate payloads with schema compliance

### What Makes It Different
Unlike chatbots, this system:
- ✅ Never hallucinates extra fields
- ✅ Never "tries its best" with bad data
- ✅ Never produces undefined behavior
- ✅ Fails fast and clearly

---

## 🛠️ Customization

### Change the Schema

Edit `app/schemas.py`:

```python
class InvoiceSchema(BaseModel):
    invoice_number: str
    vendor: str
    amount: float = Field(gt=0)
    date: date
    line_items: List[str]
```

### Use a Different Model

Edit `app/llm.py` and change:
```python
"model": "mistral:latest"
# to
"model": "deepseek-coder:6.7b"
```

### Adjust Retry Limit

Edit `app/nodes/fix_or_fail.py`:
```python
if state["attempts"] >= 2:  # Change from 1 to 2
```

---

## 🐛 Troubleshooting

### "Cannot connect to Ollama"
```bash
# Start Ollama service
ollama serve
```

### "Module not found"
```bash
# Make sure __init__.py files exist
# Windows:
type nul > app\__init__.py
type nul > app\nodes\__init__.py
```

### "uvicorn not found"
```bash
# Use Python module syntax
python -m uvicorn app.main:app --reload
```

### Slow Responses
- Mistral is ~4GB, needs decent hardware
- Try smaller model: `ollama pull gemma3:270m`
- Or use faster model: `ollama pull phi3`

---

## 📚 Learning Resources

- **TECHNICAL_GUIDE.md** - Deep dive into how everything works
- **LangGraph Docs**: [langchain-ai.github.io/langgraph](https://langchain-ai.github.io/langgraph)
- **Pydantic Docs**: [docs.pydantic.dev](https://docs.pydantic.dev)
- **Ollama Models**: [ollama.com/library](https://ollama.com/library)

---

## 📊 Performance

**Hardware Requirements**:
- CPU: Modern multi-core (Mistral needs ~4 cores)
- RAM: 8GB minimum (16GB recommended)
- Storage: 5GB for Mistral model

**Response Times** (varies by hardware):
- Extract: 2-5 seconds
- Validate: <0.1 seconds
- Total: 2-10 seconds per request

---

## 🤝 Contributing

This is a learning project! Feel free to:
- Add new extraction schemas
- Test with different Ollama models
- Improve error handling
- Add unit tests

---

## 📄 License

MIT - Use freely for learning or production!

---

## 🎯 What You've Built

A **production-grade deterministic AI system** that:
- Runs 100% locally (no API costs)
- Has predictable behavior (bounded retries)
- Enforces strict schemas (no hallucinations)
- Provides full audit trails (every step logged)

This architecture is used in real automation agents, ETL pipelines, and document processing systems. You've built the foundation! 🚀

---

## 📞 Next Steps

1. ✅ Run all three test cases
2. ✅ Read TECHNICAL_GUIDE.md for deep understanding
3. ✅ Modify schema for your use case
4. ✅ Add to your GitHub portfolio
5. ✅ Build something cool with it!

**Pro Tip**: This project demonstrates understanding of controlled AI behavior - exactly what companies look for in automation engineers.
