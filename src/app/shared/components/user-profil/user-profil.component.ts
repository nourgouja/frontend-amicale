import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { getInitials } from '../../utils/format.utils';

interface UserProfil {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  telephone?: string;
  matriculeStar?: string;
  posteMembre?: string;
  poleNom?: string;
  photoBase64?: string;
  photoType?: string;
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrateur',
  MEMBRE_BUREAU: 'Membre Bureau',
  ADHERENT: 'Adhérent',
};

const POSTE_LABELS: Record<string, string> = {
  PRESIDENT:        'Président',
  VICE_PRESIDENT:   'Vice-Président',
  SECRETARY:        'Secrétaire',
  TREASURER:        'Trésorier',
  RESPONSABLE_POLE: 'Responsable de Pôle',
  MEMBER:           'Membre',
};

@Component({
  selector: 'app-user-profil',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-profil.component.html',
  styleUrl: './user-profil.component.scss',
})
export class UserProfilComponent implements OnInit {
  private http = inject(HttpClient);
  private fb   = inject(FormBuilder);
  private auth = inject(AuthService);

  profil      = signal<UserProfil | null>(null);
  loading     = signal(true);
  saving      = signal(false);
  saveSuccess = signal(false);
  saveError   = signal('');
  editMode    = signal(false);

  showPhotoModal  = signal(false);
  photoFile       = signal<File | null>(null);
  photoPreviewUrl = signal<string | null>(null);
  photoUploading  = signal(false);
  photoError      = signal('');

  form = this.fb.group({
    prenom:    ['', [Validators.required, Validators.minLength(2)]],
    nom:       ['', [Validators.required, Validators.minLength(2)]],
    telephone: [''],
  });

  initials = computed(() => {
    const p = this.profil();
    return p ? getInitials(`${p.prenom} ${p.nom}`) : '';
  });

  photoSrc = computed(() => {
    const p = this.profil();
    if (!p?.photoBase64 || !p?.photoType) return null;
    return `data:${p.photoType};base64,${p.photoBase64}`;
  });

  roleLabel  = (r: string) => ROLE_LABELS[r] ?? r;
  posteLabel = (p: string | undefined) => p ? (POSTE_LABELS[p] ?? p) : null;

  ngOnInit(): void {
    this.http.get<UserProfil>('/api/utilisateurs/profil').subscribe({
      next: p => {
        this.profil.set(p);
        this.patchForm(p);
        this.loading.set(false);
        if (p.photoBase64 && p.photoType) {
          this.auth.setPhoto(`data:${p.photoType};base64,${p.photoBase64}`);
        }
      },
      error: () => this.loading.set(false),
    });
  }

  enterEdit(): void { this.saveSuccess.set(false); this.saveError.set(''); this.editMode.set(true); }
  cancelEdit(): void { this.patchForm(this.profil()!); this.editMode.set(false); }

  openPhotoModal(): void {
    this.photoFile.set(null);
    this.photoPreviewUrl.set(null);
    this.photoError.set('');
    this.showPhotoModal.set(true);
  }

  closePhotoModal(): void { this.showPhotoModal.set(false); }

  onPhotoSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.photoFile.set(file);
    const reader = new FileReader();
    reader.onload = e => this.photoPreviewUrl.set(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  confirmPhotoUpload(): void {
    const file = this.photoFile();
    if (!file) return;
    this.photoUploading.set(true);
    this.photoError.set('');
    const fd = new FormData();
    fd.append('photo', file);
    this.http.patch<UserProfil>('/api/utilisateurs/profil/photo', fd).subscribe({
      next: updated => {
        this.profil.set({ ...this.profil()!, ...updated });
        if (updated.photoBase64 && updated.photoType) {
          this.auth.setPhoto(`data:${updated.photoType};base64,${updated.photoBase64}`);
        }
        this.photoUploading.set(false);
        this.showPhotoModal.set(false);
      },
      error: (err) => {
        this.photoUploading.set(false);
        this.photoError.set(err?.error?.message ?? 'Une erreur est survenue lors de l\'upload.');
      },
    });
  }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    this.http.put<UserProfil>('/api/utilisateurs/profil', this.form.value).subscribe({
      next: updated => {
        this.profil.set({ ...this.profil()!, ...updated });
        this.saving.set(false);
        this.saveSuccess.set(true);
        this.editMode.set(false);
      },
      error: () => { this.saving.set(false); this.saveError.set('Une erreur est survenue.'); },
    });
  }

  private patchForm(p: UserProfil): void {
    this.form.patchValue({ prenom: p.prenom, nom: p.nom, telephone: p.telephone ?? '' });
  }
}
