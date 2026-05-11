import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ElectionService } from '../../../../core/services/election.service';
import { Election, positionLabel } from '../../../../core/models/election.model';

@Component({
  selector: 'app-election-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './election-list.component.html',
  styleUrl: './election-list.component.scss',
})
export class ElectionListComponent implements OnInit {
  private electionService = inject(ElectionService);
  private router          = inject(Router);

  activeElections = signal<Election[]>([]);
  closedElections = signal<Election[]>([]);
  loading         = signal(true);
  toast           = signal<{ msg: string; type: 'success' | 'error' } | null>(null);
  positionLabel = positionLabel;

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    let done = 0;
    const check = () => { if (++done === 2) this.loading.set(false); };

    this.electionService.getActiveElections().subscribe({
      next: res => { this.activeElections.set(res); check(); },
      error: () => check(),
    });
    this.electionService.getClosedElections().subscribe({
      next: res => { this.closedElections.set(res); check(); },
      error: () => check(),
    });
  }

  private get base(): string {
    return this.router.url.startsWith('/admin') ? '/admin'
         : this.router.url.startsWith('/bureau') ? '/bureau'
         : '/adherent';
  }

  goVote(id: number): void    { this.router.navigate([`${this.base}/elections`, id]); }
  goResults(id: number): void { this.router.navigate([`${this.base}/elections`, id, 'resultats']); }

  statusLabel(status: string): string {
    return status === 'ACTIVE' ? 'Vote en cours' : 'Clôturée';
  }

  totalCandidates(e: Election): number {
    return e.candidates?.length ?? 0;
  }

  private showToast(msg: string, type: 'success' | 'error'): void {
    this.toast.set({ msg, type });
    setTimeout(() => this.toast.set(null), 3500);
  }
}
