import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AdminAdhesionService } from '../../admin/services/admin-adhesion.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  private fb = new FormBuilder();

  form = this.fb.group({
    fullName:      ['', [Validators.required, Validators.minLength(2)]],
    email:         ['', [Validators.required, Validators.email]],
    telephone:     [''],
    matriculeStar: [''],
    cin:           [''],
  });

  loading  = signal(false);
  success  = signal(false);
  error    = signal('');

  constructor(private adhesionService: AdminAdhesionService) {}

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.error.set('');

    const val = this.form.value;
    const parts = (val.fullName ?? '').trim().split(/\s+/);
    const prenom = parts[0] ?? '';
    const nom    = parts.slice(1).join(' ') || prenom;

    this.adhesionService.soumettreDemande({
      prenom,
      nom,
      email:         val.email ?? '',
      telephone:     val.telephone || undefined,
      matriculeStar: val.matriculeStar || undefined,
      cin:           val.cin || undefined,
    }).subscribe({
      next:  () => { this.loading.set(false); this.success.set(true); },
      error: () => { this.loading.set(false); this.error.set('An error occurred. Please try again.'); },
    });
  }
}
