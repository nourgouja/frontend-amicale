import { Component, OnInit, signal, computed, HostListener } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { AdminUserService, UserResponse } from '../services/admin-user.service';
import { AdminAdhesionService, DemandeAdhesionResponse } from '../services/admin-adhesion.service';

interface PoleOption { id: number; nom: string; }

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
})
export class AdminUsersComponent implements OnInit {

  /* ── Users list ── */
  users         = signal<UserResponse[]>([]);
  totalElements = signal(0);
  totalPages    = signal(0);
  currentPage   = signal(0);
  readonly pageSize = 10;
  loading    = signal(false);
  searchTerm = '';
  selectedRole = '';

  /* ── Poles ── */
  poles = signal<PoleOption[]>([]);

  /* ── Demandes d'adhésion ── */
  demandes        = signal<DemandeAdhesionResponse[]>([]);
  demandesLoading = signal(false);

  showApproveConfirm = signal(false);
  approvingId        = signal<number | null>(null);
  approveLoading     = signal(false);
  showRejectConfirm  = signal(false);
  rejectingId        = signal<number | null>(null);
  rejectLoading      = signal(false);
  rejectError        = signal('');

  /* ── Three-dots menu ── */
  openMenuId = signal<number | null>(null);

  /* ── Create modal ── */
  showCreateModal = signal(false);
  createLoading   = signal(false);
  createError     = signal('');
  createForm: FormGroup;

  /* ── Edit modal ── */
  showEditModal  = signal(false);
  editLoading    = signal(false);
  editError      = signal('');
  editingUser    = signal<UserResponse | null>(null);
  editForm: FormGroup;

  /* ── Archive / Reactivate confirm ── */
  showArchiveConfirm = signal(false);
  archivingUserId    = signal<number | null>(null);
  showReactivateConfirm = signal(false);
  reactivatingUserId = signal<number | null>(null);
  reactivateLoading  = signal(false);

  /* ── Delete confirm ── */
  showDeleteConfirm  = signal(false);
  deletingUserId     = signal<number | null>(null);

  /* ── Reset Password ── */
  showResetPasswordConfirm = signal(false);
  resetPasswordUserId = signal<number | null>(null);
  resetPasswordLoading = signal(false);

  readonly roles = [
    { value: 'ADMIN',         label: 'Admin' },
    { value: 'MEMBRE_BUREAU', label: 'Membre Bureau' },
    { value: 'ADHERENT',      label: 'Adhérent' },
  ];

  readonly postes = [
    { value: 'PRESIDENT',       label: 'Président' },
    { value: 'TRESORIER',       label: 'Trésorier' },
    { value: 'RESPONSABLE_POLE', label: 'Responsable de Pôle' },
  ];

  readonly tabs = [
    { label: 'Tout',          value: '',         isArchived: false },
    { label: 'Admin',         value: 'ADMIN',    isArchived: false },
    { label: 'Membre Bureau', value: 'MEMBRE_BUREAU', isArchived: false },
    { label: 'Adhérent',      value: 'ADHERENT', isArchived: false },
    { label: 'Archivés',      value: 'ARCHIVED', isArchived: true },
  ];

  /* ── Mirror form values into signals ── */
  createRole  = signal('ADHERENT');
  createPoste = signal('');
  editRole    = signal('');
  editPoste   = signal('');

  createIsBureau      = computed(() => this.createRole() === 'MEMBRE_BUREAU');
  createIsResponsable = computed(() => this.createIsBureau() && this.createPoste() === 'RESPONSABLE_POLE');
  editIsBureau        = computed(() => this.editRole() === 'MEMBRE_BUREAU');
  editIsResponsable   = computed(() => this.editIsBureau() && this.editPoste() === 'RESPONSABLE_POLE');

  constructor(
    private userService: AdminUserService,
    private adhesionService: AdminAdhesionService,
    private http: HttpClient,
    private fb: FormBuilder,
  ) {
    this.createForm = this.fb.group({
      prenom:        ['', Validators.required],
      nom:           ['', Validators.required],
      email:         ['', [Validators.required, Validators.email]],
      telephone:     [''],
      matriculeStar: [''],
      role:          ['ADHERENT', Validators.required],
      poste:         [''],
      poleId:        [''],
    });

    this.editForm = this.fb.group({
      prenom:        ['', Validators.required],
      nom:           ['', Validators.required],
      email:         ['', [Validators.required, Validators.email]],
      telephone:     [''],
      matriculeStar: [''],
      role:          ['', Validators.required],
      poste:         [''],
      poleId:        [''],
    });
  }

  ngOnInit(): void {
    this.loadUsers();
    this.loadDemandes();
    this.loadPoles();
  }

  /* ════════════════ PÔLES ════════════════ */
  loadPoles(): void {
    this.http.get<PoleOption[]>('/api/poles').subscribe({
      next: list => this.poles.set(list),
      error: () => {},
    });
  }

  /* ════════════════ DEMANDES D'ADHÉSION ════════════════ */
  loadDemandes(): void {
    this.demandesLoading.set(true);
    this.adhesionService.getDemandesEnAttente().subscribe({
      next: (list) => { this.demandes.set(list); this.demandesLoading.set(false); },
      error: () => this.demandesLoading.set(false),
    });
  }

  openApproveConfirm(id: number): void { this.approvingId.set(id); this.showApproveConfirm.set(true); }
  cancelApprove(): void { this.showApproveConfirm.set(false); this.approvingId.set(null); }

  executeApprove(): void {
    const id = this.approvingId();
    if (id == null) return;
    this.approveLoading.set(true);
    this.adhesionService.approuver(id).subscribe({
      next: () => {
        this.approveLoading.set(false);
        this.showApproveConfirm.set(false);
        this.approvingId.set(null);
        this.loadDemandes();
        this.loadUsers();
      },
      error: () => this.approveLoading.set(false),
    });
  }

  openRejectConfirm(id: number): void { this.rejectingId.set(id); this.rejectError.set(''); this.showRejectConfirm.set(true); }
  cancelReject(): void { this.showRejectConfirm.set(false); this.rejectingId.set(null); this.rejectError.set(''); }

  executeReject(): void {
    const id = this.rejectingId();
    if (id == null) return;
    this.rejectLoading.set(true);
    this.rejectError.set('');
    this.adhesionService.rejeter(id).subscribe({
      next: () => {
        this.rejectLoading.set(false);
        this.showRejectConfirm.set(false);
        this.rejectingId.set(null);
        this.loadDemandes();
      },
      error: (err) => {
        this.rejectLoading.set(false);
        this.rejectError.set(err?.error?.message ?? 'Une erreur est survenue.');
      },
    });
  }

  /* ════════════════ USERS ════════════════ */
  loadUsers(): void {
    this.loading.set(true);
    const isArchived = this.selectedRole === 'ARCHIVED';
    const role = isArchived ? undefined : (this.selectedRole || undefined);
    
    this.userService.getUsers(role, this.searchTerm || undefined, this.currentPage(), this.pageSize, isArchived).subscribe({
      next: (page) => {
        this.users.set(page.content);
        this.totalElements.set(page.totalElements);
        this.totalPages.set(page.totalPages);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  selectTab(role: string): void {
    this.selectedRole = role;
    this.currentPage.set(0);
    this.loadUsers();
  }

  onSearch(): void { this.currentPage.set(0); this.loadUsers(); }
  prevPage(): void { if (this.currentPage() > 0) { this.currentPage.update(p => p - 1); this.loadUsers(); } }
  nextPage(): void { if (this.currentPage() + 1 < this.totalPages()) { this.currentPage.update(p => p + 1); this.loadUsers(); } }

  toggleMenu(id: number): void { this.openMenuId.update(cur => cur === id ? null : id); }
  closeMenu(): void { this.openMenuId.set(null); }

  @HostListener('document:click')
  onDocumentClick(): void { this.openMenuId.set(null); }

  /* ── Create modal ── */
  openCreateModal(): void {
    this.createForm.reset({ role: 'ADHERENT', poste: '', poleId: '' });
    this.createRole.set('ADHERENT');
    this.createPoste.set('');
    this.createError.set('');
    this.showCreateModal.set(true);
  }

  closeCreateModal(): void { this.showCreateModal.set(false); }

  onCreateUser(): void {
    if (this.createForm.invalid) { this.createForm.markAllAsTouched(); return; }
    this.createLoading.set(true);
    this.createError.set('');
    const val = this.createForm.value;
    this.userService.createUser({
      email: val.email,
      nom: val.nom,
      prenom: val.prenom,
      role: val.role,
      telephone: val.telephone || undefined,
      matriculeStar: val.matriculeStar || undefined,
      posteMembre: val.role === 'MEMBRE_BUREAU' ? val.poste || undefined : undefined,
      poleId: (val.role === 'MEMBRE_BUREAU' && val.poste === 'RESPONSABLE_POLE' && val.poleId) ? Number(val.poleId) : undefined,
    }).subscribe({
      next: () => { this.createLoading.set(false); this.closeCreateModal(); this.currentPage.set(0); this.loadUsers(); },
      error: (err) => { this.createLoading.set(false); this.createError.set(err?.error?.message ?? 'Un utilisateur avec cet email existe déjà.'); },
    });
  }

  /* ── Edit modal ── */
  openEditModal(user: UserResponse): void {
    this.closeMenu();
    this.editingUser.set(user);
    this.editRole.set(user.role);
    this.editPoste.set(user.posteMembre ?? '');
    this.editForm.patchValue({
      prenom: user.prenom,
      nom: user.nom,
      email: user.email,
      telephone: user.telephone ?? '',
      matriculeStar: user.matriculeStar ?? '',
      role: user.role,
      poste: user.posteMembre ?? '',
      poleId: user.poleId ?? '',
    });
    this.editError.set('');
    this.showEditModal.set(true);
  }

  closeEditModal(): void { this.showEditModal.set(false); this.editingUser.set(null); }

  onEditUser(): void {
    if (this.editForm.invalid) { this.editForm.markAllAsTouched(); return; }
    const user = this.editingUser();
    if (!user) return;
    this.editLoading.set(true);
    this.editError.set('');
    const val = this.editForm.value;
    this.userService.updateUser(user.id, {
      nom: val.nom,
      prenom: val.prenom,
      email: val.email,
      telephone: val.telephone || undefined,
      matriculeStar: val.matriculeStar || undefined,
      role: val.role,
      posteMembre: val.role === 'MEMBRE_BUREAU' ? val.poste || undefined : undefined,
      poleId: (val.role === 'MEMBRE_BUREAU' && val.poste === 'RESPONSABLE_POLE' && val.poleId) ? Number(val.poleId) : undefined,
    }).subscribe({
      next: () => { this.editLoading.set(false); this.closeEditModal(); this.loadUsers(); },
      error: (err) => { this.editLoading.set(false); this.editError.set(err?.error?.message ?? 'Une erreur est survenue.'); },
    });
  }

  /* ── Role changes ── */
  onCreateRoleChange(): void {
    const role = this.createForm.get('role')?.value ?? '';
    this.createRole.set(role);
    this.createPoste.set('');
    this.createForm.patchValue({ poste: '', poleId: '' });
  }

  onCreatePosteChange(): void {
    const poste = this.createForm.get('poste')?.value ?? '';
    this.createPoste.set(poste);
    this.createForm.patchValue({ poleId: '' });
  }

  onEditRoleChange(): void {
    const role = this.editForm.get('role')?.value ?? '';
    this.editRole.set(role);
    this.editPoste.set('');
    this.editForm.patchValue({ poste: '', poleId: '' });
  }

  onEditPosteChange(): void {
    const poste = this.editForm.get('poste')?.value ?? '';
    this.editPoste.set(poste);
    this.editForm.patchValue({ poleId: '' });
  }

  /* ── Archive ── */
  confirmArchive(id: number): void {
    this.closeMenu();
    this.archivingUserId.set(id);
    this.showArchiveConfirm.set(true);
  }

  cancelArchive(): void {
    this.showArchiveConfirm.set(false);
    this.archivingUserId.set(null);
  }

  executeArchive(): void {
    const id = this.archivingUserId();
    if (id == null) return;
    this.userService.archiveUser(id).subscribe({
      next: () => {
        this.showArchiveConfirm.set(false);
        this.archivingUserId.set(null);
        this.loadUsers();
      },
      error: () => {},
    });
  }

  /* ── Reactivate ── */
  confirmReactivate(id: number): void {
    this.closeMenu();
    this.reactivatingUserId.set(id);
    this.showReactivateConfirm.set(true);
  }

  cancelReactivate(): void {
    this.showReactivateConfirm.set(false);
    this.reactivatingUserId.set(null);
  }

  executeReactivate(): void {
    const id = this.reactivatingUserId();
    if (id == null) return;
    this.reactivateLoading.set(true);
    this.userService.activateUser(id).subscribe({
      next: () => {
        this.reactivateLoading.set(false);
        this.showReactivateConfirm.set(false);
        this.reactivatingUserId.set(null);
        this.loadUsers();
      },
      error: () => this.reactivateLoading.set(false),
    });
  }

  /* ── Reset Password ── */
  confirmResetPassword(id: number): void {
    this.resetPasswordUserId.set(id);
    this.showResetPasswordConfirm.set(true);
  }

  cancelResetPassword(): void {
    this.showResetPasswordConfirm.set(false);
    this.resetPasswordUserId.set(null);
  }

  executeResetPassword(): void {
    const id = this.resetPasswordUserId();
    if (id == null) return;
    this.resetPasswordLoading.set(true);
    this.userService.resetPassword(id).subscribe({
      next: () => {
        this.resetPasswordLoading.set(false);
        this.showResetPasswordConfirm.set(false);
        this.resetPasswordUserId.set(null);
        this.loadUsers();
      },
      error: () => this.resetPasswordLoading.set(false),
    });
  }

  /* ── Delete ── */
  confirmDelete(id: number): void {
    this.closeMenu();
    this.deletingUserId.set(id);
    this.showDeleteConfirm.set(true);
  }

  cancelDelete(): void {
    this.showDeleteConfirm.set(false);
    this.deletingUserId.set(null);
  }

  executeDelete(): void {
    const id = this.deletingUserId();
    if (id == null) return;
    this.userService.deleteUser(id).subscribe({
      next: () => {
        this.showDeleteConfirm.set(false);
        this.deletingUserId.set(null);
        this.loadUsers();
      },
    });
  }

  /* ── Helpers ── */
  fullName(user: UserResponse): string { return `${user.prenom ?? ''} ${user.nom ?? ''}`.trim(); }
  demandeFullName(d: DemandeAdhesionResponse): string { return `${d.prenom ?? ''} ${d.nom ?? ''}`.trim(); }
  demandeInitials(d: DemandeAdhesionResponse): string { return ((d.prenom?.[0] ?? '') + (d.nom?.[0] ?? '')).toUpperCase(); }
  initials(user: UserResponse): string { return ((user.prenom?.[0] ?? '') + (user.nom?.[0] ?? '')).toUpperCase(); }

  formatDate(iso: string): string {
    if (!iso) return '—';
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  }

  roleLabel(role: string): string { return { ADMIN: 'Admin', MEMBRE_BUREAU: 'Membre Bureau', ADHERENT: 'Adhérent' }[role] ?? role; }

  posteLabel(poste: string | undefined): string {
    const map: Record<string, string> = { PRESIDENT: 'Président', TRESORIER: 'Trésorier', SECRETAIRE: 'Secrétaire', RESPONSABLE_POLE: 'Resp. de Pôle' };
    return poste ? (map[poste] ?? poste) : '—';
  }

  roleBadgeClass(role: string): string {
    const map: Record<string, string> = { ADMIN: 'badge-admin', MEMBRE_BUREAU: 'badge-bureau', ADHERENT: 'badge-adherent' };
    return `badge ${map[role] ?? 'badge-adherent'}`;
  }

  hasCreateError(field: string, error: string): boolean { const ctrl = this.createForm.get(field); return !!(ctrl?.touched && ctrl?.hasError(error)); }
  hasEditError(field: string, error: string): boolean { const ctrl = this.editForm.get(field); return !!(ctrl?.touched && ctrl?.hasError(error)); }
}