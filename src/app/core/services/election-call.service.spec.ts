import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ElectionCallService } from './election-call.service';
import { ElectionCall, CandidateApplication } from '../models/election-call.model';

const mockCall: ElectionCall = {
  id: 1,
  titre: 'Appel 2024',
  status: 'OPEN',
  createdAt: '2024-01-01',
  totalApplicationsCount: 2,
  approvedCandidatesCount: 1,
  canApply: true,
  canPublish: false,
};

const mockApplication: CandidateApplication = {
  id: 5,
  user: { id: 10, firstName: 'Alice', lastName: 'Dupont', email: 'alice@test.com' },
  callId: 1,
  position: 'PRESIDENT',
  motivation: 'Je veux aider',
  status: 'PENDING',
  createdAt: '2024-01-02',
  canApply: false,
};

describe('ElectionCallService', () => {
  let service: ElectionCallService;
  let http: HttpTestingController;
  const BASE = '/api/v1/election-calls';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ElectionCallService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ElectionCallService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('createCall() calls POST /api/v1/election-calls', () => {
    let result: ElectionCall | undefined;
    const req_data = { titre: 'Test', dateFinCandidature: '2024-06-01', dateDebut: '2024-06-15', dateFin: '2024-06-30' };
    service.createCall(req_data).subscribe(r => (result = r));
    const req = http.expectOne(BASE);
    expect(req.request.method).toBe('POST');
    req.flush(mockCall);
    expect(result).toEqual(mockCall);
  });

  it('getAllCalls() calls GET /all and unwraps content', () => {
    let result: ElectionCall[] | undefined;
    service.getAllCalls().subscribe(r => (result = r));
    const req = http.expectOne(`${BASE}/all`);
    expect(req.request.method).toBe('GET');
    req.flush({ content: [mockCall] });
    expect(result).toEqual([mockCall]);
  });

  it('getActiveCall() calls GET /active and returns null on error', () => {
    let result: ElectionCall | null | undefined;
    service.getActiveCall().subscribe(r => (result = r));
    http.expectOne(`${BASE}/active`).error(new ErrorEvent('network'));
    expect(result).toBeNull();
  });

  it('getActiveCall() returns the call on success', () => {
    let result: ElectionCall | null | undefined;
    service.getActiveCall().subscribe(r => (result = r));
    http.expectOne(`${BASE}/active`).flush(mockCall);
    expect(result).toEqual(mockCall);
  });

  it('closeCall() calls POST /:id/close', () => {
    let result: ElectionCall | undefined;
    service.closeCall(1).subscribe(r => (result = r));
    const req = http.expectOne(`${BASE}/1/close`);
    expect(req.request.method).toBe('POST');
    req.flush({ ...mockCall, status: 'CLOSED' });
    expect(result?.status).toBe('CLOSED');
  });

  it('getApplications() calls GET /:callId/applications and unwraps content', () => {
    let result: CandidateApplication[] | undefined;
    service.getApplications(1).subscribe(r => (result = r));
    const req = http.expectOne(`${BASE}/1/applications`);
    expect(req.request.method).toBe('GET');
    req.flush({ content: [mockApplication] });
    expect(result).toEqual([mockApplication]);
  });

  it('approveApplication() calls POST /:callId/applications/:appId/approve', () => {
    let result: CandidateApplication | undefined;
    service.approveApplication(1, 5).subscribe(r => (result = r));
    const req = http.expectOne(`${BASE}/1/applications/5/approve`);
    expect(req.request.method).toBe('POST');
    req.flush({ ...mockApplication, status: 'APPROVED' });
    expect(result?.status).toBe('APPROVED');
  });

  it('rejectApplication() calls POST /:callId/applications/:appId/reject', () => {
    let result: CandidateApplication | undefined;
    service.rejectApplication(1, 5).subscribe(r => (result = r));
    const req = http.expectOne(`${BASE}/1/applications/5/reject`);
    expect(req.request.method).toBe('POST');
    req.flush({ ...mockApplication, status: 'REJECTED' });
    expect(result?.status).toBe('REJECTED');
  });

  it('deleteCall() calls DELETE /:id', () => {
    let called = false;
    service.deleteCall(1).subscribe(() => (called = true));
    const req = http.expectOne(`${BASE}/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
    expect(called).toBe(true);
  });

  it('publishElection() calls POST /:callId/publish', () => {
    let result: ElectionCall | undefined;
    service.publishElection(1).subscribe(r => (result = r));
    const req = http.expectOne(`${BASE}/1/publish`);
    expect(req.request.method).toBe('POST');
    req.flush({ ...mockCall, publishedElectionId: 99 });
    expect(result?.publishedElectionId).toBe(99);
  });

  it('apply() calls POST /:callId/apply with FormData', () => {
    let result: CandidateApplication | undefined;
    service.apply(1, { position: 'PRESIDENT', motivation: 'Motivation' }).subscribe(r => (result = r));
    const req = http.expectOne(`${BASE}/1/apply`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBe(true);
    req.flush(mockApplication);
    expect(result).toEqual(mockApplication);
  });

  it('getMyApplication() returns null on 404', () => {
    let result: CandidateApplication | null | undefined;
    service.getMyApplication(1).subscribe(r => (result = r));
    http.expectOne(`${BASE}/1/my-application`).error(new ErrorEvent('not found'), { status: 404, statusText: 'Not Found' });
    expect(result).toBeNull();
  });
});
