import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SondageService } from '../../../core/services/sondage.service';
import { CreateSondageRequest } from '../../../core/models/sondage.model';

@Component({
  selector: 'app-creer-sondage',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './creer-sondage.component.html',
  styleUrl: './creer-sondage.component.scss',
})
export class CreerSondageComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private sondageService = inject(SondageService);

  form!: FormGroup;
  loading  = signal(false);
  toast    = signal<{ msg: string; type: 'success' | 'error' } | null>(null);
  imageFile1: File | null = null;
  imageFile2: File | null = null;
  preview1: string | null = null;
  preview2: string | null = null;

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    this.form = this.fb.group({
      titre: ['', [Validators.required, Validators.minLength(3)]],
      option1: this.fb.group({
        titre:       ['', Validators.required],
        description: ['', Validators.required],
      }),
      option2: this.fb.group({
        titre:       ['', Validators.required],
        description: ['', Validators.required],
      }),
    });
  }

  onImageSelect1(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.imageFile1 = file;
    const reader = new FileReader();
    reader.onload = e => { this.preview1 = e.target?.result as string; };
    reader.readAsDataURL(file);
    (event.target as HTMLInputElement).value = '';
  }

  onImageSelect2(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.imageFile2 = file;
    const reader = new FileReader();
    reader.onload = e => { this.preview2 = e.target?.result as string; };
    reader.readAsDataURL(file);
    (event.target as HTMLInputElement).value = '';
  }

  removeImage(idx: 1 | 2): void {
    if (idx === 1) { this.imageFile1 = null; this.preview1 = null; }
    else           { this.imageFile2 = null; this.preview2 = null; }
  }

  submit(): void {
    if (!this.form.valid) {
      this.form.markAllAsTouched();
      this.showToast('Veuillez remplir tous les champs requis.', 'error');
      return;
    }

    if (!this.imageFile1 || !this.imageFile2) {
      this.showToast('Veuillez télécharger les deux images', 'error');
      return;
    }

    const formValue = this.form.value;

    const request: CreateSondageRequest = {
      titre: formValue.titre,
      option1: { titre: formValue.option1.titre, description: formValue.option1.description },
      option2: { titre: formValue.option2.titre, description: formValue.option2.description },
    };

    this.loading.set(true);
    this.sondageService.createSondage(request, this.imageFile1, this.imageFile2).subscribe({
      next: () => {
        this.showToast('Sondage créé avec succès', 'success');
        setTimeout(() => this.router.navigate(['/bureau/sondages']), 1500);
      },
      error: (err) => {
        this.loading.set(false);
        this.showToast(err?.error?.message ?? 'Erreur lors de la création du sondage', 'error');
      },
    });
  }

  cancel(): void {
    const base = this.router.url.startsWith('/admin') ? '/admin' : '/bureau';
    this.router.navigate([`${base}/sondages`]);
  }

  private showToast(msg: string, type: 'success' | 'error'): void {
    this.toast.set({ msg, type });
    setTimeout(() => this.toast.set(null), 3500);
  }
}
