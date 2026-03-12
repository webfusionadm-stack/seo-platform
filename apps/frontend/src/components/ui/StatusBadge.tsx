const STATUS_MAP: Record<string, { cls: string; label: string }> = {
  DRAFT: { cls: 'badge-gray', label: 'Brouillon' },
  GENERATING: { cls: 'badge-cyan', label: 'Génération...' },
  REVIEW: { cls: 'badge-gold', label: 'À relire' },
  SCHEDULED: { cls: 'badge-cyan', label: 'Planifié' },
  PUBLISHED: { cls: 'badge-emerald', label: 'Publié' },
  WAITING_REDACTION: { cls: 'badge-gold', label: 'En attente de rédaction' },
  IMAGE_PENDING: { cls: 'badge-cyan', label: 'Image en attente' },
  SUSPENDED: { cls: 'badge-danger', label: 'Suspendu' },
  PUBLISH_FAILED: { cls: 'badge-danger', label: 'Échec publication' },
  PENDING: { cls: 'badge-gold', label: 'En attente' },
  IN_PROGRESS: { cls: 'badge-cyan', label: 'En cours' },
  COMPLETED: { cls: 'badge-emerald', label: 'Terminé' },
  ACTIVE: { cls: 'badge-emerald', label: 'Actif' },
  INACTIVE: { cls: 'badge-danger', label: 'Inactif' },
  DONE: { cls: 'badge-emerald', label: 'Terminé' },
  FAILED: { cls: 'badge-danger', label: 'Échoué' },
};

export function StatusBadge({ status }: { status: string }) {
  const config = STATUS_MAP[status] || { cls: 'badge-gray', label: status };
  return <span className={`badge ${config.cls}`}>{config.label}</span>;
}
