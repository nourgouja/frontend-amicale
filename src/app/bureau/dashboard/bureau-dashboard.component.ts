import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card.component';
import { AuthService } from '../../core/services/auth.service';
import { getDisplayName, formatDate } from '../../shared/utils/format.utils';
import { LucideAngularModule, LUCIDE_ICONS, LucideIconProvider, Tag, ClipboardList, DollarSign, CalendarDays } from 'lucide-angular';

interface PendingInscription {
  id: number;
  offreTitre: string;
  mailAdherent: string;
  statut: string;
  dateInscription: string;
}

interface BureauDashboardData {
  mesOffres: { statut: string }[];
  totalInscriptionsEnAttente: number;
  inscriptionsEnAttente: PendingInscription[];
  totalPaiementsEnRetard: number;
}

@Component({
  selector: 'app-bureau-dashboard',
  standalone: true,
  imports: [RouterLink, CommonModule, KpiCardComponent, LucideAngularModule],
  providers: [
    { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ Tag, ClipboardList, DollarSign, CalendarDays }) },
  ],
  templateUrl: './bureau-dashboard.component.html',
  styleUrl: './bureau-dashboard.component.scss',
})
export class BureauDashboardComponent implements OnInit {
  private http        = inject(HttpClient);
  private authService = inject(AuthService);

  loading             = signal(true);
  offresActives       = signal(0);
  inscriptionsPending = signal(0);
  cotisationsImpayees = signal(0);
  pendingList         = signal<PendingInscription[]>([]);

  displayName = computed(() => {
    const u = this.authService.currentUser();
    const full = `${u?.prenom ?? ''} ${u?.nom ?? ''}`.trim();
    return full || getDisplayName(u?.email ?? '');
  });

  readonly today = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  }).format(new Date()).replace(/^\w/, c => c.toUpperCase());

  ngOnInit(): void { this.loadData(); }

  loadData(): void {
    this.loading.set(true);

    this.http.get<BureauDashboardData>('/api/bureau/dashboard').subscribe({
      next: data => {
        this.offresActives.set(data.mesOffres?.filter(o => o.statut === 'OUVERTE').length ?? 0);
        this.inscriptionsPending.set(data.totalInscriptionsEnAttente ?? 0);
        this.pendingList.set((data.inscriptionsEnAttente ?? []).slice(0, 5));
        this.cotisationsImpayees.set(data.totalPaiementsEnRetard ?? 0);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  valider(id: number): void {
    this.http.patch(`/api/inscriptions/confirmer/${id}`, {}).subscribe(() => this.loadData());
  }

  formatDate(s: string): string { return formatDate(s); }

  initials(mail: string): string {
    const local = mail?.split('@')[0] ?? '';
    const parts = local.split('.');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return local.slice(0, 2).toUpperCase();
  }
}
