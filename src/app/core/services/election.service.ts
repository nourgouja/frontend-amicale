import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  Election, Candidate, UserSummary,
  CreateElectionRequest, AddCandidateRequest, Position
} from '../models/election.model';

@Injectable({ providedIn: 'root' })
export class ElectionService {
  private http = inject(HttpClient);
  private base = '/api/v1/elections';

  // ── Admin ──────────────────────────────────────────────────────────────────

  getAllElections(): Observable<Election[]> {
    return this.http.get<{ content: Election[] }>(this.base).pipe(
      map(page => page.content)
    );
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

  deleteElection(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  addCandidate(electionId: number, req: AddCandidateRequest, photo?: File): Observable<Candidate> {
    const fd = new FormData();
    fd.append('userId', String(req.userId));
    fd.append('position', req.position);
    if (req.description) fd.append('description', req.description);
    if (photo) fd.append('photo', photo);
    return this.http.post<Candidate>(`${this.base}/${electionId}/candidates`, fd);
  }

  removeCandidate(electionId: number, candidateId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${electionId}/candidates/${candidateId}`);
  }

  publishResults(id: number): Observable<Election> {
    return this.http.post<Election>(`${this.base}/${id}/publish-results`, {});
  }

  createExtraRound(id: number, position: Position): Observable<Election> {
    return this.http.post<Election>(`${this.base}/${id}/extra-round/${position}`, {});
  }

  // ── Member + Admin ─────────────────────────────────────────────────────────

  getElectionById(id: number): Observable<Election> {
    return this.http.get<Election>(`${this.base}/${id}`);
  }

  getResults(id: number): Observable<Election> {
    return this.http.get<Election>(`${this.base}/${id}`);
  }

  getActiveElections(): Observable<Election[]> {
    return this.http.get<{ content: Election[] }>(this.base).pipe(
      map(page => page.content)
    );
  }

  getClosedElections(): Observable<Election[]> {
    return this.http.get<{ content: Election[] }>(`${this.base}/closed`).pipe(
      map(page => page.content)
    );
  }

  getCandidates(electionId: number): Observable<Candidate[]> {
    return this.http.get<{ content: Candidate[] }>(`${this.base}/${electionId}/candidates`).pipe(
      map(page => page.content)
    );
  }

  getCandidatesByPosition(electionId: number, position: Position): Observable<Candidate[]> {
    return this.http.get<{ content: Candidate[] }>(
      `${this.base}/${electionId}/candidates/by-position/${position}`
    ).pipe(map(page => page.content));
  }

  vote(electionId: number, candidateId: number, position: Position): Observable<Election> {
    return this.http.post<Election>(`${this.base}/${electionId}/vote`, {
      electionId,
      candidateId,
      position,
    });
  }

  getMyVotes(electionId: number): Observable<string[]> {
    return this.http.get<string[]>(`${this.base}/${electionId}/my-votes`);
  }

  getAvailableUsers(electionId?: number): Observable<UserSummary[]> {
    const url = electionId != null
      ? `${this.base}/available-users?electionId=${electionId}`
      : `${this.base}/available-users`;
    return this.http.get<{ content: UserSummary[] }>(url).pipe(map(page => page.content));
  }
}
