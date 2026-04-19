import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

type StatusFilter = 'tout' | 'en_attente' | 'confirmee' | 'annulee' | 'terminee';

@Component({
  selector: 'app-activites',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './activites.component.html',
  styleUrl: './activites.component.scss',
})
export class ActivitesComponent {
  activeFilter = signal<StatusFilter>('tout');

  filters: { key: StatusFilter; label: string }[] = [
    { key: 'tout',       label: 'Tout' },
    { key: 'en_attente', label: 'En Attente' },
    { key: 'confirmee',  label: 'Confirmée' },
    { key: 'annulee',    label: 'Annulée' },
    { key: 'terminee',   label: 'Terminée' },
  ];

  setFilter(f: StatusFilter) {
    this.activeFilter.set(f);
  }
}
