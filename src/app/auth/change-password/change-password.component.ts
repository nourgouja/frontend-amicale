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
import { AuthService } from '../../core/services/auth.service';

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
  showNew = false;
  showConfirm = false;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit(): void {
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
        this.successMessage.set('Password changed successfully.');
        this.authService.clearFirstLogin();
        this.router.navigate(['/home']);
      },
      error: () => {
        this.loading.set(false);
        this.errorMessage.set('An error occurred. Please try again.');
      },
    });
  }
}
