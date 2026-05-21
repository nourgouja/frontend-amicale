import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors, HttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authSpy: { getToken: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    authSpy = { getToken: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authSpy },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('adds Authorization header when token exists', () => {
    authSpy.getToken.mockReturnValue('my-jwt-token');
    http.get('/api/test').subscribe();
    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.get('Authorization')).toBe('Bearer my-jwt-token');
    req.flush({});
  });

  it('does not add Authorization header when no token', () => {
    authSpy.getToken.mockReturnValue(null);
    http.get('/api/test').subscribe();
    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('passes through the original request body', () => {
    authSpy.getToken.mockReturnValue('token');
    http.post('/api/data', { key: 'value' }).subscribe();
    const req = httpMock.expectOne('/api/data');
    expect(req.request.body).toEqual({ key: 'value' });
    req.flush({});
  });

  it('does not modify request URL', () => {
    authSpy.getToken.mockReturnValue('token');
    http.get('/api/resource').subscribe();
    const req = httpMock.expectOne('/api/resource');
    expect(req.request.url).toBe('/api/resource');
    req.flush({});
  });
});
