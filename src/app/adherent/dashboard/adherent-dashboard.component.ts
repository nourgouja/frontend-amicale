import { Component, OnInit, signal, inject, computed, ViewChild, ElementRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError, switchMap, of } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { getDisplayName } from '../../shared/utils/format.utils';
import { ElectionCallService } from '../../core/services/election-call.service';
import { ElectionCall, CandidateApplication } from '../../core/models/election-call.model';
import { SondageService } from '../../core/services/sondage.service';
import { Sondage } from '../../core/models/sondage.model';

interface Offre {
  id: number; titre: string; description: string; typeOffre: string;
  lieu: string; dateDebut: string; dateFin: string; prixParPersonne: number;
  imageBase64: string | null; imageType: string | null; statutOffre: string;
}

interface MembreBureau {
  id: number; nom: string; prenom: string; poste: string | null; poleNom: string | null;
  photoBase64?: string | null; photoType?: string | null;
}

const TYPE_LABELS: Record<string, string> = {
  VOYAGE: 'Voyage', SEJOUR: 'Séjour', ACTIVITE: 'Activité',
  CONVENTION: 'Convention', EVENEMENT: 'Événement',
};

const POSTE_ORDER: Record<string, number> = {
  PRESIDENT: 0, SECRETARY: 1, TREASURER: 2,
  RESPONSABLE_POLE_VOYAGE_SEJOURS: 3,
  RESPONSABLE_POLE_ACTIVITES_LOISIRS: 4,
  RESPONSABLE_POLE_EVENEMENTS_CONVENTIONS: 5,
  RESPONSABLE_POLE: 6, MEMBER: 7,
};

@Component({
  selector: 'app-adherent-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, DatePipe],
  templateUrl: './adherent-dashboard.component.html',
  styleUrl: './adherent-dashboard.component.scss',
})
export class AdherentDashboardComponent implements OnInit {
  private http                = inject(HttpClient);
  private authService         = inject(AuthService);
  private electionCallService = inject(ElectionCallService);
  private sondageService      = inject(SondageService);

  offres           = signal<Offre[]>([]);
  membres          = signal<MembreBureau[]>([]);
  activeFilter     = signal('');
  loading          = signal(true);
  activeCall       = signal<ElectionCall | null>(null);
  myApplication    = signal<CandidateApplication | null>(null);
  sondages         = signal<Sondage[]>([]);
  sondagePanelOpen = signal(false);
  sondageToast     = signal<string | null>(null);
  dismissedIds     = signal<Set<number>>(this.loadDismissed());

  // OPEN sondage always shown; CLOSED only for 4 days and not dismissed
  activeSondage = computed(() => {
    const dismissed = this.dismissedIds();
    return (
      this.sondages().find(s => s.statut === 'OPEN' && !dismissed.has(s.id)) ??
      this.sondages().find(s => s.statut === 'CLOSED' && !dismissed.has(s.id) && this.withinDays(s.closedAt, 4)) ??
      null
    );
  });

  private withinDays(dateStr: string | undefined, days: number): boolean {
    if (!dateStr) return false;
    const diff = Date.now() - new Date(dateStr).getTime();
    return diff >= 0 && diff <= days * 24 * 60 * 60 * 1000;
  }

  private loadDismissed(): Set<number> {
    try {
      const raw = localStorage.getItem('dismissed_sondages');
      return new Set(raw ? JSON.parse(raw) : []);
    } catch { return new Set(); }
  }

  dismissSondage(id: number, e: MouseEvent): void {
    e.stopPropagation();
    const next = new Set(this.dismissedIds());
    next.add(id);
    this.dismissedIds.set(next);
    try { localStorage.setItem('dismissed_sondages', JSON.stringify([...next])); } catch {}
  }

  @ViewChild('conventionsCarousel') conventionsCarousel!: ElementRef<HTMLElement>;
  @ViewChild('membresCarousel') membresCarousel!: ElementRef<HTMLElement>;

  scrollConventions(dir: -1 | 1): void {
    const el = this.conventionsCarousel?.nativeElement;
    if (el) el.scrollBy({ left: dir * 496, behavior: 'smooth' });
  }

  scrollMembres(dir: -1 | 1): void {
    const el = this.membresCarousel?.nativeElement;
    if (el) el.scrollBy({ left: dir * 180, behavior: 'smooth' });
  }

  isBureau = computed(() => this.authService.isBureau());

  displayName = computed(() => {
    const u = this.authService.currentUser();
    const full = `${u?.prenom ?? ''} ${u?.nom ?? ''}`.trim();
    return full || getDisplayName(u?.email ?? '');
  });

  readonly filters = [
    { value: '', label: 'Tout' },
    { value: 'VOYAGE',    label: 'Voyage' },
    { value: 'SEJOUR',    label: 'Séjour' },
    { value: 'ACTIVITE',  label: 'Activité' },
    { value: 'EVENEMENT', label: 'Événement' },
  ];

  allActivites = computed(() =>
    this.offres().filter(o => o.typeOffre !== 'CONVENTION')
  );

  filteredActivites = computed(() => {
    const type = this.activeFilter();
    const list = this.allActivites();
    return type ? list.filter(o => o.typeOffre === type) : list;
  });

  recentActivites = computed(() => this.filteredActivites().slice(0, 6));

  allConventions = computed(() => this.offres().filter(o => o.typeOffre === 'CONVENTION'));
  conventions    = computed(() => this.allConventions());

  sortedMembres = computed(() =>
    [...this.membres()].sort((a, b) =>
      (POSTE_ORDER[a.poste ?? ''] ?? 99) - (POSTE_ORDER[b.poste ?? ''] ?? 99)
    )
  );

  ngOnInit(): void {
    this.http.get<Offre[]>('/api/offres/publiques').pipe(
      catchError(() => this.http.get<Offre[]>('/api/offres'))
    ).subscribe({
      next: list => { this.offres.set(list); this.loading.set(false); },
      error: ()  => this.loading.set(false),
    });

    this.http.get<MembreBureau[]>('/api/utilisateurs/membres-bureau').subscribe({
      next: list => this.membres.set(list),
      error: ()  => {},
    });

    this.electionCallService.getActiveCall().pipe(
      switchMap(call => {
        this.activeCall.set(call);
        return call ? this.electionCallService.getMyApplication(call.id) : of(null);
      })
    ).subscribe({
      next: app => this.myApplication.set(app),
      error: ()  => {},
    });

    this.sondageService.getActiveSondages().subscribe({
      next: list => {
        this.sondages.set(list);
        // auto-expand results if sondage just closed (within 4 days)
        const featured = this.activeSondage();
        if (featured?.statut === 'CLOSED' && this.withinDays(featured.closedAt, 4)) {
          this.sondagePanelOpen.set(true);
        }
      },
      error: () => {},
    });
  }

  openSondagePanel(): void      { this.sondagePanelOpen.set(true); }
  closeSondagePanel(): void     { this.sondagePanelOpen.set(false); }
  toggleSondageDropdown(): void { this.sondagePanelOpen.update(v => !v); }

  vote(sondageId: number, optionId: number): void {
    this.sondageService.vote(sondageId, optionId).subscribe({
      next: updated => {
        this.sondages.update(list => list.map(s => s.id === sondageId ? updated : s));
        this.sondagePanelOpen.set(true); // keep dropdown open to show confirmation
        this.sondageToast.set('Vote enregistré !');
        setTimeout(() => this.sondageToast.set(null), 3000);
      },
      error: err => {
        this.sondageToast.set(err?.error?.message ?? 'Impossible de voter.');
        setTimeout(() => this.sondageToast.set(null), 3000);
      },
    });
  }

  totalVotes(s: Sondage): number {
    return s.options?.reduce((sum, o) => sum + (o.voteCount ?? 0), 0) ?? 0;
  }

  optionPercent(voteCount: number, total: number): number {
    return total === 0 ? 0 : Math.round((voteCount / total) * 100);
  }

  isWinner(opt: { id: number; voteCount: number }, s: Sondage): boolean {
    const counts = s.options?.map(o => o.voteCount ?? 0) ?? [];
    const max = counts.length > 0 ? Math.max(...counts) : 0;
    return max > 0 && (opt.voteCount ?? 0) === max;
  }

  setFilter(value: string): void { this.activeFilter.set(value); }

  optionImageUrl(opt: { imageBase64?: string; imageType?: string }): string | null {
    return opt.imageBase64 && opt.imageType ? `data:${opt.imageType};base64,${opt.imageBase64}` : null;
  }

  coverUrl(o: Offre): string | null {
    return o.imageBase64 && o.imageType ? `data:${o.imageType};base64,${o.imageBase64}` : null;
  }

  memberPhotoUrl(m: MembreBureau): string | null {
    return m.photoBase64 && m.photoType ? `data:${m.photoType};base64,${m.photoBase64}` : null;
  }

  typeLabel(type: string): string { return TYPE_LABELS[type] ?? type; }

  initiales(m: MembreBureau): string {
    return ((m.prenom?.[0] ?? '') + (m.nom?.[0] ?? '')).toUpperCase();
  }

  posteLabel(poste: string | null): string {
    const map: Record<string, string> = {
      PRESIDENT:                              'Président',
      SECRETARY:                              'Secrétaire',
      TREASURER:                              'Trésorier',
      RESPONSABLE_POLE_VOYAGE_SEJOURS:        'Responsable de Pôle',
      RESPONSABLE_POLE_ACTIVITES_LOISIRS:     'Responsable de Pôle',
      RESPONSABLE_POLE_EVENEMENTS_CONVENTIONS: 'Responsable de Pôle',
      RESPONSABLE_POLE:                       'Responsable de Pôle',
      MEMBER:                                 'Membre',
    };
    return poste ? (map[poste] ?? poste) : '—';
  }
}
