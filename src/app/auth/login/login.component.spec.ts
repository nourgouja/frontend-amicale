import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '../../core/services/auth.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let authSpy: { login: ReturnType<typeof vi.fn>; firstLogin: ReturnType<typeof vi.fn>; getDashboardRoute: ReturnType<typeof vi.fn> };
  let router: Router;

  beforeEach(async () => {
    authSpy = {
      login: vi.fn(),
      firstLogin: vi.fn().mockReturnValue(false),
      getDashboardRoute: vi.fn().mockReturnValue('/adherent/dashboard'),
    };

    await TestBed.configureTestingModule({
      imports: [LoginComponent, ReactiveFormsModule],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authSpy },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    const fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('form is invalid when empty', () => {
    expect(component.loginForm.invalid).toBe(true);
  });

  it('form is invalid with bad email', () => {
    component.loginForm.setValue({ email: 'notanemail', password: 'pass123', rememberMe: false });
    expect(component.loginForm.invalid).toBe(true);
  });

  it('form is valid with correct email and password', () => {
    component.loginForm.setValue({ email: 'user@test.com', password: 'secret', rememberMe: false });
    expect(component.loginForm.valid).toBe(true);
  });

  it('onSubmit() does nothing when form is invalid', () => {
    component.onSubmit();
    expect(authSpy.login).not.toHaveBeenCalled();
  });

  it('onSubmit() calls authService.login with form values', () => {
    authSpy.login.mockReturnValue(of({}));
    component.loginForm.setValue({ email: 'user@test.com', password: 'secret', rememberMe: false });
    component.onSubmit();
    expect(authSpy.login).toHaveBeenCalledWith('user@test.com', 'secret');
  });

  it('onSubmit() navigates to dashboard route on success', () => {
    authSpy.login.mockReturnValue(of({}));
    authSpy.firstLogin.mockReturnValue(false);
    authSpy.getDashboardRoute.mockReturnValue('/adherent/dashboard');
    component.loginForm.setValue({ email: 'user@test.com', password: 'secret', rememberMe: false });
    component.onSubmit();
    expect(router.navigate).toHaveBeenCalledWith(['/adherent/dashboard']);
  });

  it('onSubmit() navigates to /change-password on first login', () => {
    authSpy.login.mockReturnValue(of({}));
    authSpy.firstLogin.mockReturnValue(true);
    component.loginForm.setValue({ email: 'user@test.com', password: 'secret', rememberMe: false });
    component.onSubmit();
    expect(router.navigate).toHaveBeenCalledWith(['/change-password']);
  });

  it('onSubmit() sets errorMessage on 401 error', () => {
    authSpy.login.mockReturnValue(throwError(() => ({ status: 401 })));
    component.loginForm.setValue({ email: 'user@test.com', password: 'wrong', rememberMe: false });
    component.onSubmit();
    expect(component.errorMessage()).toBe('Invalid email or password.');
  });

  it('onSubmit() sets generic errorMessage on non-401 error', () => {
    authSpy.login.mockReturnValue(throwError(() => ({ status: 500 })));
    component.loginForm.setValue({ email: 'user@test.com', password: 'pass', rememberMe: false });
    component.onSubmit();
    expect(component.errorMessage()).toBe('An error occurred. Please try again.');
  });
});
