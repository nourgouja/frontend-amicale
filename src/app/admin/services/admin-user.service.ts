import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface UserResponse {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  role: string;
  actif: boolean;
  createdAt: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface CreateUserRequest {
  email: string;
  motDePasse: string;
  nom: string;
  prenom: string;
  role: string;
  posteMembre?: string;
  poleId?: number;
}

@Injectable({ providedIn: 'root' })
export class AdminUserService {
  private readonly API = '/api/admin/utilisateurs';

  constructor(private http: HttpClient) {}

  getUsers(role?: string, search?: string, page = 0, size = 10): Observable<PageResponse<UserResponse>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    if (role) params = params.set('role', role);
    if (search?.trim()) params = params.set('search', search.trim());
    return this.http.get<PageResponse<UserResponse>>(this.API, { params });
  }

  createUser(req: CreateUserRequest): Observable<UserResponse> {
    return this.http.post<UserResponse>(this.API, req);
  }

  activateUser(id: number): Observable<void> {
    return this.http.put<void>(`${this.API}/${id}/activer`, {});
  }

  deactivateUser(id: number): Observable<void> {
    return this.http.put<void>(`${this.API}/${id}/desactiver`, {});
  }

  resetPassword(id: number): Observable<void> {
    return this.http.put<void>(`${this.API}/${id}/reset-password`, {});
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API}/${id}`);
  }
}
