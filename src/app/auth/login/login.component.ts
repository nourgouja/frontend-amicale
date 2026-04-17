import { Component, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  loginForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required]),
    rememberMe: new FormControl(false),
  });

  loading = signal(false);
  errorMessage = signal('');
  showPassword = signal(false);

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit(): void {
    if (this.loginForm.invalid) return;

    this.loading.set(true);
    this.errorMessage.set('');

    const { email, password } = this.loginForm.value;

    this.authService.login(email!, password!).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.router.navigate([res?.firstLogin ? '/change-password' : '/home']);
      },
      error: (err) => {
        this.loading.set(false);
        console.error('Login error status:', err.status);
        console.error('Login error body:', err.error);
        if (err.status === 0) {
          this.errorMessage.set('Cannot reach server. Is the backend running?');
        } else if (err.status === 401 || err.status === 400) {
          this.errorMessage.set(
            err.error?.message ?? 'Invalid email or password.'
          );
        } else {
          const msg = err.error?.message || err.error?.error || JSON.stringify(err.error);
          this.errorMessage.set(`Error ${err.status}: ${msg}`);
        }
      },
    });
  }
}
