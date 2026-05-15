import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ElectionCall, CandidateApplication, CreateCallRequest, ApplyRequest } from '../models/election-call.model';
import { Election } from '../models/election.model';

@Injectable({ providedIn: 'root' })
export class ElectionCallService {
  private http = inject(HttpClient);
  private base = '/api/election-calls';

  // ── Admin ──────────────────────────────────────────────────────────────────

  createCall(req: CreateCallRequest): Observable<ElectionCall> {
    return this.http.post<ElectionCall>(this.base, req);
  }

  getAllCalls(): Observable<ElectionCall[]> {
    return this.http.get<ElectionCall[]>(this.base);
  }

  closeCall(id: number): Observable<ElectionCall> {
    return this.http.post<ElectionCall>(`${this.base}/${id}/close`, {});
  }

  getApplications(callId: number): Observable<CandidateApplication[]> {
    return this.http.get<CandidateApplication[]>(`${this.base}/${callId}/applications`);
  }

  acceptApplication(callId: number, appId: number): Observable<CandidateApplication> {
    return this.http.post<CandidateApplication>(`${this.base}/${callId}/applications/${appId}/accept`, {});
  }

  rejectApplication(callId: number, appId: number): Observable<CandidateApplication> {
    return this.http.post<CandidateApplication>(`${this.base}/${callId}/applications/${appId}/reject`, {});
  }

  deleteCall(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  publishElection(callId: number): Observable<Election> {
    return this.http.post<Election>(`${this.base}/${callId}/publish`, {});
  }

  // ── Member ─────────────────────────────────────────────────────────────────

  getActiveCall(): Observable<ElectionCall | null> {
    return this.http.get<ElectionCall | null>(`${this.base}/active`).pipe(
      catchError(() => of(null))
    );
  }

  apply(callId: number, req: ApplyRequest, photo?: File): Observable<CandidateApplication> {
    const fd = new FormData();
    fd.append('application', new Blob([JSON.stringify(req)], { type: 'application/json' }));
    if (photo) fd.append('photo', photo);
    return this.http.post<CandidateApplication>(`${this.base}/${callId}/apply`, fd);
  }

  getMyApplication(callId: number): Observable<CandidateApplication | null> {
    return this.http.get<CandidateApplication | null>(`${this.base}/${callId}/my-application`).pipe(
      catchError(() => of(null))
    );
  }
}
