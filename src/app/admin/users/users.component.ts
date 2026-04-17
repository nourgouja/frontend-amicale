import { Component, OnInit, signal, HostListener } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminUserService, UserResponse } from '../services/admin-user.service';
import { AdminAdhesionService, DemandeAdhesionResponse } from '../services/admin-adhesion.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
})
export class AdminUsersComponent implements OnInit {

  /* ── Users list ── */
  users = signal<UserResponse[]>([]);
  totalElements = signal(0);
  totalPages = signal(0);
  currentPage = signal(0);
  readonly pageSize = 10;
  loading = signal(false);
  searchTerm = '';
  selectedRole = '';

  /** Counts per role tab — populated lazily on first visit to each tab */
  tabCounts = signal<Record<string, number>>({ '': 0 });

  /* ── Demandes d'adhésion ── */
  demandes = signal<DemandeAdhesionResponse[]>([]);
  demandesLoading = signal(false);

  /* Approve confirm */
  showApproveConfirm = signal(false);
  approvingId = signal<number | null>(null);
  approveLoading = signal(false);

  /* Reject confirm */
  showRejectConfirm = signal(false);
  rejectingId = signal<number | null>(null);

  /* ── Three-dots menu ── */
  openMenuId = signal<number | null>(null);

  /* ── Create modal ── */
  showCreateModal = signal(false);
  createLoading = signal(false);
  createError = signal('');
  createForm: FormGroup;

  /* ── Edit modal ── */
  showEditModal = signal(false);
  editLoading = signal(false);
  editError = signal('');
  editingUser = signal<UserResponse | null>(null);
  editForm: FormGroup;

  /* ── Delete confirm ── */
  showDeleteConfirm = signal(false);
  deletingUserId = signal<number | null>(null);

  /* ── Archive confirm ── */
  showArchiveConfirm = signal(false);
  archivingUserId = signal<number | null>(null);

  readonly roles = [
    { value: 'ADMIN',         label: 'Admin' },
    { value: 'MEMBRE_BUREAU', label: 'Membre Bureau' },
    { value: 'ADHERENT',      label: 'Adhérent' },
  ];

  readonly tabs = [
    { label: 'Tout',          value: '' },
    { label: 'Admin',         value: 'ADMIN' },
    { label: 'Membre Bureau', value: 'MEMBRE_BUREAU' },
    { label: 'Adhérent',      value: 'ADHERENT' },
  ];

  constructor(
    private userService: AdminUserService,
    private adhesionService: AdminAdhesionService,
    private fb: FormBuilder,
  ) {
    this.createForm = this.fb.group({
      prenom:    ['', Validators.required],
      nom:       ['', Validators.required],
      email:     ['', [Validators.required, Validators.email]],
      telephone: [''],
      role:      ['ADHERENT', Validators.required],
    });

    this.editForm = this.fb.group({
      prenom:    ['', Validators.required],
      nom:       ['', Validators.required],
      email:     ['', [Validators.required, Validators.email]],
      telephone: [''],
      role:      ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadUsers();
    this.loadDemandes();
  }

  /* ════════════════ DEMANDES D'ADHÉSION ════════════════ */

  loadDemandes(): void {
    this.demandesLoading.set(true);
    this.adhesionService.getDemandesEnAttente().subscribe({
      next: (list) => { this.demandes.set(list); this.demandesLoading.set(false); },
      error: ()     => this.demandesLoading.set(false),
    });
  }

  openApproveConfirm(id: number): void {
    this.approvingId.set(id);
    this.showApproveConfirm.set(true);
  }

  cancelApprove(): void {
    this.showApproveConfirm.set(false);
    this.approvingId.set(null);
  }

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

  openRejectConfirm(id: number): void {
    this.rejectingId.set(id);
    this.showRejectConfirm.set(true);
  }

  cancelReject(): void {
    this.showRejectConfirm.set(false);
    this.rejectingId.set(null);
  }

  executeReject(): void {
    const id = this.rejectingId();
    if (id == null) return;
    this.adhesionService.rejeter(id).subscribe({
      next: () => {
        this.showRejectConfirm.set(false);
        this.rejectingId.set(null);
        this.loadDemandes();
      },
    });
  }

  /* ════════════════ USERS ════════════════ */

  loadUsers(): void {
    this.loading.set(true);
    this.userService
      .getUsers(this.selectedRole || undefined, this.searchTerm || undefined, this.currentPage(), this.pageSize)
      .subscribe({
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

  onSearch(): void {
    this.currentPage.set(0);
    this.loadUsers();
  }

  prevPage(): void {
    if (this.currentPage() > 0) {
      this.currentPage.update(p => p - 1);
      this.loadUsers();
    }
  }

  nextPage(): void {
    if (this.currentPage() + 1 < this.totalPages()) {
      this.currentPage.update(p => p + 1);
      this.loadUsers();
    }
  }

  /* ── Three-dots menu ── */
  toggleMenu(id: number): void {
    this.openMenuId.update(cur => cur === id ? null : id);
  }

  closeMenu(): void { this.openMenuId.set(null); }

  @HostListener('document:click')
  onDocumentClick(): void { this.openMenuId.set(null); }

  /* ── Create modal ── */
  openCreateModal(): void {
    this.createForm.reset({ role: 'ADHERENT' });
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
      email:     val.email,
      nom:       val.nom,
      prenom:    val.prenom,
      role:      val.role,
      telephone: val.telephone || undefined,
    }).subscribe({
      next: () => {
        this.createLoading.set(false);
        this.closeCreateModal();
        this.currentPage.set(0);
        this.loadUsers();
      },
      error: (err) => {
        this.createLoading.set(false);
        this.createError.set(err?.error?.message ?? 'Un utilisateur avec cet email existe déjà.');
      },
    });
  }

  /* ── Edit modal ── */
  openEditModal(user: UserResponse): void {
    this.closeMenu();
    this.editingUser.set(user);
    this.editForm.patchValue({
      prenom:    user.prenom,
      nom:       user.nom,
      email:     user.email,
      telephone: user.telephone ?? '',
      role:      user.role,
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
      nom:       val.nom,
      prenom:    val.prenom,
      email:     val.email,
      telephone: val.telephone || undefined,
      role:      val.role,
    }).subscribe({
      next: () => { this.editLoading.set(false); this.closeEditModal(); this.loadUsers(); },
      error: (err) => {
        this.editLoading.set(false);
        this.editError.set(err?.error?.message ?? 'Une erreur est survenue.');
      },
    });
  }

  /* ── Archive ── */
  confirmArchive(id: number): void {
    this.closeMenu();
    this.archivingUserId.set(id);
    this.showArchiveConfirm.set(true);
  }

  cancelArchive(): void { this.showArchiveConfirm.set(false); this.archivingUserId.set(null); }

  executeArchive(): void {
    const id = this.archivingUserId();
    if (id == null) return;
    this.userService.archiveUser(id).subscribe({
      next: () => {
        this.showArchiveConfirm.set(false);
        this.archivingUserId.set(null);
        this.loadUsers();
      },
    });
  }

  /* ── Delete ── */
  confirmDelete(id: number): void {
    this.closeMenu();
    this.deletingUserId.set(id);
    this.showDeleteConfirm.set(true);
  }

  cancelDelete(): void { this.showDeleteConfirm.set(false); this.deletingUserId.set(null); }

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
  fullName(user: UserResponse): string {
    return `${user.prenom ?? ''} ${user.nom ?? ''}`.trim();
  }

  demandeFullName(d: DemandeAdhesionResponse): string {
    return `${d.prenom ?? ''} ${d.nom ?? ''}`.trim();
  }

  demandeInitials(d: DemandeAdhesionResponse): string {
    return ((d.prenom?.[0] ?? '') + (d.nom?.[0] ?? '')).toUpperCase();
  }

  initials(user: UserResponse): string {
    return ((user.prenom?.[0] ?? '') + (user.nom?.[0] ?? '')).toUpperCase();
  }

  formatDate(iso: string): string {
    if (!iso) return '—';
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  }

  roleLabel(role: string): string {
    return { ADMIN: 'Admin', MEMBRE_BUREAU: 'Membre Bureau', ADHERENT: 'Adhérent' }[role] ?? role;
  }

  roleBadgeClass(role: string): string {
    const map: Record<string, string> = {
      ADMIN:         'badge-admin',
      MEMBRE_BUREAU: 'badge-bureau',
      ADHERENT:      'badge-adherent',
    };
    return `badge ${map[role] ?? 'badge-adherent'}`;
  }

  hasCreateError(field: string, error: string): boolean {
    const ctrl = this.createForm.get(field);
    return !!(ctrl?.touched && ctrl?.hasError(error));
  }

  hasEditError(field: string, error: string): boolean {
    const ctrl = this.editForm.get(field);
    return !!(ctrl?.touched && ctrl?.hasError(error));
  }
}
