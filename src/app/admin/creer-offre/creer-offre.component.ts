import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

interface Pole { id: number; nom: string; }

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
  private route  = inject(ActivatedRoute);
  private http   = inject(HttpClient);

  readonly isBureauMode = this.router.url.startsWith('/bureau');

  poles           = signal<Pole[]>([]);
  previewUrl      = signal<string | null>(null);
  coverFile       = signal<File | null>(null);

  /* Up to 5 extra gallery images */
  extraFiles    = signal<File[]>([]);
  extraPreviews = signal<string[]>([]);

  showUploadModal = signal(false);
  submitting      = signal(false);
  draftMode       = signal(false);
  successMsg      = signal('');
  errorMsg        = signal('');
  isEditMode      = signal(false);
  originalStatut  = signal<string>('');

  private readonly allTypes = [
    { value: 'VOYAGE',     label: 'Voyage',     color: '#3b82f6' },
    { value: 'SEJOUR',     label: 'Séjour',     color: '#10b981' },
    { value: 'ACTIVITE',   label: 'Activité',   color: '#f59e0b' },
    { value: 'CONVENTION', label: 'Convention', color: '#8b5cf6' },
    { value: 'ANNONCE',    label: 'Annonce',    color: '#ec4899' },
  ] as const;

  userPoleTypesOffre = signal<string[]>([]);
  offreTypes = computed(() => {
    const allowed = this.userPoleTypesOffre();
    return this.allTypes.map(t => ({
      ...t,
      prohibited: this.isBureauMode && allowed.length > 0 && !allowed.includes(t.value),
    }));
  });

  isProhibited(type: string): boolean {
    const allowed = this.userPoleTypesOffre();
    return this.isBureauMode && allowed.length > 0 && !allowed.includes(type);
  }

  readonly paymentModes = [
    { value: 'FULL',       label: 'Comptant — paiement intégral' },
    { value: 'SEMESTRIEL', label: 'Semestriel — 2 versements' },
    { value: 'TIERS',      label: 'Tiers — 3 versements' },
  ];

  form!: FormGroup;

  get typeCtrl(): AbstractControl { return this.form.get('typeOffre')!; }
  get showDateFin(): boolean { const t = this.typeCtrl.value; return t === 'VOYAGE' || t === 'SEJOUR'; }
  get showModePaiement(): boolean { const t = this.typeCtrl.value; return t === 'VOYAGE' || t === 'SEJOUR'; }
  get isConvention(): boolean { const t = this.typeCtrl.value; return t === 'CONVENTION' || t === 'ANNONCE'; }
  get canAddExtra(): boolean { return this.extraFiles().length < 5; }

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
      poleId:          [null],
    });

    this.http.get<Pole[]>('/api/poles').subscribe({
      next: poles => { this.poles.set(poles); this.autoSetPole(this.typeCtrl.value); },
    });

    if (this.isBureauMode) {
      this.http.get<any>('/api/utilisateurs/profil').subscribe({
        next: p => {
          const types: string[] = p.poleTypesOffre ?? [];
          this.userPoleTypesOffre.set(types);
          if (p.poleId) {
            this.form.patchValue({ poleId: p.poleId });
          }
          if (types.length > 0 && !this.typeCtrl.value) {
            this.form.patchValue({ typeOffre: types[0] });
          }
        },
      });
    }

    this.form.get('typeOffre')!.valueChanges.subscribe(type => {
      this.autoSetPole(type);
      const dateCtrl = this.form.get('dateDebut')!;
      if (type === 'CONVENTION' || type === 'ANNONCE') {
        dateCtrl.removeValidators(Validators.required);
      } else {
        dateCtrl.addValidators(Validators.required);
      }
      dateCtrl.updateValueAndValidity({ emitEvent: false });
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) { this.isEditMode.set(true); this.loadOffre(+id); }
  }

  private loadOffre(id: number): void {
    this.http.get<any>(`/api/offres/${id}`).subscribe({
      next: offre => {
        this.originalStatut.set(offre.statutOffre ?? '');
        this.form.patchValue({
          titre: offre.titre, typeOffre: offre.typeOffre, description: offre.description,
          lieu: offre.lieu, dateDebut: offre.dateDebut?.slice(0, 10), dateFin: offre.dateFin?.slice(0, 10),
          prixParPersonne: offre.prixParPersonne, capaciteMax: offre.capaciteMax,
          modePaiement: offre.modePaiement, avantages: offre.avantages,
          lienExterne: offre.lienExterne, poleId: offre.poleId,
        });
        if (offre.imageBase64 && offre.imageType) {
          this.previewUrl.set(`data:${offre.imageType};base64,${offre.imageBase64}`);
        }
        if (offre.imagesSupplementaires?.length) {
          this.extraPreviews.set(
            offre.imagesSupplementaires.map((img: any) => `data:${img.type};base64,${img.base64}`)
          );
        }
      },
    });
  }

  private autoSetPole(_type: string): void {
    // Bureau members use their own pole (set from profile).
    // Admins: backend resolves pole by typeOffre when poleId is null.
  }

  selectedTypeName(): string {
    return this.offreTypes().find(t => t.value === this.typeCtrl.value)?.label ?? '';
  }

  readonly MAX_IMAGE_SIZE = 1_000_000;

  /* Cover image */
  openUploadModal(): void  { this.showUploadModal.set(true); }
  closeUploadModal(): void { this.showUploadModal.set(false); }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
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

  removeImage(): void { this.previewUrl.set(null); this.coverFile.set(null); }
  confirmUpload(): void { this.showUploadModal.set(false); }

  /* Extra gallery images */
  onExtraFilesSelected(event: Event): void {
    const files = Array.from((event.target as HTMLInputElement).files ?? []);
    const remaining = 5 - this.extraFiles().length;
    const toAdd = files.slice(0, remaining);
    this.extraFiles.update(cur => [...cur, ...toAdd]);
    toAdd.forEach(file => {
      const reader = new FileReader();
      reader.onload = e => this.extraPreviews.update(cur => [...cur, e.target?.result as string]);
      reader.readAsDataURL(file);
    });
    (event.target as HTMLInputElement).value = '';
  }

  removeExtra(idx: number): void {
    this.extraFiles.update(f => f.filter((_, i) => i !== idx));
    this.extraPreviews.update(p => p.filter((_, i) => i !== idx));
  }

  cancel(): void {
    const returnUrl = this.router.url.startsWith('/bureau') ? '/bureau/offres' : '/admin/offres';
    this.router.navigate([returnUrl]);
  }

  saveDraft(): void { this.draftMode.set(true); this.submitWithStatus('DRAFT'); }
  submit():    void { this.draftMode.set(false); this.submitWithStatus('OPEN'); }

  private submitWithStatus(statut: 'OPEN' | 'DRAFT'): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.submitting.set(true);
    this.errorMsg.set('');
    this.successMsg.set('');

    const fd = new FormData();
    if (this.coverFile()) fd.append('image', this.coverFile()!);
    this.extraFiles().forEach(f => fd.append('images', f));

    const payload = { ...this.form.value, statut };
    if (!this.showDateFin)      delete payload.dateFin;
    if (!this.showModePaiement) delete payload.modePaiement;
    fd.append('req', new Blob([JSON.stringify(payload)], { type: 'application/json' }));

    const id = this.route.snapshot.paramMap.get('id');
    const req$ = id ? this.http.put(`/api/offres/${id}`, fd) : this.http.post('/api/offres/creer', fd);

    req$.subscribe({
      next: () => {
        this.submitting.set(false);
        // When editing a non-published offer, explicitly publish it
        if (id && statut === 'OPEN' && this.originalStatut() !== 'OPEN') {
          this.http.patch(`/api/offres/publier/${id}`, {}).subscribe();
        }
        this.successMsg.set(id ? 'Offre mise à jour avec succès.' : 'Offre créée avec succès.');
        setTimeout(() => this.cancel(), 1200);
      },
      error: (err) => {
        this.submitting.set(false);
        this.errorMsg.set(err.error?.message ?? 'Une erreur est survenue. Veuillez réessayer.');
      },
    });
  }

  isInvalid(field: string): boolean {
    const c = this.form.get(field)!;
    return c.invalid && (c.dirty || c.touched);
  }
}
