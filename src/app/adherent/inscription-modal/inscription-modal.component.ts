import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormArray, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

export interface InscriptionResult {
  id: number;
  offreTitre: string;
  statut: string;
  guests?: { nom: string; prenom?: string; age: number; sexe: string }[];
  totalPeople?: number;
}

type PeriodKey = 'COMPTANT' | 'MENSUEL' | 'TRIMESTRIEL' | 'SEMESTRIEL';

@Component({
  selector: 'app-inscription-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './inscription-modal.component.html',
  styleUrl: './inscription-modal.component.scss',
})
export class InscriptionModalComponent {
  @Input() offreId!: number;
  @Input() offreTitre = '';
  @Input() prixParPersonne: number | null = null;
  @Input() placesRestantes: number | null = null;
  @Input() typeOffre = '';

  @Output() submitted = new EventEmitter<InscriptionResult>();
  @Output() closed = new EventEmitter<void>();

  private fb   = inject(FormBuilder);
  private http = inject(HttpClient);

  submitting       = signal(false);
  error            = signal<string | null>(null);
  selectedPeriod   = signal<PeriodKey>('COMPTANT');

  readonly periodOptions: { key: PeriodKey; label: string; tranches: number; days: number; desc: string }[] = [
    { key: 'COMPTANT',    label: 'Comptant',      tranches: 1,  days: 0,   desc: '1 versement unique'       },
    { key: 'SEMESTRIEL',  label: 'Semestriel',    tranches: 2,  days: 180, desc: '2 versements / 6 mois'    },
    { key: 'TRIMESTRIEL', label: 'Trimestriel',   tranches: 4,  days: 90,  desc: '4 versements / 3 mois'    },
    { key: 'MENSUEL',     label: 'Mensuel',        tranches: 12, days: 30,  desc: '12 versements / 1 mois'   },
  ];

  get supportsPaymentChoice(): boolean {
    return this.typeOffre === 'VOYAGE' || this.typeOffre === 'SEJOUR';
  }

  get currentPeriod() {
    return this.periodOptions.find(o => o.key === this.selectedPeriod())!;
  }

  get nbTranches(): number { return this.currentPeriod.tranches; }
  get daysBetween(): number { return this.currentPeriod.days; }

  get trancheAmount(): number | null {
    if (!this.prixParPersonne || !this.totalPeople) return null;
    const total = this.prixParPersonne * this.totalPeople;
    return Math.round(total / this.nbTranches * 100) / 100;
  }

  trancheRange(): number[] {
    return Array.from({ length: this.nbTranches }, (_, i) => i + 1);
  }

  trancheDueDate(index: number): Date {
    const d = new Date();
    d.setDate(d.getDate() + 7 + this.daysBetween * index);
    return d;
  }

  selectPeriod(key: PeriodKey): void { this.selectedPeriod.set(key); }

  form = this.fb.group({ guests: this.fb.array([]) });

  get guests(): FormArray { return this.form.get('guests') as FormArray; }
  guestGroup(i: number): FormGroup { return this.guests.at(i) as FormGroup; }

  get totalPeople(): number { return 1 + this.guests.length; }

  get totalPrice(): number | null {
    return this.prixParPersonne != null ? this.prixParPersonne * this.totalPeople : null;
  }

  get maxGuests(): number {
    return Math.max(0, Math.min(9, (this.placesRestantes ?? 10) - 1));
  }

  addGuest(): void {
    if (this.guests.length >= this.maxGuests) return;
    this.guests.push(this.fb.group({
      nom:    ['', Validators.required],
      prenom: [''],
      age:    [null, [Validators.required, Validators.min(0), Validators.max(120)]],
      sexe:   ['M', Validators.required],
    }));
  }

  removeGuest(i: number): void { this.guests.removeAt(i); }

  submit(): void {
    if (this.form.invalid || this.submitting()) return;
    this.submitting.set(true);
    this.error.set(null);

    const body: Record<string, unknown> = { guests: this.guests.value };
    if (this.supportsPaymentChoice) {
      body['paymentPeriod'] = this.selectedPeriod();
    }

    this.http.post<InscriptionResult>(
      `/api/inscriptions/inscrire/${this.offreId}`,
      body
    ).subscribe({
      next: res => { this.submitting.set(false); this.submitted.emit(res); },
      error: err => {
        this.submitting.set(false);
        const msg = err?.error?.message ?? err?.error ?? "L'inscription a échoué. Réessayez.";
        this.error.set(typeof msg === 'string' ? msg : JSON.stringify(msg));
      },
    });
  }

  close(): void { if (!this.submitting()) this.closed.emit(); }
}
