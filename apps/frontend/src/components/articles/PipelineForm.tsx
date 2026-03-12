import { useState } from 'react';
import type { SiteDTO } from '@seo-platform/shared';

export interface PipelineFormData {
  keyword: string;
  secondaryKeywords: string[];
  siteId: string;
  language: string;
}

interface PipelineFormProps {
  sites?: SiteDTO[];
  isRunning: boolean;
  onSubmit: (data: PipelineFormData) => void;
}

export function PipelineForm({ sites, isRunning, onSubmit }: PipelineFormProps) {
  const [keyword, setKeyword] = useState('');
  const [secondaryInput, setSecondaryInput] = useState('');
  const [secondaryKeywords, setSecondaryKeywords] = useState<string[]>([]);
  const [siteId, setSiteId] = useState('');
  const [language, setLanguage] = useState('fr');

  const handleSecondaryKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === ',' || e.key === 'Enter') && secondaryInput.trim()) {
      e.preventDefault();
      const newKw = secondaryInput.trim().replace(/,$/, '');
      if (newKw && !secondaryKeywords.includes(newKw) && secondaryKeywords.length < 10) {
        setSecondaryKeywords([...secondaryKeywords, newKw]);
      }
      setSecondaryInput('');
    }
  };

  const removeSecondary = (kw: string) => {
    setSecondaryKeywords(secondaryKeywords.filter((k) => k !== kw));
  };

  const handleSubmit = () => {
    if (!keyword.trim() || !siteId) return;
    onSubmit({ keyword: keyword.trim(), secondaryKeywords, siteId, language });
  };

  return (
    <div className="game-card-gold p-5">
      <h2 className="font-arcade text-xs text-gold tracking-wider mb-4">PIPELINE SEO</h2>

      <div className="space-y-3">
        <div>
          <label className="label-game">Mot-clé principal *</label>
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="ex: meilleur hébergement web"
            className="input-game"
            disabled={isRunning}
          />
        </div>

        <div>
          <label className="label-game">Mots-clés secondaires</label>
          <input
            type="text"
            value={secondaryInput}
            onChange={(e) => setSecondaryInput(e.target.value)}
            onKeyDown={handleSecondaryKeyDown}
            placeholder="Tapez puis virgule ou Entrée..."
            className="input-game"
            disabled={isRunning}
          />
          {secondaryKeywords.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {secondaryKeywords.map((kw) => (
                <span key={kw} className="inline-flex items-center gap-1 px-2 py-0.5 bg-dark-600 border border-dark-400 rounded text-xs text-gray-300">
                  {kw}
                  <button
                    onClick={() => removeSecondary(kw)}
                    className="text-gray-500 hover:text-danger ml-0.5"
                    disabled={isRunning}
                  >
                    x
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="label-game">Site cible *</label>
          <select
            value={siteId}
            onChange={(e) => setSiteId(e.target.value)}
            className="select-game"
            disabled={isRunning}
          >
            <option value="">Sélectionner...</option>
            {sites?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        <div>
          <label className="label-game">Langue</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="select-game"
            disabled={isRunning}
          >
            <option value="fr">Français</option>
            <option value="en">Anglais</option>
            <option value="es">Espagnol</option>
          </select>
        </div>

        <button
          onClick={handleSubmit}
          disabled={isRunning || !keyword.trim() || !siteId}
          className="btn-gold w-full disabled:opacity-50"
        >
          {isRunning ? 'Forge en cours...' : "FORGER L'ARTICLE"}
        </button>
      </div>
    </div>
  );
}
