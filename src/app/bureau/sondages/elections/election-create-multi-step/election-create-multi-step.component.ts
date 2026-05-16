import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { from, switchMap, of } from 'rxjs';
import { map, startWith, concatMap, toArray } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { ElectionService } from '../../../../core/services/election.service';
import { UserSummary, Position, POSITIONS, AddCandidateRequest } from '../../../../core/models/election.model';

interface CandidateEntry {
  userId: number;
  displayName: string;
  description: string;
  file: File | null;
  previewUrl: string | null;
}

type CandidateMap = Record<Position, CandidateEntry[]>;

@Component({
  selector: 'app-election-create-multi-step',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './election-create-multi-step.component.html',
  styleUrl: './election-create-multi-step.component.scss',
})
export class ElectionCreateMultiStepComponent implements OnInit {
  private fb              = inject(FormBuilder);
  private router          = inject(Router);
  private electionService = inject(ElectionService);

  currentStep  = signal(0);
  users        = signal<UserSummary[]>([]);
  submitting   = signal(false);
  toast        = signal<{ msg: string; type: 'success' | 'error' } | null>(null);
  addFormError = signal('');

  electionForm = this.fb.group({
    titre:       ['', [Validators.required, Validators.minLength(3)]],
    description: [''],
  });

  private formValid = toSignal(
    this.electionForm.statusChanges.pipe(
      map(s => s === 'VALID'),
      startWith(this.electionForm.valid)
    ),
    { initialValue: this.electionForm.valid }
  );

  candidates = signal<CandidateMap>({
    PRESIDENT:        [],
    VICE_PRESIDENT:   [],
    SECRETARY:        [],
    TREASURER:        [],
    RESPONSABLE_POLE: [],
    MEMBER:           [],
  });

  addForm = {
    userId:     0,
    description: '',
    file:       null as File | null,
    previewUrl: null as string | null,
  };

  readonly positions = POSITIONS;

  readonly steps = [
    { title: 'Informations',                        description: 'Titre et description de l\'élection' },
    { title: 'Candidats — Président',               description: 'Ajoutez un ou plusieurs candidats pour le poste de Président' },
    { title: 'Candidats — Vice-Président',          description: 'Ajoutez un ou plusieurs candidats pour le poste de Vice-Président' },
    { title: 'Candidats — Secrétaire',              description: 'Ajoutez un ou plusieurs candidats pour le poste de Secrétaire' },
    { title: 'Candidats — Trésorier',               description: 'Ajoutez un ou plusieurs candidats pour le poste de Trésorier' },
    { title: 'Candidats — Responsable de Pôle',    description: 'Ajoutez un ou plusieurs candidats pour le poste de Responsable de Pôle' },
    { title: 'Candidats — Membre',                  description: 'Ajoutez un ou plusieurs candidats pour le poste de Membre' },
  ];

  stepTitle       = computed(() => this.steps[this.currentStep()]?.title ?? '');
  stepDescription = computed(() => this.steps[this.currentStep()]?.description ?? '');

  currentPosition = computed((): Position => this.positions[this.currentStep() - 1]?.value ?? 'PRESIDENT');

  currentCandidates = computed(() =>
    this.currentStep() === 0 ? [] : this.candidates()[this.currentPosition()]
  );

  canProceed = computed(() => {
    if (this.currentStep() === 0) return this.formValid();
    return this.currentCandidates().length > 0;
  });

  ngOnInit(): void {
    this.electionService.getAvailableUsers().subscribe({
      next: users => this.users.set(users),
    });
  }

  nextStep(): void {
    if (this.currentStep() === 0 && this.electionForm.invalid) {
      this.electionForm.markAllAsTouched();
      return;
    }
    if (this.currentStep() < 3) this.currentStep.update(s => s + 1);
  }

  previousStep(): void {
    if (this.currentStep() > 0) this.currentStep.update(s => s - 1);
  }

  addCandidate(): void {
    this.addFormError.set('');
    if (!this.addForm.userId || +this.addForm.userId === 0) {
      this.addFormError.set('Veuillez sélectionner un utilisateur'); return;
    }
    if (!this.addForm.description.trim()) {
      this.addFormError.set('La description est obligatoire'); return;
    }
    if (!this.addForm.file) {
      this.addFormError.set('La photo est obligatoire'); return;
    }

    const user = this.users().find(u => u.id === +this.addForm.userId);
    const entry: CandidateEntry = {
      userId:      +this.addForm.userId,
      displayName: user ? `${user.prenom} ${user.nom}` : '',
      description: this.addForm.description.trim(),
      file:        this.addForm.file,
      previewUrl:  this.addForm.previewUrl,
    };

    const pos = this.currentPosition();
    this.candidates.update(m => ({ ...m, [pos]: [...m[pos], entry] }));
    this.resetAddForm();
  }

  removeCandidate(index: number): void {
    const pos = this.currentPosition();
    this.candidates.update(m => ({ ...m, [pos]: m[pos].filter((_, i) => i !== index) }));
  }

  onPhotoChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file  = input.files?.[0];
    if (!file) return;
    if (file.size > 5_000_000) {
      this.addFormError.set('La photo ne peut pas dépasser 5 Mo');
      input.value = '';
      return;
    }
    this.addForm.file = file;
    const reader = new FileReader();
    reader.onload = e => { this.addForm.previewUrl = e.target?.result as string; };
    reader.readAsDataURL(file);
    input.value = ''; // allow re-selecting the same file for the next candidate
  }

  removePhoto(fileInput: HTMLInputElement): void {
    this.addForm.file = null;
    this.addForm.previewUrl = null;
    fileInput.value = '';
  }

  submitElection(): void {
    if (this.submitting()) return;
    const map = this.candidates();
    if (!this.positions.every(p => map[p.value].length > 0)) {
      this.showToast('Chaque poste doit avoir au moins un candidat', 'error'); return;
    }

    this.submitting.set(true);
    const titre      = this.electionForm.value.titre as string;
    const description = this.electionForm.value.description ?? undefined;

    this.electionService.createElection({ titre, description }).pipe(
      switchMap(election => {
        const calls = this.positions.flatMap(p =>
          map[p.value].map(c => {
            const req: AddCandidateRequest = { userId: c.userId, position: p.value, description: c.description };
            return this.electionService.addCandidate(election.id, req, c.file ?? undefined);
          })
        );
        return calls.length ? from(calls).pipe(concatMap(c => c), toArray()) : of([]);
      })
    ).subscribe({
      next: () => {
        this.showToast('Élection créée avec succès !', 'success');
        const base = this.router.url.startsWith('/admin') ? '/admin' : '/bureau';
        setTimeout(() => this.router.navigate([`${base}/elections`]), 1500);
      },
      error: err => {
        this.submitting.set(false);
        this.showToast(err?.error?.message ?? 'Impossible de créer l\'élection', 'error');
      },
    });
  }

  isInvalid(field: string): boolean {
    const c = this.electionForm.get(field);
    return !!(c && c.invalid && c.touched);
  }

  back(): void {
    const base = this.router.url.startsWith('/admin') ? '/admin' : '/bureau';
    this.router.navigate([`${base}/elections`]);
  }

  private resetAddForm(): void {
    this.addForm = { userId: 0, description: '', file: null, previewUrl: null };
    this.addFormError.set('');
  }

  private showToast(msg: string, type: 'success' | 'error'): void {
    this.toast.set({ msg, type });
    setTimeout(() => this.toast.set(null), 3500);
  }
}
