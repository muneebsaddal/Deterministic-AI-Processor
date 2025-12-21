import React, { useState } from 'react';
import { Play, CheckCircle, XCircle, AlertCircle, ArrowRight, RotateCcw } from 'lucide-react';

const DeterministicAIDemo = () => {
  const [input, setInput] = useState('John Doe ordered 3 iPhones on 12 Aug 2024. Total cost was $2,997. Deliver to New York.');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);

  const exampleInputs = [
    {
      name: 'Perfect Input',
      text: 'John Doe ordered 3 iPhones on 12 Aug 2024. Total cost was $2,997. Currency: USD',
      expectation: 'Success on first try'
    },
    {
      name: 'Missing Currency',
      text: 'Jane Smith ordered 5 Macbooks on 15 Sep 2024. Total: $9,995.',
      expectation: 'Retry then success'
    },
    {
      name: 'Invalid Data',
      text: 'Someone might have ordered something sometime.',
      expectation: 'Fails after retry'
    }
  ];

  const simulateProcessing = async () => {
    setProcessing(true);
    setResult(null);
    setCurrentStep(0);

    const steps = [];
    
    // Step 1: Extract
    await new Promise(r => setTimeout(r, 800));
    setCurrentStep(1);
    
    // Simulate extraction
    const hasAllFields = input.includes('USD') || input.includes('currency');
    const hasBasicInfo = input.toLowerCase().includes('ordered') && 
                        /\d+/.test(input) && 
                        /\d{1,2}\s+\w+\s+\d{4}/.test(input);
    
    const extracted = hasBasicInfo ? {
      customer_name: input.match(/^(\w+\s+\w+)/)?.[1] || 'Unknown',
      item: input.match(/ordered\s+\d+\s+(\w+)/i)?.[1] || 'Unknown',
      quantity: parseInt(input.match(/ordered\s+(\d+)/i)?.[1]) || 0,
      order_date: '2024-08-12',
      total_amount: parseFloat(input.match(/\$?([\d,]+)/)?.[1]?.replace(',', '')) || 0,
      currency: hasAllFields ? 'USD' : null
    } : null;

    steps.push({
      step: 'extract',
      status: extracted ? 'success' : 'failed',
      data: extracted
    });

    // Step 2: Validate
    await new Promise(r => setTimeout(r, 800));
    setCurrentStep(2);

    const isValid = extracted && 
                   extracted.customer_name !== 'Unknown' &&
                   extracted.quantity > 0 &&
                   extracted.currency !== null;

    steps.push({
      step: 'validate',
      status: isValid ? 'success' : 'failed',
      error: !isValid ? 'Missing required field: currency' : null
    });

    // Step 3: Retry if needed
    let attempts = 0;
    if (!isValid && extracted) {
      await new Promise(r => setTimeout(r, 800));
      setCurrentStep(3);
      attempts = 1;

      // Simulate fix attempt
      const hasEnoughInfo = hasBasicInfo && input.match(/\$\d+/);
      if (hasEnoughInfo) {
        extracted.currency = 'USD'; // Inferred fix
        steps.push({
          step: 'fix_retry',
          status: 'success',
          data: extracted
        });

        // Re-validate
        await new Promise(r => setTimeout(r, 800));
        setCurrentStep(4);
        steps.push({
          step: 'validate',
          status: 'success'
        });
      } else {
        steps.push({
          step: 'fix_retry',
          status: 'failed',
          error: 'Cannot infer missing data'
        });
      }
    }

    const finalSuccess = steps[steps.length - 1].status === 'success';

    setResult({
      success: finalSuccess,
      data: finalSuccess ? extracted : null,
      steps,
      attempts,
      logs: steps.map((s, i) => `[${i + 1}] ${s.step}: ${s.status}`)
    });

    setProcessing(false);
    setCurrentStep(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Deterministic AI Processor
          </h1>
          <p className="text-slate-400">
            LangGraph-based extraction pipeline with controlled LLM behavior
          </p>
        </div>

        {/* Architecture Diagram */}
        <div className="bg-slate-800 rounded-lg p-6 mb-6 border border-slate-700">
          <h2 className="text-xl font-semibold mb-4 text-blue-400">Pipeline Architecture</h2>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <div className={`px-4 py-2 rounded ${currentStep === 1 ? 'bg-blue-600' : 'bg-slate-700'} transition-colors`}>
              Extract
            </div>
            <ArrowRight className="text-slate-500" />
            <div className={`px-4 py-2 rounded ${currentStep === 2 ? 'bg-blue-600' : 'bg-slate-700'} transition-colors`}>
              Validate
            </div>
            <ArrowRight className="text-slate-500" />
            <div className={`px-4 py-2 rounded ${currentStep === 3 ? 'bg-yellow-600' : 'bg-slate-700'} transition-colors`}>
              Fix/Retry
            </div>
            <ArrowRight className="text-slate-500" />
            <div className={`px-4 py-2 rounded ${currentStep === 4 ? 'bg-blue-600' : 'bg-slate-700'} transition-colors`}>
              Re-validate
            </div>
            <ArrowRight className="text-slate-500" />
            <div className="px-4 py-2 rounded bg-slate-700">
              Output/Fail
            </div>
          </div>
          <div className="mt-4 text-sm text-slate-400 text-center">
            Max 1 retry • Hard stop after failure • No guessing
          </div>
        </div>

        {/* Example Inputs */}
        <div className="bg-slate-800 rounded-lg p-6 mb-6 border border-slate-700">
          <h2 className="text-xl font-semibold mb-4 text-blue-400">Example Inputs</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {exampleInputs.map((ex, i) => (
              <button
                key={i}
                onClick={() => setInput(ex.text)}
                className="text-left p-4 bg-slate-700 rounded hover:bg-slate-600 transition-colors"
              >
                <div className="font-semibold text-sm mb-2">{ex.name}</div>
                <div className="text-xs text-slate-400 mb-2">{ex.expectation}</div>
                <div className="text-xs text-slate-500 truncate">{ex.text}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Input Section */}
        <div className="bg-slate-800 rounded-lg p-6 mb-6 border border-slate-700">
          <h2 className="text-xl font-semibold mb-4 text-blue-400">Input Text</h2>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full h-32 bg-slate-900 border border-slate-600 rounded p-4 text-white font-mono text-sm"
            placeholder="Enter unstructured order text..."
          />
          <button
            onClick={simulateProcessing}
            disabled={processing || !input}
            className="mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 rounded font-semibold flex items-center gap-2 transition-colors"
          >
            {processing ? (
              <>
                <RotateCcw className="animate-spin" size={20} />
                Processing...
              </>
            ) : (
              <>
                <Play size={20} />
                Process
              </>
            )}
          </button>
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {/* Status */}
            <div className={`rounded-lg p-6 border ${result.success ? 'bg-green-900/20 border-green-700' : 'bg-red-900/20 border-red-700'}`}>
              <div className="flex items-center gap-3 mb-4">
                {result.success ? (
                  <CheckCircle className="text-green-400" size={28} />
                ) : (
                  <XCircle className="text-red-400" size={28} />
                )}
                <div>
                  <h3 className="text-xl font-semibold">
                    {result.success ? 'Processing Successful' : 'Processing Failed'}
                  </h3>
                  <p className="text-sm text-slate-400">
                    {result.attempts > 0 ? `Succeeded after ${result.attempts} retry` : 'Succeeded on first attempt'}
                  </p>
                </div>
              </div>

              {result.success && result.data && (
                <div className="bg-slate-900 rounded p-4 font-mono text-sm">
                  <pre className="text-green-400">{JSON.stringify(result.data, null, 2)}</pre>
                </div>
              )}
            </div>

            {/* Execution Steps */}
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h3 className="text-xl font-semibold mb-4 text-blue-400">Execution Steps</h3>
              <div className="space-y-3">
                {result.steps.map((step, i) => (
                  <div key={i} className="flex items-start gap-3 bg-slate-900 rounded p-4">
                    <div className="mt-1">
                      {step.status === 'success' ? (
                        <CheckCircle className="text-green-400" size={20} />
                      ) : (
                        <AlertCircle className="text-yellow-400" size={20} />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm">
                        Step {i + 1}: {step.step}
                      </div>
                      {step.error && (
                        <div className="text-yellow-400 text-xs mt-1">{step.error}</div>
                      )}
                      {step.data && (
                        <div className="text-slate-400 text-xs mt-2 font-mono">
                          {JSON.stringify(step.data).slice(0, 100)}...
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Logs */}
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h3 className="text-xl font-semibold mb-4 text-blue-400">Execution Logs</h3>
              <div className="bg-slate-900 rounded p-4 font-mono text-xs text-slate-300 space-y-1">
                {result.logs.map((log, i) => (
                  <div key={i}>{log}</div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-slate-500 text-sm">
          <p>This is a simulation. Real implementation uses OpenAI + LangGraph.</p>
        </div>
      </div>
    </div>
  );
};

export default DeterministicAIDemo;