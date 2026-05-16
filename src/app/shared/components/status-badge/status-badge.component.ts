import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  template: `<span class="badge" [class]="badgeClass">{{ label }}</span>`,
  styles: [`
    @use '../../../../styles/variables' as *;

    .badge {
      display: inline-flex;
      align-items: center;
      padding: 3px 10px;
      border-radius: $radius-full;
      font-size: $font-size-xs;
      font-weight: 600;
      letter-spacing: 0.2px;
      white-space: nowrap;

      &.open    { background: rgba(16,185,129,0.12); color: #047857; }
      &.draft   { background: rgba(156,163,175,0.15); color: #6b7280; }
      &.closed  { background: rgba(239,68,68,0.10);  color: #b91c1c; }
      &.archived{ background: rgba(156,163,175,0.15); color: #6b7280; }
      &.cancelled{ background: rgba(239,68,68,0.10); color: #b91c1c; }
      &.pending { background: rgba(245,158,11,0.12); color: #92400e; }
      &.confirmed { background: rgba(16,185,129,0.12); color: #047857; }
      &.rejected  { background: rgba(239,68,68,0.10); color: #b91c1c; }
      &.active   { background: rgba(16,185,129,0.12); color: #047857; }
      &.inactive { background: rgba(239,68,68,0.10); color: #b91c1c; }
      &.paid     { background: rgba(16,185,129,0.12); color: #047857; }
      &.overdue  { background: rgba(239,68,68,0.10); color: #b91c1c; }
    }
  `],
})
export class StatusBadgeComponent {
  @Input() statut = '';
  @Input() type: 'offre' | 'inscription' | 'cotisation' | 'user' = 'offre';

  get label(): string {
    if (this.type === 'offre') {
      const m: Record<string, string> = {
        OPEN: 'Ouverte', DRAFT: 'Brouillon', CLOSED: 'Fermée',
        ARCHIVED: 'Archivée', CANCELLED: 'Annulée', FULL: 'Complet',
      };
      return m[this.statut] ?? this.statut;
    }
    if (this.type === 'inscription') {
      const m: Record<string, string> = {
        PENDING: 'En attente', APPROVED: 'Confirmée',
        REJECTED: 'Rejetée', CANCELLED: 'Annulée',
      };
      return m[this.statut] ?? this.statut;
    }
    if (this.type === 'cotisation') {
      const m: Record<string, string> = {
        PAID: 'Payée', PENDING: 'En attente', OVERDUE: 'En retard',
      };
      return m[this.statut] ?? this.statut;
    }
    if (this.type === 'user') {
      return this.statut ? 'Actif' : 'Inactif';
    }
    return this.statut;
  }

  get badgeClass(): string {
    const s = this.statut;
    if (this.type === 'offre') {
      const m: Record<string, string> = {
        OPEN: 'open', DRAFT: 'draft', CLOSED: 'closed',
        ARCHIVED: 'archived', CANCELLED: 'cancelled', FULL: 'closed',
      };
      return `badge ${m[s] ?? 'draft'}`;
    }
    if (this.type === 'inscription') {
      const m: Record<string, string> = {
        PENDING: 'pending', APPROVED: 'confirmed',
        REJECTED: 'rejected', CANCELLED: 'cancelled',
      };
      return `badge ${m[s] ?? 'pending'}`;
    }
    if (this.type === 'cotisation') {
      const m: Record<string, string> = {
        PAID: 'paid', PENDING: 'pending', OVERDUE: 'overdue',
      };
      return `badge ${m[s] ?? 'pending'}`;
    }
    if (this.type === 'user') {
      return `badge ${this.statut ? 'active' : 'inactive'}`;
    }
    return 'badge draft';
  }
}
