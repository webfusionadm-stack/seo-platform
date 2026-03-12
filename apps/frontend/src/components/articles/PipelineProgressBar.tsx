import type { PipelineStep } from '../../hooks/useSEOPipeline';

interface PipelineProgressBarProps {
  steps: PipelineStep[];
  currentStep: number;
}

export function PipelineProgressBar({ steps, currentStep }: PipelineProgressBarProps) {
  const getStepColor = (status: PipelineStep['status']): string => {
    switch (status) {
      case 'complete': return 'bg-gold border-gold';
      case 'running': return 'bg-royal border-royal animate-pulse';
      case 'error': return 'bg-danger border-danger';
      default: return 'bg-dark-600 border-dark-500';
    }
  };

  const getLineColor = (stepIndex: number): string => {
    const step = steps[stepIndex];
    if (step.status === 'complete') return 'bg-gold';
    if (step.status === 'running') return 'bg-royal/50';
    return 'bg-dark-600';
  };

  const currentLabel = currentStep > 0
    ? steps.find((s) => s.number === currentStep)?.label || ''
    : '';

  return (
    <div className="game-card p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-arcade text-[10px] text-gold/70 tracking-wider">PIPELINE</h3>
        {currentLabel && (
          <span className="text-[10px] font-arcade text-royal-light tracking-wider">
            {currentLabel}
          </span>
        )}
      </div>

      <div className="flex items-center gap-0">
        {steps.map((step, i) => (
          <div key={step.number} className="flex items-center flex-1 last:flex-none">
            {/* Circle */}
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center border-2 text-[10px] font-arcade shrink-0 ${getStepColor(step.status)}`}
              title={step.label}
            >
              {step.status === 'complete' ? (
                <svg className="w-3.5 h-3.5 text-dark-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <span className={step.status === 'pending' ? 'text-gray-500' : 'text-white'}>{step.number}</span>
              )}
            </div>

            {/* Connecting line */}
            {i < steps.length - 1 && (
              <div className={`h-0.5 flex-1 mx-1 rounded ${getLineColor(i)}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step labels below on larger screens */}
      <div className="hidden sm:flex items-start gap-0 mt-2">
        {steps.map((step, i) => (
          <div key={step.number} className={`text-center flex-1 ${i === steps.length - 1 ? 'flex-none' : ''}`}>
            <span className={`text-[8px] leading-tight block ${
              step.status === 'complete' ? 'text-gold' :
              step.status === 'running' ? 'text-royal-light' :
              step.status === 'error' ? 'text-danger' :
              'text-gray-600'
            }`}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
