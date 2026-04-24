export function getInitials(value: string): string {
  if (!value) return '??';
  // Handle "firstname.lastname@domain" email pattern
  if (value.includes('@')) {
    const local = value.split('@')[0];
    const parts = local.split('.');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return value.slice(0, 2).toUpperCase();
  }
  // Handle "Firstname Lastname" name pattern
  const parts = value.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return value.slice(0, 2).toUpperCase();
}

export function getDisplayName(email: string): string {
  if (!email) return '';
  const local = email.split('@')[0];
  const parts = local.split('.');
  return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
}

export function formatDate(dateString: string): string {
  if (!dateString) return '—';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '—';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export function getOffreTypeColor(type: string): string {
  const map: Record<string, string> = {
    VOYAGE:     '#3b82f6',
    SEJOUR:     '#10b981',
    ACTIVITE:   '#f59e0b',
    CONVENTION: '#8b5cf6',
  };
  return map[type] ?? '#9ca3af';
}

export function getOffreTypeLabel(type: string): string {
  const map: Record<string, string> = {
    VOYAGE:     'Voyage',
    SEJOUR:     'Séjour',
    ACTIVITE:   'Activité',
    CONVENTION: 'Convention',
  };
  return map[type] ?? type;
}

export function getRoleLabel(role: string): string {
  const map: Record<string, string> = {
    ADMIN:         'Administrateur',
    MEMBRE_BUREAU: 'Membre Bureau',
    ADHERENT:      'Adhérent',
  };
  return map[role] ?? role;
}

export function getStatutOffreLabel(statut: string): string {
  const map: Record<string, string> = {
    OUVERTE:  'Ouverte',
    BROUILLON:'Brouillon',
    FERMEE:   'Fermée',
    ARCHIVEE: 'Archivée',
    ANNULEE:  'Annulée',
  };
  return map[statut] ?? statut;
}

export function getStatutInscriptionLabel(statut: string): string {
  const map: Record<string, string> = {
    EN_ATTENTE: 'En attente',
    CONFIRMEE:  'Confirmée',
    REJETEE:    'Rejetée',
    ANNULEE:    'Annulée',
  };
  return map[statut] ?? statut;
}

export function getStatutCotisationLabel(statut: string): string {
  const map: Record<string, string> = {
    PAYEE:     'Payée',
    EN_ATTENTE:'En attente',
    EN_RETARD: 'En retard',
  };
  return map[statut] ?? statut;
}
