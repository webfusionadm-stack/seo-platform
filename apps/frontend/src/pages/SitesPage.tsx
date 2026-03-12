import { useState } from 'react';
import type { SiteDTO, CreateSiteRequest, UpdateSiteRequest } from '@seo-platform/shared';
import { useSites, useCreateSite, useUpdateSite, useDeleteSite, useTestConnection } from '../hooks/useSites';
import { usePersonas } from '../hooks/usePersonas';
import { Modal } from '../components/ui/Modal';
import { StatusBadge } from '../components/ui/StatusBadge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';

interface SiteFormData {
  name: string; url: string; domain: string; da: string; dr: string;
  theme: string; wpUrl: string; wpUsername: string; wpAppPassword: string;
  personaId: string;
}

const emptySiteForm: SiteFormData = {
  name: '', url: '', domain: '', da: '', dr: '',
  theme: '', wpUrl: '', wpUsername: '', wpAppPassword: '',
  personaId: '',
};

function siteToFormData(site: SiteDTO): SiteFormData {
  return {
    name: site.name, url: site.url, domain: site.domain,
    da: site.da !== null ? String(site.da) : '', dr: site.dr !== null ? String(site.dr) : '',
    theme: site.theme ?? '', wpUrl: site.wpUrl ?? '', wpUsername: site.wpUsername ?? '', wpAppPassword: '',
    personaId: site.personaId ?? '',
  };
}

function formDataToCreateRequest(form: SiteFormData): CreateSiteRequest {
  const req: CreateSiteRequest = { name: form.name, url: form.url, domain: form.domain };
  if (form.da) req.da = Number(form.da);
  if (form.dr) req.dr = Number(form.dr);
  if (form.theme) req.theme = form.theme;
  if (form.wpUrl) req.wpUrl = form.wpUrl;
  if (form.wpUsername) req.wpUsername = form.wpUsername;
  if (form.wpAppPassword) req.wpAppPassword = form.wpAppPassword;
  if (form.personaId) req.personaId = form.personaId;
  return req;
}

function formDataToUpdateRequest(form: SiteFormData): UpdateSiteRequest {
  const req: UpdateSiteRequest = { name: form.name, url: form.url, domain: form.domain };
  if (form.da) req.da = Number(form.da);
  if (form.dr) req.dr = Number(form.dr);
  if (form.theme) req.theme = form.theme;
  if (form.wpUrl) req.wpUrl = form.wpUrl;
  if (form.wpUsername) req.wpUsername = form.wpUsername;
  if (form.wpAppPassword) req.wpAppPassword = form.wpAppPassword;
  (req as any).personaId = form.personaId || '';
  return req;
}

function SiteForm({ form, onChange, onSubmit, isSubmitting, submitLabel }: {
  form: SiteFormData; onChange: (f: SiteFormData) => void;
  onSubmit: () => void; isSubmitting: boolean; submitLabel: string;
}) {
  const { data: personas } = usePersonas();
  const set = (field: keyof SiteFormData, value: string) => onChange({ ...form, [field]: value });
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label-game">Nom *</label>
          <input type="text" value={form.name} onChange={(e) => set('name', e.target.value)} required className="input-game" />
        </div>
        <div>
          <label className="label-game">Domaine *</label>
          <input type="text" value={form.domain} onChange={(e) => set('domain', e.target.value)} required placeholder="example.com" className="input-game" />
        </div>
      </div>
      <div>
        <label className="label-game">URL *</label>
        <input type="url" value={form.url} onChange={(e) => set('url', e.target.value)} required placeholder="https://example.com" className="input-game" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="label-game">DA</label>
          <input type="number" min={0} max={100} value={form.da} onChange={(e) => set('da', e.target.value)} className="input-game" />
        </div>
        <div>
          <label className="label-game">DR</label>
          <input type="number" min={0} max={100} value={form.dr} onChange={(e) => set('dr', e.target.value)} className="input-game" />
        </div>
        <div>
          <label className="label-game">Thématique</label>
          <input type="text" value={form.theme} onChange={(e) => set('theme', e.target.value)} placeholder="Tech..." className="input-game" />
        </div>
      </div>

      {/* Persona Select */}
      <div>
        <label className="label-game">🎭 Persona</label>
        <select value={form.personaId} onChange={(e) => set('personaId', e.target.value)} className="select-game">
          <option value="">Aucun persona</option>
          {personas?.map((p) => (
            <option key={p.id} value={p.id}>{p.name} ({p.tone})</option>
          ))}
        </select>
      </div>

      <div className="border-t border-dark-400 pt-4 mt-4">
        <h3 className="font-arcade text-[10px] text-royal-light tracking-wider mb-3">⚙ CONNEXION WORDPRESS</h3>
        <div className="space-y-3">
          <div>
            <label className="label-game">URL WordPress</label>
            <input type="url" value={form.wpUrl} onChange={(e) => set('wpUrl', e.target.value)} placeholder="https://example.com" className="input-game" />
            <p className="text-[10px] text-gray-500 mt-1">Entrez l'URL de base du site (sans /wp-json)</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-game">Identifiant WP</label>
              <input type="text" value={form.wpUsername} onChange={(e) => set('wpUsername', e.target.value)} className="input-game" />
            </div>
            <div>
              <label className="label-game">Mot de passe App</label>
              <input type="password" value={form.wpAppPassword} onChange={(e) => set('wpAppPassword', e.target.value)} className="input-game" />
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-end pt-2">
        <button type="submit" disabled={isSubmitting} className="btn-gold disabled:opacity-50">
          {isSubmitting ? 'Enregistrement...' : submitLabel}
        </button>
      </div>
    </form>
  );
}

export default function SitesPage() {
  const { data: sites, isLoading } = useSites();
  const createSite = useCreateSite();
  const updateSite = useUpdateSite();
  const deleteSite = useDeleteSite();
  const testConnection = useTestConnection();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<SiteDTO | null>(null);
  const [form, setForm] = useState<SiteFormData>(emptySiteForm);

  const openCreate = () => { setEditingSite(null); setForm(emptySiteForm); setModalOpen(true); };
  const openEdit = (site: SiteDTO) => { setEditingSite(site); setForm(siteToFormData(site)); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditingSite(null); setForm(emptySiteForm); };

  const handleSubmit = async () => {
    if (editingSite) await updateSite.mutateAsync({ id: editingSite.id, data: formDataToUpdateRequest(form) });
    else await createSite.mutateAsync(formDataToCreateRequest(form));
    closeModal();
  };

  if (isLoading) return <LoadingSpinner text="Chargement des domaines..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-arcade text-xl text-gold tracking-wider">🏯 MY DOMAINS</h1>
          <p className="text-gray-500 text-sm mt-1">Gérez vos sites et connexions WordPress</p>
        </div>
        <button onClick={openCreate} className="btn-gold">
          ✦ INVOQUER UN DOMAINE
        </button>
      </div>

      {!sites || sites.length === 0 ? (
        <EmptyState
          icon="🏯"
          title="AUCUN DOMAINE"
          description="Invoquez votre premier domaine pour commencer."
          action={<button onClick={openCreate} className="btn-gold">✦ INVOQUER UN DOMAINE</button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sites.map((site) => (
            <div key={site.id} className="game-card group hover:glow-violet transition-all duration-300 p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-gray-200 truncate">{site.name}</h3>
                  <a href={site.url} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-cyber hover:text-cyber-light truncate block transition-colors">
                    {site.url}
                  </a>
                </div>
                <StatusBadge status={site.status} />
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3">
                {[
                  { label: 'DA', value: site.da },
                  { label: 'DR', value: site.dr },
                  { label: 'Articles', value: site.articleCount },
                ].map((stat) => (
                  <div key={stat.label} className="bg-dark-800 rounded-lg py-2 px-1 text-center">
                    <div className="text-[9px] font-arcade text-gray-500 tracking-wider">{stat.label}</div>
                    <div className="text-sm font-bold text-gray-300">{stat.value ?? '-'}</div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 flex-wrap mb-3">
                {site.theme && (
                  <span className="badge badge-royal text-[10px]">{site.theme}</span>
                )}
                {site.personaName && (
                  <span className="badge badge-royal text-[10px]">🎭 {site.personaName}</span>
                )}
              </div>

              <div className="flex items-center gap-2 mb-3">
                <div className={`w-2 h-2 rounded-full ${
                  site.wpConnected ? 'bg-emerald animate-pulse' : site.hasWpCredentials ? 'bg-gold' : 'bg-gray-600'
                }`} />
                <span className="text-xs text-gray-500">
                  {site.wpConnected ? 'WordPress connecté' : site.hasWpCredentials ? 'WP configuré' : 'WP non configuré'}
                </span>
              </div>

              <div className="flex items-center gap-2 border-t border-dark-400/50 pt-3">
                <button onClick={() => openEdit(site)} className="btn-ghost flex-1 text-xs">Modifier</button>
                {site.hasWpCredentials && (
                  <button onClick={() => testConnection.mutate(site.id)} disabled={testConnection.isPending}
                    className="btn-ghost text-xs text-cyber border-cyber/30 hover:border-cyber/60 disabled:opacity-50">
                    Tester WP
                  </button>
                )}
                <button
                  onClick={() => window.confirm(`Supprimer "${site.name}" ?`) && deleteSite.mutate(site.id)}
                  disabled={deleteSite.isPending}
                  className="btn-ghost text-xs text-danger border-danger/30 hover:border-danger/60 disabled:opacity-50">
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={closeModal} title={editingSite ? '✏ MODIFIER LE DOMAINE' : '✦ INVOQUER UN DOMAINE'}>
        <SiteForm form={form} onChange={setForm} onSubmit={handleSubmit}
          isSubmitting={createSite.isPending || updateSite.isPending}
          submitLabel={editingSite ? 'Mettre à jour' : 'Invoquer'} />
      </Modal>
    </div>
  );
}
