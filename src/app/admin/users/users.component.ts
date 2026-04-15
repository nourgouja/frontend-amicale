import { Component, OnInit, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminUserService, UserResponse } from '../services/admin-user.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
})
export class AdminUsersComponent implements OnInit {
  users = signal<UserResponse[]>([]);
  totalElements = signal(0);
  totalPages = signal(0);
  currentPage = signal(0);
  readonly pageSize = 10;

  loading = signal(false);
  searchTerm = '';
  selectedRole = '';

  showCreateModal = signal(false);
  createLoading = signal(false);
  createError = signal('');
  showPassword = signal(false);

  showDeleteConfirm = signal(false);
  deletingUserId = signal<number | null>(null);

  createForm: FormGroup;

  readonly roles = [
    { value: 'ADMIN',         label: 'Admin' },
    { value: 'MEMBRE_BUREAU', label: 'Membre Bureau' },
    { value: 'ADHERENT',      label: 'Adhérent' },
  ];

  readonly postes = [
    { value: 'PRESIDENT',       label: 'Président' },
    { value: 'TRESORIER',       label: 'Trésorier' },
    { value: 'SECRETAIRE',      label: 'Secrétaire' },
    { value: 'RESPONSABLE_POLE', label: 'Responsable Pôle' },
  ];

  constructor(
    private userService: AdminUserService,
    private fb: FormBuilder,
  ) {
    this.createForm = this.fb.group({
      prenom:      ['', Validators.required],
      nom:         ['', Validators.required],
      email:       ['', [Validators.required, Validators.email]],
      role:        ['ADHERENT', Validators.required],
      motDePasse:  ['', [Validators.required, Validators.minLength(8)]],
      posteMembre: [''],
    });
  }

  ngOnInit(): void {
    this.loadUsers();
  }

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

  onSearch(): void {
    this.currentPage.set(0);
    this.loadUsers();
  }

  onRoleFilter(): void {
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

  openCreateModal(): void {
    this.createForm.reset({ role: 'ADHERENT' });
    this.createError.set('');
    this.showCreateModal.set(true);
  }

  closeCreateModal(): void {
    this.showCreateModal.set(false);
  }

  get selectedRoleValue(): string {
    return this.createForm.get('role')?.value ?? '';
  }

  onCreateUser(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }
    this.createLoading.set(true);
    this.createError.set('');
    const val = this.createForm.value;
    this.userService.createUser({
      email:       val.email,
      motDePasse:  val.motDePasse,
      nom:         val.nom,
      prenom:      val.prenom,
      role:        val.role,
      posteMembre: val.role === 'MEMBRE_BUREAU' ? val.posteMembre : undefined,
    }).subscribe({
      next: () => {
        this.createLoading.set(false);
        this.closeCreateModal();
        this.currentPage.set(0);
        this.loadUsers();
      },
      error: (err) => {
        this.createLoading.set(false);
        this.createError.set(err?.error?.message ?? 'Une erreur est survenue.');
      },
    });
  }

  onToggleStatus(user: UserResponse): void {
    const action = user.actif
      ? this.userService.deactivateUser(user.id)
      : this.userService.activateUser(user.id);
    action.subscribe({ next: () => this.loadUsers() });
  }

  confirmDelete(id: number): void {
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

  onResetPassword(id: number): void {
    this.userService.resetPassword(id).subscribe();
  }

  /* ── Helpers ── */
  initials(user: UserResponse): string {
    return ((user.prenom?.[0] ?? '') + (user.nom?.[0] ?? '')).toUpperCase();
  }

  formatDate(iso: string): string {
    if (!iso) return '—';
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  roleLabel(role: string): string {
    return { ADMIN: 'ADMIN', MEMBRE_BUREAU: 'MANAGER', ADHERENT: 'USER' }[role] ?? role;
  }

  roleBadgeClass(role: string): string {
    return `badge badge-${role.toLowerCase().replace('_', '-')}`;
  }

  hasError(field: string, error: string): boolean {
    const ctrl = this.createForm.get(field);
    return !!(ctrl?.touched && ctrl?.hasError(error));
  }
}
