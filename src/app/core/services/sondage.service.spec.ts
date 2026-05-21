import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { SondageService } from './sondage.service';
import { Sondage } from '../models/sondage.model';

const mockSondage: Sondage = {
  id: 1,
  titre: 'Sondage Test',
  statut: 'OPEN',
  options: [
    { id: 10, titre: 'Option A', voteCount: 3 },
    { id: 11, titre: 'Option B', voteCount: 7 },
  ],
  hasVoted: false,
  votedOptionId: null,
  totalVotes: 10,
};

describe('SondageService', () => {
  let service: SondageService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SondageService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(SondageService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getActiveSondages() calls GET /api/sondages', () => {
    let result: Sondage[] | undefined;
    service.getActiveSondages().subscribe(r => (result = r));
    const req = http.expectOne('/api/sondages');
    expect(req.request.method).toBe('GET');
    req.flush([mockSondage]);
    expect(result).toEqual([mockSondage]);
  });

  it('getSondageById() calls GET /api/sondages/:id', () => {
    let result: Sondage | undefined;
    service.getSondageById(1).subscribe(r => (result = r));
    const req = http.expectOne('/api/sondages/1');
    expect(req.request.method).toBe('GET');
    req.flush(mockSondage);
    expect(result).toEqual(mockSondage);
  });

  it('publishSondage() calls PATCH /api/sondages/:id/activer', () => {
    let called = false;
    service.publishSondage(1).subscribe(() => (called = true));
    const req = http.expectOne('/api/sondages/1/activer');
    expect(req.request.method).toBe('PATCH');
    req.flush(null);
    expect(called).toBe(true);
  });

  it('closeSondage() calls PATCH /api/sondages/:id/fermer', () => {
    let called = false;
    service.closeSondage(1).subscribe(() => (called = true));
    const req = http.expectOne('/api/sondages/1/fermer');
    expect(req.request.method).toBe('PATCH');
    req.flush(null);
    expect(called).toBe(true);
  });

  it('vote() calls POST /api/sondages/:id/voter with optionId', () => {
    let result: Sondage | undefined;
    service.vote(1, 10).subscribe(r => (result = r));
    const req = http.expectOne('/api/sondages/1/voter');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ optionId: 10 });
    req.flush({ ...mockSondage, hasVoted: true, votedOptionId: 10 });
    expect(result?.hasVoted).toBe(true);
    expect(result?.votedOptionId).toBe(10);
  });

  it('getResults() calls GET /api/sondages/:id', () => {
    let result: Sondage | undefined;
    service.getResults(1).subscribe(r => (result = r));
    const req = http.expectOne('/api/sondages/1');
    expect(req.request.method).toBe('GET');
    req.flush(mockSondage);
    expect(result).toEqual(mockSondage);
  });

  it('deleteSondage() calls DELETE /api/sondages/:id', () => {
    let called = false;
    service.deleteSondage(1).subscribe(() => (called = true));
    const req = http.expectOne('/api/sondages/1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
    expect(called).toBe(true);
  });

  it('createSondage() calls POST /api/sondages with FormData', () => {
    const req_data = { titre: 'New', option1: { titre: 'A', description: '' }, option2: { titre: 'B', description: '' } };
    const file1 = new File(['img'], 'a.jpg', { type: 'image/jpeg' });
    const file2 = new File(['img'], 'b.jpg', { type: 'image/jpeg' });
    let result: Sondage | undefined;
    service.createSondage(req_data, file1, file2).subscribe(r => (result = r));
    const req = http.expectOne('/api/sondages');
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBe(true);
    req.flush(mockSondage);
    expect(result).toEqual(mockSondage);
  });

  it('vote() propagates HTTP errors', () => {
    let error: any;
    service.vote(1, 99).subscribe({ error: e => (error = e) });
    http.expectOne('/api/sondages/1/voter').flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    expect(error.status).toBe(401);
  });
});
