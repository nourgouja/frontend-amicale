import { Component, Input, Output, EventEmitter, signal, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { inject } from '@angular/core';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';
import { getOffreTypeColor, getOffreTypeLabel } from '../../utils/format.utils';

export interface Offre {
  id: number;
  titre: string;
  description?: string | null;
  typeOffre: string;
  statutOffre: string;
  dateDebut: string;
  dateFin?: string | null;
  lieu?: string | null;
  prixParPersonne?: number | null;
  capaciteMax?: number | null;
  placesRestantes?: number | null;
  imageBase64?: string | null;
  imageType?: string | null;
  poleNom?: string | null;
  avantages?: string | null;
}

@Component({
  selector: 'app-offer-card',
  standalone: true,
  imports: [CommonModule, DatePipe, StatusBadgeComponent],
  templateUrl: './offer-card.component.html',
  styleUrl: './offer-card.component.scss',
})
export class OfferCardComponent {
  private router = inject(Router);

  @Input() offre!: Offre;
  @Input() mode: 'admin' | 'bureau' | 'adherent' = 'adherent';

  @Output() archive    = new EventEmitter<number>();
  @Output() fermer     = new EventEmitter<number>();
  @Output() modifier   = new EventEmitter<number>();
  @Output() inscrire   = new EventEmitter<number>();

  menuOpen  = signal(false);
  favoured  = signal(false);

  toggleFavour(e: MouseEvent): void {
    e.stopPropagation();
    this.favoured.update(v => !v);
  }

  onCardClick(): void {
    if (this.mode === 'adherent') {
      this.router.navigate(['/adherent/offres', this.offre.id]);
    }
  }

  get imageUrl(): string | null {
    if (!this.offre?.imageBase64 || !this.offre?.imageType) return null;
    return `data:${this.offre.imageType};base64,${this.offre.imageBase64}`;
  }

  get typeColor(): string { return getOffreTypeColor(this.offre?.typeOffre); }
  get typeLabel(): string { return getOffreTypeLabel(this.offre?.typeOffre); }

  get fillPercent(): number {
    const cap = this.offre?.capaciteMax;
    const rest = this.offre?.placesRestantes;
    if (!cap || cap === 0) return 0;
    const inscrits = cap - (rest ?? 0);
    return Math.round((inscrits / cap) * 100);
  }

  get inscrits(): number {
    const cap = this.offre?.capaciteMax ?? 0;
    const rest = this.offre?.placesRestantes ?? 0;
    return Math.max(0, cap - rest);
  }

  get isComplet(): boolean {
    return (this.offre?.placesRestantes ?? 1) === 0;
  }

  get canRegister(): boolean {
    return this.offre?.statutOffre === 'OUVERTE' && !this.isComplet;
  }

  toggleMenu(e: MouseEvent): void {
    e.stopPropagation();
    this.menuOpen.update(v => !v);
  }

  @HostListener('document:click')
  closeMenu(): void { this.menuOpen.set(false); }

  onArchive(e: MouseEvent): void {
    e.stopPropagation();
    this.menuOpen.set(false);
    this.archive.emit(this.offre.id);
  }

  onFermer(e: MouseEvent): void {
    e.stopPropagation();
    this.menuOpen.set(false);
    this.fermer.emit(this.offre.id);
  }

  onModifier(e: MouseEvent): void {
    e.stopPropagation();
    this.menuOpen.set(false);
    this.modifier.emit(this.offre.id);
  }
}
