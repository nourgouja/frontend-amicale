import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ElectionCallService } from '../../../../core/services/election-call.service';
import { ElectionService } from '../../../../core/services/election.service';
import { ElectionCall } from '../../../../core/models/election-call.model';

@Component({
  selector: 'app-election-call-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePipe],
  templateUrl: './election-call-admin.component.html',
  styleUrl: './election-call-admin.component.scss',
})
export class ElectionCallAdminComponent implements OnInit {
  private callService     = inject(ElectionCallService);
  private electionService = inject(ElectionService);
  private router          = inject(Router);
  private fb              = inject(FormBuilder);

  calls      = signal<ElectionCall[]>([]);
  loading    = signal(true);
  showForm   = signal(false);
  saving     = signal(false);
  deletingCall = signal<number | null>(null);
  toast      = signal<{ msg: string; type: 'success' | 'error' } | null>(null);

  form = this.fb.group({
    title:       ['', [Validators.required, Validators.minLength(3)]],
    description: [''],
    deadline:    [''],
  });

  ngOnInit(): void { this.load(); }

  private load(): void {
    this.loading.set(true);
    this.callService.getAllCalls().subscribe({
      next:  calls => { this.calls.set(calls); this.loading.set(false); },
      error: ()    => this.loading.set(false),
    });
  }

  openForm(): void  { this.form.reset(); this.showForm.set(true); }
  closeForm(): void { this.showForm.set(false); }

  submit(): void {
    if (this.form.invalid || this.saving()) return;
    this.saving.set(true);

    const { title, description, deadline } = this.form.value;
    const req: any = { title: title!.trim(), description: description?.trim() || undefined };
    if (deadline) req.deadline = new Date(deadline).toISOString();

    this.callService.createCall(req).subscribe({
      next: call => {
        this.calls.update(list => [call, ...list]);
        this.showForm.set(false);
        this.saving.set(false);
        this.showToast('Appel à candidature créé !', 'success');
      },
      error: err => {
        this.saving.set(false);
        this.showToast(err?.error?.message ?? 'Erreur lors de la création', 'error');
      },
    });
  }

  closeCall(call: ElectionCall): void {
    if (!confirm(`Clôturer l'appel "${call.title}" ? Les membres ne pourront plus postuler.`)) return;
    this.callService.closeCall(call.id).subscribe({
      next: updated => {
        this.calls.update(list => list.map(c => c.id === updated.id ? updated : c));
        this.showToast('Appel clôturé', 'success');
      },
      error: err => this.showToast(err?.error?.message ?? 'Erreur', 'error'),
    });
  }

  goToReview(call: ElectionCall): void {
    this.router.navigate(['/admin/elections/review', call.id]);
  }

  closeElection(call: ElectionCall): void {
    if (!call.publishedElectionId) return;
    if (!confirm(`Clôturer le vote pour "${call.title}" ? Les résultats seront disponibles.`)) return;
    this.electionService.closeElection(call.publishedElectionId).subscribe({
      next: () => {
        this.calls.update(list => list.map(c =>
          c.id === call.id ? { ...c, publishedElectionStatus: 'CLOSED' } : c
        ));
        this.showToast('Vote clôturé — les résultats sont disponibles', 'success');
      },
      error: err => this.showToast(err?.error?.message ?? 'Erreur', 'error'),
    });
  }

  goToResults(call: ElectionCall): void {
    if (!call.publishedElectionId) return;
    this.router.navigate(['/admin/elections', call.publishedElectionId, 'resultats']);
  }

  deleteCall(call: ElectionCall): void {
    if (this.deletingCall() !== null) return;
    if (!confirm(`Supprimer l'appel à candidature "${call.title}" ? Cette action est irréversible.`)) return;
    this.deletingCall.set(call.id);
    this.callService.deleteCall(call.id).subscribe({
      next: () => {
        this.calls.update(list => list.filter(c => c.id !== call.id));
        this.deletingCall.set(null);
        this.showToast('Appel à candidature supprimé.', 'success');
      },
      error: err => {
        this.deletingCall.set(null);
        this.showToast(err?.error?.message ?? 'Impossible de supprimer cet appel.', 'error');
      },
    });
  }

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c && c.invalid && c.touched);
  }

  private showToast(msg: string, type: 'success' | 'error'): void {
    this.toast.set({ msg, type });
    setTimeout(() => this.toast.set(null), 3500);
  }
}
