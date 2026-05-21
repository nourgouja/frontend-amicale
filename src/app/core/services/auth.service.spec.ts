import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

const FAKE_PAYLOAD = { sub: 'test@example.com', role: 'ADHERENT', prenom: 'Alice', nom: 'Smith' };
const FAKE_JWT = [
  'header',
  btoa(JSON.stringify(FAKE_PAYLOAD)),
  'sig',
].join('.');

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;
  let routerSpy: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    localStorage.clear();
    routerSpy = { navigate: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: routerSpy },
      ],
    });

    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('isLoggedIn() returns false when no token in storage', () => {
    expect(service.isLoggedIn()).toBe(false);
  });

  it('isLoggedIn() returns true when token exists in storage', () => {
    localStorage.setItem('access_token', FAKE_JWT);
    expect(service.isLoggedIn()).toBe(true);
  });

  it('getToken() returns null when nothing stored', () => {
    expect(service.getToken()).toBeNull();
  });

  it('getToken() returns stored token', () => {
    localStorage.setItem('access_token', FAKE_JWT);
    expect(service.getToken()).toBe(FAKE_JWT);
  });

  it('login() stores token and sets currentUser signal', () => {
    let completed = false;
    service.login('test@example.com', 'pass').subscribe(() => { completed = true; });

    const req = http.expectOne('/api/auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'test@example.com', motDePasse: 'pass' });

    req.flush({ accessToken: FAKE_JWT, role: 'ADHERENT', firstLogin: false });

    expect(completed).toBe(true);
    expect(localStorage.getItem('access_token')).toBe(FAKE_JWT);
    expect(service.currentUser()?.email).toBe('test@example.com');
    expect(service.currentUser()?.role).toBe('ADHERENT');
  });

  it('login() sets firstLogin signal when server returns firstLogin=true', () => {
    service.login('test@example.com', 'pass').subscribe();
    http.expectOne('/api/auth/login').flush({ accessToken: FAKE_JWT, role: 'ADHERENT', firstLogin: true });
    expect(service.firstLogin()).toBe(true);
  });

  it('logout() clears token and navigates to /login', () => {
    localStorage.setItem('access_token', FAKE_JWT);
    service.logout();
    http.expectOne('/api/auth/logout').flush({});
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(service.currentUser()).toBeNull();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('logout() still clears state even on server error', () => {
    localStorage.setItem('access_token', FAKE_JWT);
    service.logout();
    http.expectOne('/api/auth/logout').error(new ErrorEvent('network'));
    expect(service.currentUser()).toBeNull();
  });

  it('clearFirstLogin() resets firstLogin signal', () => {
    service.firstLogin.set(true);
    service.clearFirstLogin();
    expect(service.firstLogin()).toBe(false);
  });

  it('getDashboardRoute() returns /admin/dashboard for ADMIN', () => {
    service.currentUser.set({ email: 'a@b.com', role: 'ADMIN', prenom: '', nom: '' });
    expect(service.getDashboardRoute()).toBe('/admin/dashboard');
  });

  it('getDashboardRoute() returns /bureau/dashboard for MEMBRE_BUREAU', () => {
    service.currentUser.set({ email: 'a@b.com', role: 'MEMBRE_BUREAU', prenom: '', nom: '' });
    expect(service.getDashboardRoute()).toBe('/bureau/dashboard');
  });

  it('getDashboardRoute() returns /adherent/dashboard by default', () => {
    service.currentUser.set({ email: 'a@b.com', role: 'ADHERENT', prenom: '', nom: '' });
    expect(service.getDashboardRoute()).toBe('/adherent/dashboard');
  });

  it('isAdmin computed returns true only for ADMIN role', () => {
    service.currentUser.set({ email: 'a@b.com', role: 'ADMIN', prenom: '', nom: '' });
    expect(service.isAdmin()).toBe(true);
    expect(service.isBureau()).toBe(false);
    expect(service.isAdherent()).toBe(false);
  });

  it('isBureau computed returns true for MEMBRE_BUREAU role', () => {
    service.currentUser.set({ email: 'a@b.com', role: 'MEMBRE_BUREAU', prenom: '', nom: '' });
    expect(service.isBureau()).toBe(true);
  });

  it('loads user from localStorage on construction', () => {
    localStorage.setItem('access_token', FAKE_JWT);
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [AuthService, provideHttpClient(), provideHttpClientTesting(), { provide: Router, useValue: routerSpy }],
    });
    const fresh = TestBed.inject(AuthService);
    expect(fresh.currentUser()?.email).toBe('test@example.com');
  });
});
