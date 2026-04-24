import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OfferCardComponent, Offre } from '../../shared/components/offer-card/offer-card.component';
import { LucideAngularModule, LUCIDE_ICONS, LucideIconProvider, Search } from 'lucide-angular';

@Component({
  selector: 'app-adherent-offres',
  standalone: true,
  imports: [CommonModule, FormsModule, OfferCardComponent, LucideAngularModule],
  providers: [
    { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ Search }) },
  ],
  templateUrl: './adherent-offres.component.html',
  styleUrl: './adherent-offres.component.scss',
})
export class AdherentOffresComponent implements OnInit {
  private http = inject(HttpClient);

  offres      = signal<Offre[]>([]);
  loading     = signal(true);
  searchQuery = signal('');
  activeTab   = signal('all');

  readonly tabs = [
    { key: 'all',      label: 'Toutes' },
    { key: 'SPORTIF',  label: 'Sport' },
    { key: 'CULTUREL', label: 'Culture' },
    { key: 'EDUCATIF', label: 'Éducatif' },
    { key: 'LOISIRS',  label: 'Loisirs' },
  ];

  filtered = computed(() => {
    let list = this.offres().filter(o => o.statutOffre === 'OUVERTE');
    const q  = this.searchQuery().toLowerCase().trim();
    const t  = this.activeTab();
    if (t !== 'all') list = list.filter(o => o.typeOffre === t);
    if (q)           list = list.filter(o => o.titre.toLowerCase().includes(q) || (o.lieu ?? '').toLowerCase().includes(q));
    return list;
  });

  ngOnInit(): void {
    this.http.get<Offre[]>('/api/offres/all').subscribe({
      next:  list => { this.offres.set(list); this.loading.set(false); },
      error: ()   => this.loading.set(false),
    });
  }

  inscrire(offre: Offre): void {
    this.http.post('/api/inscriptions', { offreId: offre.id }).subscribe({
      next: () => this.ngOnInit(),
      error: () => {},
    });
  }
}
