import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card.component';
import { LucideAngularModule, LUCIDE_ICONS, LucideIconProvider, Users, Tag, CreditCard, ClipboardList, TrendingUp } from 'lucide-angular';

interface StatsData {
  totalMembres: number;
  membresActifs: number;
  totalOffres: number;
  offresOuvertes: number;
  totalInscriptions: number;
  inscriptionsConfirmees: number;
  totalCotisations: number;
  cotisationsPayees: number;
  montantPercu: number;
  montantAttendu: number;
  repartitionOffres: { type: string; count: number }[];
  evolutionInscriptions: { mois: string; count: number }[];
}

@Component({
  selector: 'app-bureau-statistiques',
  standalone: true,
  imports: [CommonModule, KpiCardComponent, LucideAngularModule],
  providers: [
    { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ Users, Tag, CreditCard, ClipboardList, TrendingUp }) },
  ],
  templateUrl: './bureau-statistiques.component.html',
  styleUrl: './bureau-statistiques.component.scss',
})
export class BureauStatistiquesComponent implements OnInit {
  private http = inject(HttpClient);

  stats   = signal<StatsData | null>(null);
  loading = signal(true);

  tauxPaiement = computed(() => {
    const s = this.stats();
    if (!s || s.totalCotisations === 0) return 0;
    return Math.round((s.cotisationsPayees / s.totalCotisations) * 100);
  });

  tauxInscription = computed(() => {
    const s = this.stats();
    if (!s || s.totalInscriptions === 0) return 0;
    return Math.round((s.inscriptionsConfirmees / s.totalInscriptions) * 100);
  });

  maxOffreCount = computed(() => {
    const s = this.stats();
    if (!s || s.repartitionOffres.length === 0) return 1;
    return Math.max(...s.repartitionOffres.map(r => r.count));
  });

  maxInscCount = computed(() => {
    const s = this.stats();
    if (!s || s.evolutionInscriptions.length === 0) return 1;
    return Math.max(...s.evolutionInscriptions.map(e => e.count));
  });

  private typeLabelsMap: { [k: string]: string } = {
    SPORTIF: 'Sport', CULTUREL: 'Culture', EDUCATIF: 'Éducatif', LOISIRS: 'Loisirs',
  };

  private typeColorsMap: { [k: string]: string } = {
    SPORTIF: '#3b82f6', CULTUREL: '#8b5cf6', EDUCATIF: '#f59e0b', LOISIRS: '#10b981',
  };

  typeLabel(type: string): string { return this.typeLabelsMap[type] ?? type; }
  typeColor(type: string): string { return this.typeColorsMap[type] ?? '#ccc'; }

  ngOnInit(): void {
    this.http.get<StatsData>('/api/statistiques/bureau').subscribe({
      next:  data => { this.stats.set(data); this.loading.set(false); },
      error: ()   => {
        this.stats.set({
          totalMembres: 0, membresActifs: 0,
          totalOffres: 0, offresOuvertes: 0,
          totalInscriptions: 0, inscriptionsConfirmees: 0,
          totalCotisations: 0, cotisationsPayees: 0,
          montantPercu: 0, montantAttendu: 0,
          repartitionOffres: [], evolutionInscriptions: [],
        });
        this.loading.set(false);
      },
    });
  }
}
