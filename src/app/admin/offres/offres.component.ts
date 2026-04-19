import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

type CategoryFilter = 'tout' | 'voyage' | 'restaurant' | 'partenaire' | 'autre';

@Component({
  selector: 'app-offres',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './offres.component.html',
  styleUrl: './offres.component.scss',
})
export class OffresComponent {
  activeFilter = signal<CategoryFilter>('tout');

  filters: { key: CategoryFilter; label: string }[] = [
    { key: 'tout',        label: 'Tout' },
    { key: 'voyage',      label: 'Voyage' },
    { key: 'restaurant',  label: 'Restaurant' },
    { key: 'partenaire',  label: 'Partenaire' },
    { key: 'autre',       label: 'Autre' },
  ];

  setFilter(f: CategoryFilter) {
    this.activeFilter.set(f);
  }
}
