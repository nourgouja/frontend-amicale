import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface OffreDashboardItem {
  id: number;
  titre: string;
  statut: string;
  placesRestantes: number;
  totalInscrits: number;
}

export interface AdminDashboardResponse {
  totalUtilisateurs: number;
  parRole: { [key: string]: number | undefined };
  offres: OffreDashboardItem[];
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
