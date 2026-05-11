import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ElectionService } from '../../../../core/services/election.service';
import {
  Election, Candidate, UserSummary, AddCandidateRequest,
  Position, POSITIONS, positionLabel
} from '../../../../core/models/election.model';

@Component({
  selector: 'app-election-candidates',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './election-candidates.component.html',
  styleUrl: './election-candidates.component.scss',
})
export class ElectionCandidatesComponent implements OnInit {
  private route           = inject(ActivatedRoute);
  private router          = inject(Router);
  private electionService = inject(ElectionService);

  electionId = signal(0);
  election   = signal<Election | null>(null);
  users      = signal<UserSummary[]>([]);
  loading    = signal(true);
  toast      = signal<{ msg: string; type: 'success' | 'error' } | null>(null);
  showForm   = signal(false);
  saving     = signal(false);
  formError  = signal('');

  positions = POSITIONS;
  positionLabel = positionLabel;

  form: AddCandidateRequest & { photoFile?: File; photoPreview?: string } = {
    userId: 0,
    position: 'PRESIDENT',
    description: '',
  };

  candidatesByPosition = computed(() => {
    const e = this.election();
    if (!e) return [];
    return this.positions.map(p => ({
      position: p.value,
      label: p.label,
      candidates: e.candidates?.filter(c => c.position === p.value) ?? [],
    }));
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.electionId.set(id);
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.electionService.getElectionById(this.electionId()).subscribe({
      next: e => {
        this.election.set(e);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
    this.electionService.getAvailableUsers().subscribe({
      next: users => this.users.set(users),
    });
  }

  openForm(): void {
    this.form = { userId: 0, position: 'PRESIDENT', description: '' };
    this.formError.set('');
    this.showForm.set(true);
  }

  closeForm(): void { this.showForm.set(false); }

  onPhotoChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (file.size > 1_000_000) { this.formError.set('La photo ne peut pas dépasser 1 Mo'); return; }
    this.form.photoFile = file;
    const reader = new FileReader();
    reader.onload = e => this.form.photoPreview = e.target?.result as string;
    reader.readAsDataURL(file);
  }

  submitForm(): void {
    if (!this.form.userId || this.form.userId === 0) { this.formError.set('Veuillez sélectionner un utilisateur'); return; }
    if (!this.form.position) { this.formError.set('Veuillez sélectionner un poste'); return; }

    this.saving.set(true);
    const req: AddCandidateRequest = {
      userId: this.form.userId,
      position: this.form.position,
      description: this.form.description,
    };

    this.electionService.addCandidate(this.electionId(), req, this.form.photoFile).subscribe({
      next: () => {
        this.saving.set(false);
        this.showForm.set(false);
        this.showToast('Candidat ajouté avec succès.', 'success');
        this.load();
      },
      error: err => {
        this.saving.set(false);
        this.formError.set(err?.error?.message ?? 'Impossible d\'ajouter le candidat');
      },
    });
  }

  removeCandidate(candidateId: number): void {
    this.electionService.removeCandidate(this.electionId(), candidateId).subscribe({
      next:  () => { this.showToast('Candidat retiré.', 'success'); this.load(); },
      error: err => this.showToast(err?.error?.message ?? 'Impossible de retirer ce candidat.', 'error'),
    });
  }

  back(): void { this.router.navigate(['/admin/elections']); }

  userName(userId: number): string {
    const u = this.users().find(x => x.id === userId);
    return u ? `${u.prenom} ${u.nom}` : '';
  }

  private showToast(msg: string, type: 'success' | 'error'): void {
    this.toast.set({ msg, type });
    setTimeout(() => this.toast.set(null), 3500);
  }
}
