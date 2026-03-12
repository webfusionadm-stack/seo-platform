import { useState, useCallback } from 'react';
import { streamSSE } from '../api/sse';
import type { SSEEvent } from '@seo-platform/shared';

interface UseAIStreamReturn {
  content: string;
  isGenerating: boolean;
  articleId: string | null;
  error: string | null;
  generateSeo: (params: { keyword: string; siteId: string; language?: string; wordCount?: number }) => void;
  generateSponsored: (params: {
    keyword: string;
    siteId: string;
    anchorText: string;
    targetUrl: string;
    brief?: string;
    language?: string;
    wordCount?: number;
    orderId?: string;
  }) => void;
  reset: () => void;
}

export function useAIStream(): UseAIStreamReturn {
  const [content, setContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [articleId, setArticleId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleEvent = useCallback((event: SSEEvent) => {
    switch (event.type) {
      case 'text_delta':
        setContent((prev) => prev + event.content);
        break;
      case 'done':
        setArticleId(event.articleId);
        setIsGenerating(false);
        break;
      case 'error':
        setError(event.message);
        setIsGenerating(false);
        break;
    }
  }, []);

  const generateSeo = useCallback(
    (params: { keyword: string; siteId: string; language?: string; wordCount?: number }) => {
      setContent('');
      setArticleId(null);
      setError(null);
      setIsGenerating(true);
      streamSSE('/ai/generate/seo', params, handleEvent, (err) => {
        setError(err.message);
        setIsGenerating(false);
      });
    },
    [handleEvent]
  );

  const generateSponsored = useCallback(
    (params: {
      keyword: string;
      siteId: string;
      anchorText: string;
      targetUrl: string;
      brief?: string;
      language?: string;
      wordCount?: number;
      orderId?: string;
    }) => {
      setContent('');
      setArticleId(null);
      setError(null);
      setIsGenerating(true);
      streamSSE('/ai/generate/sponsored', params, handleEvent, (err) => {
        setError(err.message);
        setIsGenerating(false);
      });
    },
    [handleEvent]
  );

  const reset = useCallback(() => {
    setContent('');
    setArticleId(null);
    setError(null);
    setIsGenerating(false);
  }, []);

  return { content, isGenerating, articleId, error, generateSeo, generateSponsored, reset };
}
