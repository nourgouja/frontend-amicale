import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DemandeAdhesionResponse {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  statut: 'EN_ATTENTE' | 'APPROUVEE' | 'REFUSEE';
  createdAt: string;
}

export interface DemandeAdhesionRequest {
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
}

@Injectable({ providedIn: 'root' })
export class AdminAdhesionService {
  private readonly API = '/api/adhesion';

  constructor(private http: HttpClient) {}

  getDemandesEnAttente(): Observable<DemandeAdhesionResponse[]> {
    return this.http.get<DemandeAdhesionResponse[]>(this.API);
  }

  approuver(id: number): Observable<void> {
    return this.http.post<void>(`${this.API}/${id}/approuver`, {});
  }

  rejeter(id: number): Observable<void> {
    return this.http.put<void>(`${this.API}/${id}/rejeter`, {});
  }
}
