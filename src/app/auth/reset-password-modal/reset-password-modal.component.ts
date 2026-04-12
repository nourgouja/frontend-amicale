import { Component, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const newPwd = group.get('newPassword')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return newPwd && confirm && newPwd !== confirm ? { mismatch: true } : null;
}

@Component({
  selector: 'app-reset-password-modal',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './reset-password-modal.component.html',
  styleUrl: './reset-password-modal.component.scss',
})
export class ResetPasswordModalComponent {
  form = new FormGroup(
    {
      newPassword: new FormControl('', [Validators.required, Validators.minLength(8)]),
      confirmPassword: new FormControl('', [Validators.required]),
    },
    { validators: passwordsMatch }
  );

  loading = signal(false);
  errorMessage = signal('');

  constructor(private http: HttpClient, private authService: AuthService) {}

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.errorMessage.set('');
    const { newPassword } = this.form.value;
    this.http.post('/api/auth/change-password', { newPassword }).subscribe({
      next: () => {
        this.loading.set(false);
        this.authService.clearFirstLogin();
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(
          err.status === 401
            ? 'Session expired. Please log in again.'
            : 'An error occurred. Please try again.'
        );
      },
    });
  }
}
