import { Component, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const newPwd = group.get('newPassword')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return newPwd && confirm && newPwd !== confirm ? { mismatch: true } : null;
}

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.scss',
})
export class ChangePasswordComponent {
  form = new FormGroup(
    {
      newPassword: new FormControl('', [Validators.required, Validators.minLength(8)]),
      confirmPassword: new FormControl('', [Validators.required]),
    },
    { validators: passwordsMatch }
  );

  loading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  constructor(private http: HttpClient, private router: Router) {}

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const { newPassword, confirmPassword } = this.form.value;

    this.http.put('/api/utilisateurs/change-password', { newPassword, confirmPassword }).subscribe({
      next: () => {
        this.loading.set(false);
        this.successMessage.set('Password changed successfully.');
        setTimeout(() => this.router.navigate(['/home']), 1500);
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err.error?.message ?? err.error ?? null;
        if (err.status === 401) {
          this.errorMessage.set('Session expired. Please log in again.');
        } else if (err.status === 400 && msg) {
          this.errorMessage.set(msg);
        } else {
          this.errorMessage.set('An error occurred. Please try again.');
        }
      },
    });
  }
}
