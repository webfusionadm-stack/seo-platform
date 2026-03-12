import { useState } from 'react';
import type { PersonaDTO, CreatePersonaRequest, UpdatePersonaRequest } from '@seo-platform/shared';
import { usePersonas, useCreatePersona, useUpdatePersona, useDeletePersona, useRegeneratePersona, useAnalyzePersonaSample } from '../hooks/usePersonas';
import { Modal } from '../components/ui/Modal';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';

const toneOptions = [
  { value: 'conversationnel', label: 'Conversationnel' },
  { value: 'professionnel', label: 'Professionnel' },
  { value: 'academique', label: 'Académique' },
  { value: 'enthousiaste', label: 'Enthousiaste' },
  { value: 'neutre', label: 'Neutre' },
] as const;

const formalityOptions = [
  { value: 'informel', label: 'Informel' },
  { value: 'semi-formel', label: 'Semi-formel' },
  { value: 'formel', label: 'Formel' },
];

interface CreateFormData {
  name: string;
  theme: string;
  age: number;
}

interface EditFormData {
  name: string;
  theme: string;
  tone: string;
  age: number;
  formalityLevel: string;
  writingStyle: string;
}

const emptyCreateForm: CreateFormData = {
  name: '',
  theme: '',
  age: 30,
};

function personaToEditForm(p: PersonaDTO): EditFormData {
  return {
    name: p.name,
    theme: p.theme,
    tone: p.tone,
    age: p.age,
    formalityLevel: p.formalityLevel,
    writingStyle: p.writingStyle,
  };
}

function SampleAnalysisPanel({ isAnalyzing, onAnalyze }: {
  isAnalyzing: boolean;
  onAnalyze: (text: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [sampleText, setSampleText] = useState('');

  if (isAnalyzing) {
    return (
      <div className="border border-gold/30 rounded-lg p-4 mb-4 bg-dark-800/50">
        <div className="flex flex-col items-center justify-center py-6 space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-gold/30 border-t-gold"></div>
          <p className="text-gold font-arcade text-xs tracking-wider animate-pulse">ANALYSE DE L'ARTICLE EN COURS...</p>
          <p className="text-gray-500 text-[10px]">Extraction du profil rédactionnel (~5-10s)</p>
        </div>
      </div>
    );
  }

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="w-full border border-dashed border-gold/30 rounded-lg p-3 mb-4 text-center hover:border-gold/60 hover:bg-dark-800/30 transition-all duration-200"
      >
        <span className="text-gold text-xs font-arcade tracking-wider">📝 PRÉ-REMPLIR À PARTIR D'UN EXEMPLE</span>
        <p className="text-gray-500 text-[10px] mt-1">Collez un article pour analyser et extraire le style rédactionnel</p>
      </button>
    );
  }

  return (
    <div className="border border-gold/30 rounded-lg p-4 mb-4 bg-dark-800/50">
      <div className="flex items-center justify-between mb-3">
        <span className="text-gold text-xs font-arcade tracking-wider">📝 ANALYSE D'ARTICLE EXEMPLE</span>
        <button
          type="button"
          onClick={() => { setExpanded(false); setSampleText(''); }}
          className="text-gray-500 hover:text-gray-300 text-xs"
        >
          ✕ Fermer
        </button>
      </div>
      <textarea
        value={sampleText}
        onChange={(e) => setSampleText(e.target.value)}
        placeholder="Collez ici un article exemple dont vous souhaitez reproduire le style rédactionnel (minimum 200 caractères)..."
        rows={6}
        className="input-game text-sm"
      />
      <div className="flex items-center justify-between mt-2">
        <span className="text-[10px] text-gray-500">
          {sampleText.length} / 200 caractères min.
        </span>
        <button
          type="button"
          onClick={() => onAnalyze(sampleText)}
          disabled={sampleText.length < 200}
          className="btn-gold text-xs disabled:opacity-50"
        >
          ✦ Analyser le style
        </button>
      </div>
    </div>
  );
}

function CreatePersonaForm({ form, onChange, onSubmit, isSubmitting, isAnalyzing, onAnalyze }: {
  form: CreateFormData;
  onChange: (f: CreateFormData) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  isAnalyzing: boolean;
  onAnalyze: (text: string) => void;
}) {
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-4">
      {isSubmitting ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-gold/30 border-t-gold"></div>
          <p className="text-gold font-arcade text-sm tracking-wider animate-pulse">L'IA FORGE VOTRE PERSONA...</p>
          <p className="text-gray-500 text-xs">Génération du profil rédactionnel en cours</p>
        </div>
      ) : (
        <>
          <SampleAnalysisPanel isAnalyzing={isAnalyzing} onAnalyze={onAnalyze} />

          <div>
            <label className="label-game">Nom du persona *</label>
            <input type="text" value={form.name} onChange={(e) => onChange({ ...form, name: e.target.value })} required
              placeholder="Ex: Clara la Digital Nomad" className="input-game" />
          </div>

          <div>
            <label className="label-game">Thématique</label>
            <input type="text" value={form.theme} onChange={(e) => onChange({ ...form, theme: e.target.value })}
              placeholder="Ex: entrepreneuriat, cuisine healthy, voyages en famille..."
              className="input-game" />
          </div>

          <div>
            <label className="label-game">Âge</label>
            <input type="number" value={form.age} min={16} max={99}
              onChange={(e) => onChange({ ...form, age: parseInt(e.target.value) || 30 })}
              className="input-game w-32" />
          </div>

          <p className="text-xs text-gray-500 italic">L'IA génèrera automatiquement le ton, la formalité et le style rédactionnel complet à partir du nom, de la thématique et de l'âge.</p>

          <div className="flex justify-end pt-2">
            <button type="submit" className="btn-gold">
              ✦ Forger
            </button>
          </div>
        </>
      )}
    </form>
  );
}

function EditPersonaForm({ form, onChange, onSubmit, onRegenerate, isSubmitting, isRegenerating, isAnalyzing, onAnalyze }: {
  form: EditFormData;
  onChange: (f: EditFormData) => void;
  onSubmit: () => void;
  onRegenerate: () => void;
  isSubmitting: boolean;
  isRegenerating: boolean;
  isAnalyzing: boolean;
  onAnalyze: (text: string) => void;
}) {
  const set = (field: keyof EditFormData, value: string | number) => onChange({ ...form, [field]: value });

  if (isRegenerating) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-gold/30 border-t-gold"></div>
        <p className="text-gold font-arcade text-sm tracking-wider animate-pulse">REGÉNÉRATION IA EN COURS...</p>
        <p className="text-gray-500 text-xs">Les champs seront recréés à partir du nom, thématique et âge</p>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-4">
      <SampleAnalysisPanel isAnalyzing={isAnalyzing} onAnalyze={onAnalyze} />

      <div>
        <label className="label-game">Nom du persona *</label>
        <input type="text" value={form.name} onChange={(e) => set('name', e.target.value)} required
          placeholder="Ex: Clara la Digital Nomad" className="input-game" />
      </div>

      <div>
        <label className="label-game">Thématique</label>
        <input type="text" value={form.theme} onChange={(e) => set('theme', e.target.value)}
          placeholder="Ex: entrepreneuriat, cuisine healthy, voyages en famille..."
          className="input-game" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="label-game">Âge</label>
          <input type="number" value={form.age} min={16} max={99}
            onChange={(e) => set('age', parseInt(e.target.value) || 30)}
            className="input-game" />
        </div>
        <div>
          <label className="label-game">Ton <span className="text-[9px] text-gray-500">(auto)</span></label>
          <select value={form.tone} onChange={(e) => set('tone', e.target.value)} className="select-game">
            {toneOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label-game">Formalité <span className="text-[9px] text-gray-500">(auto)</span></label>
          <select value={form.formalityLevel} onChange={(e) => set('formalityLevel', e.target.value)} className="select-game">
            {formalityOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="label-game">Style</label>
        <textarea value={form.writingStyle} onChange={(e) => set('writingStyle', e.target.value)}
          placeholder="Description complète du style rédactionnel : ton, expressions, vocabulaire, rythme, anecdotes..."
          rows={6} className="input-game" />
      </div>

      <div className="flex items-center justify-between pt-2">
        <button type="button" onClick={onRegenerate} className="btn-ghost text-xs">
          ↻ Regénérer via IA
        </button>
        <button type="submit" disabled={isSubmitting} className="btn-gold disabled:opacity-50">
          {isSubmitting ? 'Enregistrement...' : 'Mettre à jour'}
        </button>
      </div>
    </form>
  );
}

export default function PersonasPage() {
  const { data: personas, isLoading } = usePersonas();
  const createPersona = useCreatePersona();
  const updatePersona = useUpdatePersona();
  const deletePersona = useDeletePersona();
  const regeneratePersona = useRegeneratePersona();
  const analyzeSample = useAnalyzePersonaSample();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PersonaDTO | null>(null);
  const [createForm, setCreateForm] = useState<CreateFormData>(emptyCreateForm);
  const [editForm, setEditForm] = useState<EditFormData | null>(null);

  const openCreate = () => { setEditing(null); setCreateForm(emptyCreateForm); setEditForm(null); setModalOpen(true); };
  const openEdit = (p: PersonaDTO) => { setEditing(p); setEditForm(personaToEditForm(p)); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditing(null); setCreateForm(emptyCreateForm); setEditForm(null); };

  const handleCreate = async () => {
    await createPersona.mutateAsync(createForm as CreatePersonaRequest);
    closeModal();
  };

  const handleUpdate = async () => {
    if (!editing || !editForm) return;
    await updatePersona.mutateAsync({ id: editing.id, data: editForm as UpdatePersonaRequest });
    closeModal();
  };

  const handleRegenerate = async () => {
    if (!editing) return;
    const updated = await regeneratePersona.mutateAsync(editing.id);
    setEditForm(personaToEditForm(updated));
    setEditing(updated);
  };

  const handleAnalyzeForCreate = async (sampleText: string) => {
    const result = await analyzeSample.mutateAsync(sampleText);
    setCreateForm((prev) => ({
      ...prev,
      theme: result.theme || prev.theme,
    }));
  };

  const handleAnalyzeForEdit = async (sampleText: string) => {
    const result = await analyzeSample.mutateAsync(sampleText);
    setEditForm((prev) => prev ? {
      ...prev,
      theme: result.theme || prev.theme,
      tone: result.tone || prev.tone,
      formalityLevel: result.formalityLevel || prev.formalityLevel,
      writingStyle: result.style || prev.writingStyle,
    } : prev);
  };

  if (isLoading) return <LoadingSpinner text="Chargement des personas..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-arcade text-xl text-gold tracking-wider">🎭 PERSONA FORGE</h1>
          <p className="text-gray-500 text-sm mt-1">Créez des identités rédactionnelles pour vos sites</p>
        </div>
        <button onClick={openCreate} className="btn-gold">
          ✦ FORGER UN PERSONA
        </button>
      </div>

      {!personas || personas.length === 0 ? (
        <EmptyState
          icon="🎭"
          title="AUCUN PERSONA"
          description="Forgez votre premier persona pour personnaliser vos articles."
          action={<button onClick={openCreate} className="btn-gold">✦ FORGER UN PERSONA</button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {personas.map((persona) => (
            <div key={persona.id} className="game-card group hover:glow-violet transition-all duration-300 p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-gray-200 truncate">{persona.name}</h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="badge badge-royal text-[10px]">{persona.theme || 'généraliste'}</span>
                    <span className="badge badge-royal text-[10px]">{persona.tone}</span>
                    <span className="badge badge-royal text-[10px]">{persona.age} ans</span>
                  </div>
                </div>
                <span className="text-2xl">🎭</span>
              </div>

              <p className="text-xs text-gray-400 line-clamp-3 mb-3">{persona.writingStyle}</p>

              <div className="flex items-center gap-2 mb-3">
                <div className="bg-dark-800 rounded-lg py-1.5 px-3 text-center">
                  <div className="text-[9px] font-arcade text-gray-500 tracking-wider">SITES</div>
                  <div className="text-sm font-bold text-gray-300">{persona.siteCount}</div>
                </div>
              </div>

              <div className="flex items-center gap-2 border-t border-dark-400/50 pt-3">
                <button onClick={() => openEdit(persona)} className="btn-ghost flex-1 text-xs">Modifier</button>
                <button
                  onClick={() => window.confirm(`Supprimer "${persona.name}" ?`) && deletePersona.mutate(persona.id)}
                  disabled={deletePersona.isPending}
                  className="btn-ghost text-xs text-danger border-danger/30 hover:border-danger/60 disabled:opacity-50">
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={closeModal} title={editing ? '✏ MODIFIER LE PERSONA' : '✦ FORGER UN PERSONA'}>
        {editing && editForm ? (
          <EditPersonaForm
            form={editForm}
            onChange={setEditForm}
            onSubmit={handleUpdate}
            onRegenerate={handleRegenerate}
            isSubmitting={updatePersona.isPending}
            isRegenerating={regeneratePersona.isPending}
            isAnalyzing={analyzeSample.isPending}
            onAnalyze={handleAnalyzeForEdit}
          />
        ) : (
          <CreatePersonaForm
            form={createForm}
            onChange={setCreateForm}
            onSubmit={handleCreate}
            isSubmitting={createPersona.isPending}
            isAnalyzing={analyzeSample.isPending}
            onAnalyze={handleAnalyzeForCreate}
          />
        )}
      </Modal>
    </div>
  );
}
