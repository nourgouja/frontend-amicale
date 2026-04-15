import { Component, signal, output } from '@angular/core';
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
  styleUrls: ['./reset-password-modal.component.scss'],
})
export class ResetPasswordModalComponent {
  form = new FormGroup(
    {
      newPassword: new FormControl('', [
        Validators.required,
        Validators.minLength(8),
      ]),
      confirmPassword: new FormControl('', [Validators.required]),
    },
    { validators: passwordsMatch }
  );

  loading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  // Output event to notify parent component
  passwordReset = output<void>();
  closeModal = output<void>();

  constructor(private http: HttpClient, private authService: AuthService) {}

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const payload = {
      newPassword: this.form.value.newPassword,
      confirmPassword: this.form.value.confirmPassword,
    };

    this.http.post('/api/auth/change-password', payload).subscribe({
      next: () => {
        this.loading.set(false);
        this.successMessage.set('Password updated successfully!');
        this.authService.clearFirstLogin();
        
       
        setTimeout(() => {
          this.passwordReset.emit();
          this.closeModal.emit();
        }, 1500);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(
          err.error?.message || 'An error occurred. Please try again.'
        );
        console.error('Password reset error:', err);
      },
    });
  }

  onCancel() {
    this.closeModal.emit();
  }

  get newPassword() {
    return this.form.get('newPassword');
  }

  get confirmPassword() {
    return this.form.get('confirmPassword');
  }
}