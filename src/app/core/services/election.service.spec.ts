import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ElectionService } from './election.service';
import { Election, Candidate } from '../models/election.model';

const mockElection: Election = {
  id: 1,
  titre: 'Élection 2024',
  status: 'OPEN',
  totalVotes: 5,
  totalCandidatesCount: 3,
  createdAt: '2024-01-01',
  candidates: [],
  candidatesByPosition: {} as any,
  votedPositions: [],
  isResultsPublished: false,
  resultsPublished: false,
  hasTie: false,
  tiedPositions: [],
  isExtraRound: false,
  canVote: true,
  canPublishResults: false,
};

const mockCandidate: Candidate = {
  id: 10,
  prenom: 'Alice',
  nom: 'Dupont',
  position: 'PRESIDENT',
  voteCount: 2,
  votePercentage: 40,
  winner: false,
  autoSelected: false,
};

describe('ElectionService', () => {
  let service: ElectionService;
  let http: HttpTestingController;
  const BASE = '/api/v1/elections';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ElectionService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ElectionService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getAllElections() calls GET and unwraps content array', () => {
    let result: Election[] | undefined;
    service.getAllElections().subscribe(r => (result = r));
    http.expectOne(BASE).flush({ content: [mockElection] });
    expect(result).toEqual([mockElection]);
  });

  it('createElection() calls POST with request body', () => {
    let result: Election | undefined;
    service.createElection({ titre: 'Test' }).subscribe(r => (result = r));
    const req = http.expectOne(BASE);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ titre: 'Test' });
    req.flush(mockElection);
    expect(result).toEqual(mockElection);
  });

  it('openElection() calls POST /:id/open', () => {
    let result: Election | undefined;
    service.openElection(1).subscribe(r => (result = r));
    const req = http.expectOne(`${BASE}/1/open`);
    expect(req.request.method).toBe('POST');
    req.flush({ ...mockElection, status: 'OPEN' });
    expect(result?.status).toBe('OPEN');
  });

  it('closeElection() calls POST /:id/close', () => {
    let result: Election | undefined;
    service.closeElection(1).subscribe(r => (result = r));
    const req = http.expectOne(`${BASE}/1/close`);
    expect(req.request.method).toBe('POST');
    req.flush({ ...mockElection, status: 'CLOSED' });
    expect(result?.status).toBe('CLOSED');
  });

  it('deleteElection() calls DELETE /:id', () => {
    let called = false;
    service.deleteElection(1).subscribe(() => (called = true));
    const req = http.expectOne(`${BASE}/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
    expect(called).toBe(true);
  });

  it('getElectionById() calls GET /:id', () => {
    let result: Election | undefined;
    service.getElectionById(1).subscribe(r => (result = r));
    http.expectOne(`${BASE}/1`).flush(mockElection);
    expect(result).toEqual(mockElection);
  });

  it('vote() calls POST /:id/vote with correct payload', () => {
    let result: Election | undefined;
    service.vote(1, 10, 'PRESIDENT').subscribe(r => (result = r));
    const req = http.expectOne(`${BASE}/1/vote`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ electionId: 1, candidateId: 10, position: 'PRESIDENT' });
    req.flush(mockElection);
    expect(result).toEqual(mockElection);
  });

  it('getMyVotes() calls GET /:id/my-votes', () => {
    let result: string[] | undefined;
    service.getMyVotes(1).subscribe(r => (result = r));
    const req = http.expectOne(`${BASE}/1/my-votes`);
    expect(req.request.method).toBe('GET');
    req.flush(['PRESIDENT']);
    expect(result).toEqual(['PRESIDENT']);
  });

  it('publishResults() calls POST /:id/publish-results', () => {
    let result: Election | undefined;
    service.publishResults(1).subscribe(r => (result = r));
    const req = http.expectOne(`${BASE}/1/publish-results`);
    expect(req.request.method).toBe('POST');
    req.flush({ ...mockElection, status: 'RESULTS_PUBLISHED' });
    expect(result?.status).toBe('RESULTS_PUBLISHED');
  });

  it('getAvailableUsers() calls correct URL without electionId', () => {
    service.getAvailableUsers().subscribe();
    const req = http.expectOne(`${BASE}/available-users`);
    expect(req.request.method).toBe('GET');
    req.flush({ content: [] });
  });

  it('getAvailableUsers() appends electionId query param when provided', () => {
    service.getAvailableUsers(5).subscribe();
    const req = http.expectOne(`${BASE}/available-users?electionId=5`);
    req.flush({ content: [] });
    expect(req.request.url).toContain('electionId=5');
  });

  it('addCandidate() calls POST /:id/candidates with FormData', () => {
    let result: Candidate | undefined;
    service.addCandidate(1, { userId: 2, position: 'SECRETARY' }).subscribe(r => (result = r));
    const req = http.expectOne(`${BASE}/1/candidates`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBe(true);
    req.flush(mockCandidate);
    expect(result).toEqual(mockCandidate);
  });
});
