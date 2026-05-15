import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ElectionCallService } from '../../../../core/services/election-call.service';
import { CandidateApplication, ElectionCall } from '../../../../core/models/election-call.model';
import { POSITIONS, positionLabel, Position } from '../../../../core/models/election.model';

@Component({
  selector: 'app-election-call-review',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './election-call-review.component.html',
  styleUrl: './election-call-review.component.scss',
})
export class ElectionCallReviewComponent implements OnInit {
  private callService = inject(ElectionCallService);
  private route       = inject(ActivatedRoute);
  private router      = inject(Router);

  call         = signal<ElectionCall | null>(null);
  applications = signal<CandidateApplication[]>([]);
  loading      = signal(true);
  publishing   = signal(false);
  toast        = signal<{ msg: string; type: 'success' | 'error' } | null>(null);
  processing   = signal<Set<number>>(new Set());

  positionLabel = positionLabel;
  readonly positions = POSITIONS;

  byPosition = computed(() => {
    const apps = this.applications();
    return this.positions.map(p => ({
      position: p.value,
      label:    p.label,
      apps:     apps.filter(a => a.position === p.value),
    }));
  });

  canPublish = computed(() => {
    const apps = this.applications();
    const accepted = apps.filter(a => a.status === 'ACCEPTED');
    const positions = new Set(accepted.map(a => a.position));
    return positions.size === 3 && this.call()?.publishedElectionId == null;
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.callService.getApplications(id).subscribe({
      next: apps => { this.applications.set(apps); this.loading.set(false); },
      error: () => { this.loading.set(false); this.back(); },
    });
    this.callService.getAllCalls().subscribe({
      next: calls => {
        const found = calls.find(c => c.id === id) ?? null;
        this.call.set(found);
      },
    });
  }

  accept(app: CandidateApplication): void {
    if (this.isProcessing(app.id)) return;
    this.setProcessing(app.id, true);
    this.callService.acceptApplication(app.callId, app.id).subscribe({
      next: updated => {
        this.applications.update(list => list.map(a => a.id === updated.id ? updated : a));
        this.setProcessing(app.id, false);
      },
      error: err => {
        this.setProcessing(app.id, false);
        this.showToast(err?.error?.message ?? 'Erreur', 'error');
      },
    });
  }

  reject(app: CandidateApplication): void {
    if (this.isProcessing(app.id)) return;
    this.setProcessing(app.id, true);
    this.callService.rejectApplication(app.callId, app.id).subscribe({
      next: updated => {
        this.applications.update(list => list.map(a => a.id === updated.id ? updated : a));
        this.setProcessing(app.id, false);
      },
      error: err => {
        this.setProcessing(app.id, false);
        this.showToast(err?.error?.message ?? 'Erreur', 'error');
      },
    });
  }

  publish(): void {
    const callId = this.call()?.id;
    if (!callId || !this.canPublish() || this.publishing()) return;
    if (!confirm('Publier l\'élection ? Les membres pourront voter immédiatement.')) return;

    this.publishing.set(true);
    this.callService.publishElection(callId).subscribe({
      next: election => {
        this.showToast('Élection publiée ! Les membres peuvent voter.', 'success');
        this.publishing.set(false);
        setTimeout(() => this.router.navigate(['/admin/elections']), 1800);
      },
      error: err => {
        this.publishing.set(false);
        this.showToast(err?.error?.message ?? 'Impossible de publier', 'error');
      },
    });
  }

  back(): void { this.router.navigate(['/admin/elections']); }

  isProcessing(id: number): boolean { return this.processing().has(id); }

  private setProcessing(id: number, val: boolean): void {
    this.processing.update(s => {
      const next = new Set(s);
      val ? next.add(id) : next.delete(id);
      return next;
    });
  }

  private showToast(msg: string, type: 'success' | 'error'): void {
    this.toast.set({ msg, type });
    setTimeout(() => this.toast.set(null), 3500);
  }
}
