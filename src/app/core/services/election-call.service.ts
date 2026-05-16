import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ElectionCall, CandidateApplication, CreateCallRequest, ApplyRequest } from '../models/election-call.model';

@Injectable({ providedIn: 'root' })
export class ElectionCallService {
  private http = inject(HttpClient);
  private base = '/api/v1/election-calls';

  // ── Admin ──────────────────────────────────────────────────────────────────

  createCall(req: CreateCallRequest): Observable<ElectionCall> {
    return this.http.post<ElectionCall>(this.base, req);
  }

  getAllCalls(): Observable<ElectionCall[]> {
    return this.http.get<{ content: ElectionCall[] }>(`${this.base}/all`).pipe(
      map(page => page.content)
    );
  }

  closeCall(id: number): Observable<ElectionCall> {
    return this.http.post<ElectionCall>(`${this.base}/${id}/close`, {});
  }

  getApplications(callId: number): Observable<CandidateApplication[]> {
    return this.http.get<{ content: CandidateApplication[] }>(`${this.base}/${callId}/applications`).pipe(
      map(page => page.content)
    );
  }

  approveApplication(callId: number, appId: number): Observable<CandidateApplication> {
    return this.http.post<CandidateApplication>(`${this.base}/${callId}/applications/${appId}/approve`, {});
  }

  rejectApplication(callId: number, appId: number): Observable<CandidateApplication> {
    return this.http.post<CandidateApplication>(`${this.base}/${callId}/applications/${appId}/reject`, {});
  }

  deleteCall(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  publishElection(callId: number): Observable<ElectionCall> {
    return this.http.post<ElectionCall>(`${this.base}/${callId}/publish`, {});
  }

  // ── Member ─────────────────────────────────────────────────────────────────

  getActiveCall(): Observable<ElectionCall | null> {
    return this.http.get<ElectionCall | null>(`${this.base}/active`).pipe(
      catchError(() => of(null))
    );
  }

  apply(callId: number, req: ApplyRequest, photo?: File): Observable<CandidateApplication> {
    const fd = new FormData();
    fd.append('position', req.position);
    fd.append('motivation', req.motivation);
    if (photo) fd.append('photo', photo);
    return this.http.post<CandidateApplication>(`${this.base}/${callId}/apply`, fd);
  }

  getMyApplication(callId: number): Observable<CandidateApplication | null> {
    return this.http.get<CandidateApplication>(`${this.base}/${callId}/my-application`).pipe(
      catchError(() => of(null))
    );
  }
}
