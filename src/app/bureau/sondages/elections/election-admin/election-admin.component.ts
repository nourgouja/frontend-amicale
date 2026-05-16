import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ElectionService } from '../../../../core/services/election.service';
import { Election } from '../../../../core/models/election.model';

@Component({
  selector: 'app-election-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './election-admin.component.html',
  styleUrl: './election-admin.component.scss',
})
export class ElectionAdminComponent implements OnInit {
  private electionService = inject(ElectionService);
  private router          = inject(Router);

  elections = signal<Election[]>([]);
  loading   = signal(true);
  toast     = signal<{ msg: string; type: 'success' | 'error' } | null>(null);

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.electionService.getAllElections().subscribe({
      next:  res => { this.elections.set(res); this.loading.set(false); },
      error: ()  => this.loading.set(false),
    });
  }

  goToCreate(): void { this.router.navigate(['/admin/elections/create']); }

  openElection(id: number): void {
    this.electionService.openElection(id).subscribe({
      next:  () => { this.showToast('Élection ouverte au vote.', 'success'); this.load(); },
      error: err => this.showToast(err?.error?.message ?? 'Impossible d\'ouvrir l\'élection.', 'error'),
    });
  }

  closeElection(id: number): void {
    this.electionService.closeElection(id).subscribe({
      next:  () => { this.showToast('Élection clôturée.', 'success'); this.load(); },
      error: err => this.showToast(err?.error?.message ?? 'Impossible de clôturer l\'élection.', 'error'),
    });
  }

  deleteElection(id: number): void {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce brouillon ? Cette action est irréversible.')) return;
    this.electionService.deleteElection(id).subscribe({
      next:  () => { this.showToast('Brouillon supprimé.', 'success'); this.load(); },
      error: err => this.showToast(err?.error?.message ?? 'Impossible de supprimer cette élection.', 'error'),
    });
  }

  manageCandidates(id: number): void {
    this.router.navigate(['/admin/elections', id, 'candidats']);
  }

  viewResults(id: number): void {
    this.router.navigate(['/admin/elections', id, 'resultats']);
  }

  statusLabel(status: string): string {
    return status === 'DRAFT' ? 'Brouillon' : status === 'OPEN' ? 'Active' : 'Clôturée';
  }

  private showToast(msg: string, type: 'success' | 'error'): void {
    this.toast.set({ msg, type });
    setTimeout(() => this.toast.set(null), 3500);
  }
}
