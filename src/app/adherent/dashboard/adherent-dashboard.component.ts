import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { AuthService } from '../../core/services/auth.service';
import { getDisplayName, formatDate } from '../../shared/utils/format.utils';
import { LucideAngularModule, LUCIDE_ICONS, LucideIconProvider, Tag, ClipboardList, CreditCard, CalendarDays } from 'lucide-angular';

interface Inscription {
  id: number;
  offreTitre: string;
  typeOffre: string;
  dateInscription: string;
  statut: string;
}

interface Cotisation {
  id: number;
  montant: number;
  dateEcheance: string;
  statut: string;
  anneeCotisation: number;
}

@Component({
  selector: 'app-adherent-dashboard',
  standalone: true,
  imports: [RouterLink, CommonModule, KpiCardComponent, StatusBadgeComponent, LucideAngularModule],
  providers: [
    { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ Tag, ClipboardList, CreditCard, CalendarDays }) },
  ],
  templateUrl: './adherent-dashboard.component.html',
  styleUrl: './adherent-dashboard.component.scss',
})
export class AdherentDashboardComponent implements OnInit {
  private http        = inject(HttpClient);
  private authService = inject(AuthService);

  inscriptions  = signal<Inscription[]>([]);
  cotisation    = signal<Cotisation | null>(null);
  offresCount   = signal(0);
  loading       = signal(true);

  displayName = computed(() => {
    const u = this.authService.currentUser();
    const full = `${u?.prenom ?? ''} ${u?.nom ?? ''}`.trim();
    return full || getDisplayName(u?.email ?? '');
  });

  inscriptionsConfirmees = computed(() => this.inscriptions().filter(i => i.statut === 'CONFIRMEE').length);
  inscriptionsAttente    = computed(() => this.inscriptions().filter(i => i.statut === 'EN_ATTENTE').length);
  cotisationStatus       = computed(() => this.cotisation()?.statut ?? 'AUCUNE');

  readonly today = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  }).format(new Date()).replace(/^\w/, c => c.toUpperCase());

  ngOnInit(): void {
    this.http.get<Inscription[]>('/api/inscriptions/mesinscriptions').subscribe({
      next:  list => { this.inscriptions.set(list); this.loading.set(false); },
      error: ()   => this.loading.set(false),
    });

    this.http.get<any>('/api/adherent/dashboard').subscribe({
      next: data => {
        const next = data.prochainesEcheances?.[0];
        if (next) {
          this.cotisation.set({
            id:               next.echeanceId,
            montant:          next.montant,
            dateEcheance:     next.dateEcheance,
            statut:           next.statut,
            anneeCotisation:  new Date(next.dateEcheance).getFullYear(),
          });
        }
        this.offresCount.set(data.offresDisponibles?.length ?? 0);
      },
      error: () => {},
    });
  }

  formatDate(s: string): string { return formatDate(s); }

  cotisationKpiColor(): 'primary' | 'blue' | 'green' | 'orange' | 'purple' | 'red' {
    const s = this.cotisationStatus();
    if (s === 'PAYEE') return 'green';
    if (s === 'EN_RETARD') return 'red';
    return 'orange';
  }

  cotisationKpiValue(): string | number {
    const c = this.cotisation();
    if (!c) return '—';
    return c.statut === 'PAYEE' ? 'À jour' : `${c.montant} DT`;
  }
}
