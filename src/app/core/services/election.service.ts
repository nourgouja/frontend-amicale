import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Election, Candidate, UserSummary,
  CreateElectionRequest, AddCandidateRequest, Position
} from '../models/election.model';

@Injectable({ providedIn: 'root' })
export class ElectionService {
  private http = inject(HttpClient);
  private base = '/api/elections';

  // ── Admin ──────────────────────────────────────────────────────────────────

  getAllElections(): Observable<Election[]> {
    return this.http.get<Election[]>(this.base);
  }

  createElection(req: CreateElectionRequest): Observable<Election> {
    return this.http.post<Election>(this.base, req);
  }

  openElection(id: number): Observable<Election> {
    return this.http.post<Election>(`${this.base}/${id}/open`, {});
  }

  closeElection(id: number): Observable<Election> {
    return this.http.post<Election>(`${this.base}/${id}/close`, {});
  }

  addCandidate(electionId: number, req: AddCandidateRequest, photo?: File): Observable<Candidate> {
    const fd = new FormData();
    fd.append('candidate', new Blob([JSON.stringify(req)], { type: 'application/json' }));
    if (photo) fd.append('photo', photo);
    return this.http.post<Candidate>(`${this.base}/${electionId}/candidates`, fd);
  }

  getCandidates(electionId: number): Observable<Candidate[]> {
    return this.http.get<Candidate[]>(`${this.base}/${electionId}/candidates`);
  }

  removeCandidate(electionId: number, candidateId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${electionId}/candidates/${candidateId}`);
  }

  getAvailableUsers(): Observable<UserSummary[]> {
    return this.http.get<UserSummary[]>(`${this.base}/available-users`);
  }

  // ── Member + Admin ─────────────────────────────────────────────────────────

  getElectionById(id: number): Observable<Election> {
    return this.http.get<Election>(`${this.base}/${id}`);
  }

  getActiveElections(): Observable<Election[]> {
    return this.http.get<Election[]>(`${this.base}/active`);
  }

  getClosedElections(): Observable<Election[]> {
    return this.http.get<Election[]>(`${this.base}/closed`);
  }

  getCandidatesByPosition(electionId: number, position: Position): Observable<Candidate[]> {
    return this.http.get<Candidate[]>(`${this.base}/${electionId}/candidates-by-position`, {
      params: { position }
    });
  }

  vote(electionId: number, candidateId: number): Observable<Election> {
    return this.http.post<Election>(`${this.base}/${electionId}/vote`, { candidateId });
  }

  getMyVotes(electionId: number): Observable<string[]> {
    return this.http.get<string[]>(`${this.base}/${electionId}/my-votes`);
  }

  getResults(electionId: number): Observable<Election> {
    return this.http.get<Election>(`${this.base}/${electionId}/results`);
  }

  deleteElection(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
