import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ElectionService } from '../../../../core/services/election.service';
import { ElectionCallService } from '../../../../core/services/election-call.service';
import { Election, positionLabel } from '../../../../core/models/election.model';
import { CandidateApplication, ElectionCall, APPLICATION_STATUS_LABELS } from '../../../../core/models/election-call.model';

@Component({
  selector: 'app-election-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './election-list.component.html',
  styleUrl: './election-list.component.scss',
})
export class ElectionListComponent implements OnInit {
  private electionService = inject(ElectionService);
  private callService     = inject(ElectionCallService);
  private router          = inject(Router);

  activeElections = signal<Election[]>([]);
  closedElections = signal<Election[]>([]);
  activeCall      = signal<ElectionCall | null>(null);
  myApplication   = signal<CandidateApplication | null>(null);
  loading         = signal(true);
  deleting        = signal<number | null>(null);
  toast           = signal<{ msg: string; type: 'success' | 'error' } | null>(null);
  positionLabel   = positionLabel;
  appStatusLabels = APPLICATION_STATUS_LABELS;

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    let done = 0;
    const check = () => { if (++done === 3) this.loading.set(false); };

    this.electionService.getActiveElections().subscribe({
      next: res => { this.activeElections.set(res); check(); },
      error: () => check(),
    });
    this.electionService.getClosedElections().subscribe({
      next: res => { this.closedElections.set(res); check(); },
      error: () => check(),
    });
    this.callService.getActiveCall().subscribe({
      next: call => {
        this.activeCall.set(call);
        if (call) {
          this.callService.getMyApplication(call.id).subscribe({
            next: app => { this.myApplication.set(app); check(); },
            error: () => check(),
          });
        } else {
          check();
        }
      },
      error: () => check(),
    });
  }

  goApply(): void {
    const call = this.activeCall();
    if (!call) return;
    this.router.navigate([`${this.base}/elections/apply`, call.id]);
  }

  private get base(): string {
    return this.router.url.startsWith('/admin') ? '/admin'
         : this.router.url.startsWith('/bureau') ? '/bureau'
         : '/adherent';
  }

  get isAdmin(): boolean { return this.router.url.startsWith('/admin'); }

  goVote(id: number): void    { this.router.navigate([`${this.base}/elections`, id]); }
  goResults(id: number): void { this.router.navigate([`${this.base}/elections`, id, 'resultats']); }

  deleteElection(id: number): void {
    if (this.deleting() !== null) return;
    if (!confirm('Supprimer cette élection ? Cette action est irréversible.')) return;
    this.deleting.set(id);
    this.electionService.deleteElection(id).subscribe({
      next: () => {
        this.closedElections.update(list => list.filter(e => e.id !== id));
        this.deleting.set(null);
        this.showToast('Élection supprimée.', 'success');
      },
      error: err => {
        this.deleting.set(null);
        this.showToast(err?.error?.message ?? 'Impossible de supprimer cette élection.', 'error');
      },
    });
  }

  statusLabel(status: string): string {
    return status === 'OPEN' ? 'Vote en cours' : 'Clôturée';
  }

  totalCandidates(e: Election): number {
    return e.totalCandidatesCount ?? e.candidates?.length ?? 0;
  }

  private showToast(msg: string, type: 'success' | 'error'): void {
    this.toast.set({ msg, type });
    setTimeout(() => this.toast.set(null), 3500);
  }
}
