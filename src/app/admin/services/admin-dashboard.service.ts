import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AdminDashboardResponse {
  totalUtilisateurs: number;
  parRole: Record<string, number>;
  totalInscriptions: number;
  enAttente: number;
  confirmees: number;
  annulees: number;
  echeancesEnAttente: number;
  echeancesEnRetard: number;
  echeancesPayees: number;
  totalCollecte: number;
  totalAttendu: number;
}

@Injectable({ providedIn: 'root' })
export class AdminDashboardService {
  constructor(private http: HttpClient) {}

  getDashboard(): Observable<AdminDashboardResponse> {
    return this.http.get<AdminDashboardResponse>('/api/admin/dashboard');
  }
}
