import { Component, OnInit, signal, inject } from '@angular/core';
import {
  FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl,
} from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

interface Pole { id: number; nom: string; typeOffre: string; }

@Component({
  selector: 'app-creer-offre',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './creer-offre.component.html',
  styleUrl: './creer-offre.component.scss',
})
export class CreerOffreComponent implements OnInit {
  private fb     = inject(FormBuilder);
  private router = inject(Router);
  private http   = inject(HttpClient);

  poles           = signal<Pole[]>([]);
  previewUrl      = signal<string | null>(null);
  coverFile       = signal<File | null>(null);
  showUploadModal = signal(false);
  submitting      = signal(false);
  draftMode       = signal(false);
  successMsg      = signal('');
  errorMsg        = signal('');

  readonly offreTypes = ['VOYAGE', 'SEJOUR', 'ACTIVITE', 'CONVENTION'] as const;

  readonly paymentModes = [
    { value: 'FULL',       label: 'Comptant (paiement intégral)' },
    { value: 'SEMESTRIEL', label: 'Semestriel (2 versements)' },
    { value: 'TIERS',      label: 'Tiers (3 versements)' },
  ];

  form!: FormGroup;

  get typeCtrl(): AbstractControl { return this.form.get('typeOffre')!; }

  get showDateFin(): boolean {
    const t = this.typeCtrl.value;
    return t === 'VOYAGE' || t === 'SEJOUR';
  }

  get showModePaiement(): boolean {
    return false;
  }

  ngOnInit(): void {
  this.form = this.fb.group({
    titre:           ['', Validators.required],
    typeOffre:       ['', Validators.required],
    description:     [''],
    lieu:            [''],
    dateDebut:       ['', Validators.required],
    dateFin:         [''],
    prixParPersonne: [null, [Validators.min(0)]],
    capaciteMax:     [null, [Validators.min(1)]],
    modePaiement:    [''],
    avantages:       [''],
    lienExterne:     [''],
    poleId: [null]
  });

  this.http.get<Pole[]>('/api/poles').subscribe({
    next: poles => {
      this.poles.set(poles);
      this.autoSetPole(this.typeCtrl.value); // in case type already selected
    },
    error: () => {},
  });

  this.form.get('typeOffre')!.valueChanges.subscribe(type => {
    this.autoSetPole(type);
  });
}

private autoSetPole(type: string): void {
  if (!type || !this.poles().length) return;

  const match = this.poles().find(p => p.typeOffre === type);

  this.form.patchValue({ poleId: match?.id ?? null });
}


  readonly MAX_IMAGE_SIZE = 1_000_000;

  openUploadModal(): void  { this.showUploadModal.set(true);  }
  closeUploadModal(): void { this.showUploadModal.set(false); }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file  = input.files?.[0];
    if (!file) return;
    if (file.size > this.MAX_IMAGE_SIZE) {
      this.errorMsg.set('Image trop volumineuse. La taille maximale est 1 Mo.');
      input.value = '';
      return;
    }
    this.coverFile.set(file);
    const reader = new FileReader();
    reader.onload = e => this.previewUrl.set(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  confirmUpload(): void { this.showUploadModal.set(false); }

  cancel(): void { this.router.navigate(['/admin/offres']); }

  saveDraft(): void {
    this.draftMode.set(true);
    this.submitWithStatus('DRAFT');
  }

  
  submit(): void {
    this.draftMode.set(false);
    this.submitWithStatus('OUVERT');
  }

  private submitWithStatus(statut: 'OUVERT' | 'DRAFT'): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.errorMsg.set('');
    this.successMsg.set('');

    const fd = new FormData();

    if (this.coverFile()) {
      fd.append('image', this.coverFile()!);
    }

    const payload = { ...this.form.value, statut };
    if (!this.showDateFin)      delete payload.dateFin;
    if (!this.showModePaiement) delete payload.modePaiement;

    // Part name 'req' must match @RequestPart("req") in OffreController
    fd.append('req', new Blob([JSON.stringify(payload)], { type: 'application/json' }));

    this.http.post('/api/offres/creer', fd).subscribe({
      next: () => {
        this.submitting.set(false);
        this.successMsg.set('Offre créée avec succès');
        setTimeout(() => this.router.navigate(['/admin/offres']), 1200);
      },
      error: (err) => {
        this.submitting.set(false);
        const msg = err.error?.message ?? err.error ?? null;
        this.errorMsg.set(msg ?? 'Une erreur est survenue. Veuillez réessayer.');
      },
    });
  }

  isInvalid(field: string): boolean {
    const c = this.form.get(field)!;
    return c.invalid && (c.dirty || c.touched);
  }
}
