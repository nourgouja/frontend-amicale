import {
  getInitials,
  getDisplayName,
  formatDate,
  getOffreTypeColor,
  getOffreTypeLabel,
  getRoleLabel,
  getStatutOffreLabel,
  getStatutInscriptionLabel,
  getStatutCotisationLabel,
} from './format.utils';

describe('format.utils', () => {

  // ── getInitials ──────────────────────────────────────────────────────────────
  describe('getInitials()', () => {
    it('returns ?? for empty string', () => {
      expect(getInitials('')).toBe('??');
    });

    it('extracts initials from email "firstname.lastname@domain"', () => {
      expect(getInitials('alice.dupont@star.com')).toBe('AD');
    });

    it('extracts initials from full name "Firstname Lastname"', () => {
      expect(getInitials('Alice Dupont')).toBe('AD');
    });

    it('returns first 2 chars uppercase for single-word email local part', () => {
      expect(getInitials('alice@star.com')).toBe('AL');
    });

    it('returns first 2 chars uppercase for single word name', () => {
      expect(getInitials('Alice')).toBe('AL');
    });
  });

  // ── getDisplayName ───────────────────────────────────────────────────────────
  describe('getDisplayName()', () => {
    it('returns empty string for empty input', () => {
      expect(getDisplayName('')).toBe('');
    });

    it('capitalizes each part from email', () => {
      expect(getDisplayName('alice.dupont@star.com')).toBe('Alice Dupont');
    });

    it('handles single-part email local', () => {
      expect(getDisplayName('alice@test.com')).toBe('Alice');
    });
  });

  // ── formatDate ───────────────────────────────────────────────────────────────
  describe('formatDate()', () => {
    it('returns — for empty string', () => {
      expect(formatDate('')).toBe('—');
    });

    it('returns — for invalid date', () => {
      expect(formatDate('not-a-date')).toBe('—');
    });

    it('formats a valid ISO date to DD/MM/YYYY', () => {
      expect(formatDate('2024-06-15')).toBe('15/06/2024');
    });

    it('pads single-digit day and month', () => {
      expect(formatDate('2024-01-05')).toBe('05/01/2024');
    });
  });

  // ── getOffreTypeColor ────────────────────────────────────────────────────────
  describe('getOffreTypeColor()', () => {
    it('returns correct color for VOYAGE', () => {
      expect(getOffreTypeColor('VOYAGE')).toBe('#3b82f6');
    });

    it('returns correct color for ACTIVITE', () => {
      expect(getOffreTypeColor('ACTIVITE')).toBe('#16a34a');
    });

    it('returns fallback gray for unknown type', () => {
      expect(getOffreTypeColor('UNKNOWN')).toBe('#9ca3af');
    });
  });

  // ── getOffreTypeLabel ────────────────────────────────────────────────────────
  describe('getOffreTypeLabel()', () => {
    it('returns Voyage for VOYAGE', () => {
      expect(getOffreTypeLabel('VOYAGE')).toBe('Voyage');
    });

    it('returns Séjour for SEJOUR', () => {
      expect(getOffreTypeLabel('SEJOUR')).toBe('Séjour');
    });

    it('returns raw value for unknown type', () => {
      expect(getOffreTypeLabel('CUSTOM')).toBe('CUSTOM');
    });
  });

  // ── getRoleLabel ─────────────────────────────────────────────────────────────
  describe('getRoleLabel()', () => {
    it('returns Administrateur for ADMIN', () => {
      expect(getRoleLabel('ADMIN')).toBe('Administrateur');
    });

    it('returns Membre Bureau for MEMBRE_BUREAU', () => {
      expect(getRoleLabel('MEMBRE_BUREAU')).toBe('Membre Bureau');
    });

    it('returns Adhérent for ADHERENT', () => {
      expect(getRoleLabel('ADHERENT')).toBe('Adhérent');
    });

    it('returns raw value for unknown role', () => {
      expect(getRoleLabel('SUPER_USER')).toBe('SUPER_USER');
    });
  });

  // ── getStatutOffreLabel ──────────────────────────────────────────────────────
  describe('getStatutOffreLabel()', () => {
    it('returns Ouverte for OPEN', () => {
      expect(getStatutOffreLabel('OPEN')).toBe('Ouverte');
    });

    it('returns Brouillon for DRAFT', () => {
      expect(getStatutOffreLabel('DRAFT')).toBe('Brouillon');
    });

    it('returns raw value for unknown statut', () => {
      expect(getStatutOffreLabel('MYSTERY')).toBe('MYSTERY');
    });
  });

  // ── getStatutInscriptionLabel ────────────────────────────────────────────────
  describe('getStatutInscriptionLabel()', () => {
    it('returns En attente for PENDING', () => {
      expect(getStatutInscriptionLabel('PENDING')).toBe('En attente');
    });

    it('returns Confirmée for APPROVED', () => {
      expect(getStatutInscriptionLabel('APPROVED')).toBe('Confirmée');
    });

    it('returns Annulée for CANCELLED', () => {
      expect(getStatutInscriptionLabel('CANCELLED')).toBe('Annulée');
    });
  });

  // ── getStatutCotisationLabel ─────────────────────────────────────────────────
  describe('getStatutCotisationLabel()', () => {
    it('returns Payée for PAID', () => {
      expect(getStatutCotisationLabel('PAID')).toBe('Payée');
    });

    it('returns En retard for OVERDUE', () => {
      expect(getStatutCotisationLabel('OVERDUE')).toBe('En retard');
    });

    it('returns raw value for unknown statut', () => {
      expect(getStatutCotisationLabel('PENDING')).toBe('En attente');
    });
  });
});
