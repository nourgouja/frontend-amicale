import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ElectionCallService } from '../../../../core/services/election-call.service';
import { AuthService } from '../../../../core/services/auth.service';
import { CandidateApplication, ElectionCall } from '../../../../core/models/election-call.model';
import { POSITIONS } from '../../../../core/models/election.model';

@Component({
  selector: 'app-election-apply',
  standalone: true,
  imports: [CommonModule, DatePipe, ReactiveFormsModule],
  templateUrl: './election-apply.component.html',
  styleUrl: './election-apply.component.scss',
})
export class ElectionApplyComponent implements OnInit {
  private callService  = inject(ElectionCallService);
  private authService  = inject(AuthService);
  private route        = inject(ActivatedRoute);
  private router       = inject(Router);
  private fb           = inject(FormBuilder);

  call          = signal<ElectionCall | null>(null);
  myApplication = signal<CandidateApplication | null>(null);
  loading       = signal(true);
  loadError     = signal('');
  submitting    = signal(false);
  toast         = signal<{ msg: string; type: 'success' | 'error' } | null>(null);
  photoFile    = signal<File | null>(null);
  photoPreview = signal<string | null>(null);
  photoError   = signal('');

  readonly positions = POSITIONS;

  isResponsablePole = computed(() => false);

  form = this.fb.group({
    position:   ['', Validators.required],
    poleNom:    [''],
    motivation: ['', [Validators.required, Validators.minLength(20)]],
  });

  get currentUser() { return this.authService.currentUser(); }

  get callId(): number {
    return Number(this.route.snapshot.paramMap.get('id'));
  }

  ngOnInit(): void {
    this.callService.getActiveCall().subscribe({
      next: activeCall => {
        if (!activeCall) {
          this.loadError.set("Aucun appel à candidature actif.");
          this.loading.set(false);
          return;
        }
        this.call.set(activeCall);
        this.callService.getMyApplication(activeCall.id).subscribe({
          next: app => { this.myApplication.set(app); this.loading.set(false); },
          error: () => this.loading.set(false),
        });
      },
      error: () => {
        this.loadError.set("Impossible de charger l'appel à candidature.");
        this.loading.set(false);
      },
    });
  }

  onPhotoChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file  = input.files?.[0];
    this.photoError.set('');
    if (!file) return;
    if (file.size > 5_000_000) {
      this.photoError.set('La photo ne peut pas dépasser 5 Mo');
      input.value = '';
      return;
    }
    this.photoFile.set(file);
    const reader = new FileReader();
    reader.onload = e => this.photoPreview.set(e.target?.result as string);
    reader.readAsDataURL(file);
    input.value = '';
  }

  removePhoto(): void {
    this.photoFile.set(null);
    this.photoPreview.set(null);
  }

  submit(): void {
    if (this.form.invalid || this.submitting()) return;
    if (this.isResponsablePole() && !this.form.value.poleNom) {
      this.showToast('Veuillez sélectionner un pôle', 'error');
      return;
    }
    if (!this.photoFile()) {
      this.photoError.set('La photo est obligatoire');
      return;
    }

    this.submitting.set(true);
    const req = {
      position:   this.form.value.position as any,
      poleNom:    this.isResponsablePole() ? (this.form.value.poleNom ?? undefined) : undefined,
      motivation: this.form.value.motivation!.trim(),
    };

    this.callService.apply(this.call()!.id, req, this.photoFile()!).subscribe({
      next: app => {
        this.myApplication.set(app);
        this.submitting.set(false);
        this.showToast('Candidature soumise avec succès !', 'success');
      },
      error: err => {
        this.submitting.set(false);
        this.showToast(err?.error?.message ?? 'Impossible de soumettre la candidature', 'error');
      },
    });
  }

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c && c.invalid && c.touched);
  }

  back(): void {
    if (this.router.url.startsWith('/adherent')) {
      this.router.navigate(['/adherent/elections']);
    } else {
      this.router.navigate(['/bureau/elections']);
    }
  }

  statusLabel(s: string): string {
    return s === 'PENDING' ? 'En attente de révision' : s === 'APPROVED' ? 'Acceptée' : 'Refusée';
  }

  private showToast(msg: string, type: 'success' | 'error'): void {
    this.toast.set({ msg, type });
    setTimeout(() => this.toast.set(null), 4000);
  }
}
