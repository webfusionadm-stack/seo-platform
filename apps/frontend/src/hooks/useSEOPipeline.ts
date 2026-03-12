import { useState, useCallback } from 'react';
import { streamSSE } from '../api/sse';
import type { SSEEvent, GenerateSeoPipelineRequest, FreepikImageProposal } from '@seo-platform/shared';
import { PIPELINE_TOTAL_STEPS, PIPELINE_STEP_LABELS } from '@seo-platform/shared';

type StepStatus = 'pending' | 'running' | 'complete' | 'error';

export interface PipelineStep {
  number: number;
  label: string;
  status: StepStatus;
}

interface UseSEOPipelineReturn {
  isRunning: boolean;
  steps: PipelineStep[];
  currentStep: number;
  streamedContent: string;
  finalContent: string;
  articleId: string | null;
  title: string;
  slug: string;
  metaTitle: string;
  metaDescription: string;
  wordCount: number;
  featuredImageUrl: string | null;
  imageProposals: FreepikImageProposal[];
  imageSearchKeyword: string;
  error: string | null;
  errorStep: number | null;
  startPipeline: (params: GenerateSeoPipelineRequest) => void;
  setFeaturedImageUrl: (url: string) => void;
  reset: () => void;
}

function createInitialSteps(): PipelineStep[] {
  return Array.from({ length: PIPELINE_TOTAL_STEPS }, (_, i) => ({
    number: i + 1,
    label: PIPELINE_STEP_LABELS[i + 1] || `Étape ${i + 1}`,
    status: 'pending' as StepStatus,
  }));
}

export function useSEOPipeline(): UseSEOPipelineReturn {
  const [isRunning, setIsRunning] = useState(false);
  const [steps, setSteps] = useState<PipelineStep[]>(createInitialSteps());
  const [currentStep, setCurrentStep] = useState(0);
  const [streamedContent, setStreamedContent] = useState('');
  const [finalContent, setFinalContent] = useState('');
  const [articleId, setArticleId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [featuredImageUrl, setFeaturedImageUrl] = useState<string | null>(null);
  const [imageProposals, setImageProposals] = useState<FreepikImageProposal[]>([]);
  const [imageSearchKeyword, setImageSearchKeyword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [errorStep, setErrorStep] = useState<number | null>(null);

  const updateStepStatus = useCallback((stepNumber: number, status: StepStatus) => {
    setSteps((prev) =>
      prev.map((s) => (s.number === stepNumber ? { ...s, status } : s))
    );
  }, []);

  const handleEvent = useCallback(
    (event: SSEEvent) => {
      switch (event.type) {
        case 'pipeline_start':
          break;
        case 'step_start':
          setCurrentStep(event.step);
          updateStepStatus(event.step, 'running');
          break;
        case 'step_progress':
          break;
        case 'step_complete':
          updateStepStatus(event.step, 'complete');
          break;
        case 'text_delta':
          setStreamedContent((prev) => prev + event.content);
          break;
        case 'image_proposals': {
          const ipEvent = event as SSEEvent & { images: FreepikImageProposal[]; searchKeyword: string };
          setImageProposals(ipEvent.images || []);
          setImageSearchKeyword(ipEvent.searchKeyword || '');
          break;
        }
        case 'done': {
          const doneEvent = event as SSEEvent & {
            articleId: string; title: string; slug: string;
            metaTitle: string; metaDescription: string; wordCount: number; content: string;
            featuredImageUrl?: string;
            imageProposals?: FreepikImageProposal[]; searchKeyword?: string;
          };
          if (doneEvent.imageProposals?.length) {
            setImageProposals(doneEvent.imageProposals);
            setImageSearchKeyword(doneEvent.searchKeyword || '');
          }
          setArticleId(doneEvent.articleId);
          setTitle(doneEvent.title);
          setSlug(doneEvent.slug || '');
          setMetaTitle(doneEvent.metaTitle || '');
          setMetaDescription(doneEvent.metaDescription || '');
          setWordCount(doneEvent.wordCount);
          setFinalContent(doneEvent.content || '');
          setFeaturedImageUrl(doneEvent.featuredImageUrl || null);
          setIsRunning(false);
          break;
        }
        case 'error':
          setError(event.message);
          setErrorStep(currentStep);
          updateStepStatus(currentStep, 'error');
          setIsRunning(false);
          break;
      }
    },
    [currentStep, updateStepStatus]
  );

  const startPipeline = useCallback(
    (params: GenerateSeoPipelineRequest) => {
      setIsRunning(true);
      setSteps(createInitialSteps());
      setCurrentStep(0);
      setStreamedContent('');
      setFinalContent('');
      setArticleId(null);
      setTitle('');
      setSlug('');
      setMetaTitle('');
      setMetaDescription('');
      setWordCount(0);
      setFeaturedImageUrl(null);
      setImageProposals([]);
      setImageSearchKeyword('');
      setError(null);
      setErrorStep(null);

      streamSSE('/ai/generate/seo-pipeline', params as unknown as Record<string, unknown>, handleEvent, (err) => {
        setError(err.message);
        setIsRunning(false);
      });
    },
    [handleEvent]
  );

  const reset = useCallback(() => {
    setIsRunning(false);
    setSteps(createInitialSteps());
    setCurrentStep(0);
    setStreamedContent('');
    setFinalContent('');
    setArticleId(null);
    setTitle('');
    setSlug('');
    setMetaTitle('');
    setMetaDescription('');
    setWordCount(0);
    setFeaturedImageUrl(null);
    setImageProposals([]);
    setImageSearchKeyword('');
    setError(null);
    setErrorStep(null);
  }, []);

  return {
    isRunning,
    steps,
    currentStep,
    streamedContent,
    finalContent,
    articleId,
    title,
    slug,
    metaTitle,
    metaDescription,
    wordCount,
    featuredImageUrl,
    imageProposals,
    imageSearchKeyword,
    error,
    errorStep,
    startPipeline,
    setFeaturedImageUrl,
    reset,
  };
}
