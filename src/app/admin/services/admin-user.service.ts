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
  telephone?: string;
  matriculeStar?: string;
  posteMembre?: string;
  poleId?: number;
  poleNom?: string;
  poleTypesOffre?: string[];
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
  nom: string;
  prenom: string;
  role: string;
  telephone?: string;
  matriculeStar?: string;
  posteMembre?: string;
  poleId?: number;
  typesAutorisees?: string[];
}

export interface UpdateUserRequest {
  nom?: string;
  prenom?: string;
  email?: string;
  telephone?: string;
  matriculeStar?: string;
  role?: string;
  posteMembre?: string;
  poleId?: number;
  typesAutorisees?: string[];
}

@Injectable({ providedIn: 'root' })
export class AdminUserService {
  private readonly API = '/api/admin/utilisateurs';

  constructor(private http: HttpClient) {}

  getUsers(role?: string, search?: string, page = 0, size = 10, archived = false): Observable<PageResponse<UserResponse>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('actif', (!archived).toString()); // actif=true → active users, actif=false → archived users
    
    if (role) params = params.set('role', role);
    if (search?.trim()) params = params.set('search', search.trim());
    
    return this.http.get<PageResponse<UserResponse>>(this.API, { params });
  }

  createUser(req: CreateUserRequest): Observable<UserResponse> {
    return this.http.post<UserResponse>(this.API, req);
  }

  updateUser(id: number, req: UpdateUserRequest): Observable<UserResponse> {
    return this.http.put<UserResponse>(`${this.API}/${id}`, req);
  }

  toggleUserStatus(id: number, actif: boolean): Observable<UserResponse> {
    return this.http.patch<UserResponse>(`${this.API}/${id}/actif`, null, {
      params: new HttpParams().set('actif', actif.toString())
    });
  }

  archiveUser(id: number): Observable<UserResponse> {
    return this.toggleUserStatus(id, false);
  }

  activateUser(id: number): Observable<UserResponse> {
    return this.toggleUserStatus(id, true);
  }

  resetPassword(id: number): Observable<void> {
    return this.http.post<void>(`${this.API}/${id}/reinitialiser-mot-de-passe`, {});
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API}/${id}`);
  }
}