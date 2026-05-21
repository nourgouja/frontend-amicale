import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

describe('authGuard', () => {
  let authSpy: { isLoggedIn: ReturnType<typeof vi.fn> };
  let routerSpy: { navigate: ReturnType<typeof vi.fn> };

  function runGuard(): boolean | any {
    return TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
    );
  }

  beforeEach(() => {
    authSpy = { isLoggedIn: vi.fn() };
    routerSpy = { navigate: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });
  });

  it('returns true when user is logged in', () => {
    authSpy.isLoggedIn.mockReturnValue(true);
    expect(runGuard()).toBe(true);
  });

  it('returns false when user is not logged in', () => {
    authSpy.isLoggedIn.mockReturnValue(false);
    expect(runGuard()).toBe(false);
  });

  it('navigates to /login when user is not logged in', () => {
    authSpy.isLoggedIn.mockReturnValue(false);
    runGuard();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('does not navigate when user is logged in', () => {
    authSpy.isLoggedIn.mockReturnValue(true);
    runGuard();
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });
});
