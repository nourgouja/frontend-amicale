import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Sondage, CreateSondageRequest } from '../models/sondage.model';

@Injectable({ providedIn: 'root' })
export class SondageService {
  private http = inject(HttpClient);

  createSondage(req: CreateSondageRequest, image1: File, image2: File): Observable<Sondage> {
    const fd = new FormData();
    fd.append('sondage', new Blob([JSON.stringify(req)], { type: 'application/json' }));
    fd.append('image1', image1);
    fd.append('image2', image2);
    return this.http.post<Sondage>('/api/sondages', fd);
  }

  getActiveSondages(): Observable<Sondage[]> {
    return this.http.get<Sondage[]>('/api/sondages');
  }

  getSondageById(id: number): Observable<Sondage> {
    return this.http.get<Sondage>(`/api/sondages/${id}`);
  }

  publishSondage(id: number): Observable<void> {
    return this.http.patch<void>(`/api/sondages/${id}/activer`, {});
  }

  closeSondage(id: number): Observable<void> {
    return this.http.patch<void>(`/api/sondages/${id}/fermer`, {});
  }

  vote(id: number, optionId: number): Observable<Sondage> {
    return this.http.post<Sondage>(`/api/sondages/${id}/voter`, { optionId });
  }

  getResults(id: number): Observable<Sondage> {
    return this.http.get<Sondage>(`/api/sondages/${id}`);
  }

  deleteSondage(id: number): Observable<void> {
    return this.http.delete<void>(`/api/sondages/${id}`);
  }
}
