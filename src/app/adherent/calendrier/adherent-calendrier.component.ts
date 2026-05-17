import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

interface Offre {
  id: number;
  titre: string;
  typeOffre: string;
  statutOffre: string;
  dateDebut: string;
  dateFin: string | null;
  lieu: string | null;
  prixParPersonne: number | null;
  imageBase64?: string | null;
  imageType?: string | null;
  description?: string | null;
}

@Component({
  selector: 'app-adherent-calendrier',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './adherent-calendrier.component.html',
  styleUrl: './adherent-calendrier.component.scss',
})
export class AdherentCalendrierComponent implements OnInit {
  private http   = inject(HttpClient);
  private router = inject(Router);

  today    = new Date();
  viewDate = signal(new Date(this.today.getFullYear(), this.today.getMonth(), 1));
  offres   = signal<Offre[]>([]);
  loading  = signal(true);
  selected = signal<Offre | null>(null);

  readonly TYPE_COLORS: Record<string, string> = {
    VOYAGE:     '#3b82f6',
    SEJOUR:     '#10b981',
    ACTIVITE:   '#f59e0b',
    CONVENTION: '#8b5cf6',
    EVENEMENT:  '#ef4444',
  };

  readonly TYPE_LABELS: Record<string, string> = {
    VOYAGE: 'Voyage', SEJOUR: 'Séjour', ACTIVITE: 'Activité',
    CONVENTION: 'Convention', EVENEMENT: 'Événement',
  };

  readonly WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  ngOnInit(): void {
    this.http.get<Offre[]>('/api/offres/publiques').pipe(
      catchError(() => this.http.get<Offre[]>('/api/offres'))
    ).subscribe({
      next: res => { this.offres.set(res); this.loading.set(false); },
      error: ()  => this.loading.set(false),
    });
  }

  monthLabel = computed(() =>
    this.viewDate().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  );

  weeks = computed(() => {
    const d     = this.viewDate();
    const year  = d.getFullYear();
    const month = d.getMonth();
    const first = new Date(year, month, 1);
    const last  = new Date(year, month + 1, 0);
    const startDow = (first.getDay() + 6) % 7;

    const days: Date[] = [];
    for (let i = 0; i < startDow; i++)
      days.push(new Date(year, month, 1 - (startDow - i)));
    for (let n = 1; n <= last.getDate(); n++)
      days.push(new Date(year, month, n));
    while (days.length % 7 !== 0)
      days.push(new Date(year, month + 1, days.length - last.getDate() - startDow + 1));

    const result: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) result.push(days.slice(i, i + 7));
    return result;
  });

  offresForDay(day: Date): Offre[] {
    return this.offres().filter(o => {
      const s = this.dateOnly(new Date(o.dateDebut));
      const e = this.dateOnly(o.dateFin ? new Date(o.dateFin) : new Date(o.dateDebut));
      const d = this.dateOnly(day);
      return d >= s && d <= e;
    });
  }

  private dateOnly(d: Date): number {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  }

  isToday(d: Date): boolean {
    const t = this.today;
    return d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear();
  }

  isCurrentMonth(d: Date): boolean {
    return d.getMonth() === this.viewDate().getMonth();
  }

  prevMonth(): void {
    const d = this.viewDate();
    this.viewDate.set(new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }

  nextMonth(): void {
    const d = this.viewDate();
    this.viewDate.set(new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }

  goToToday(): void {
    this.viewDate.set(new Date(this.today.getFullYear(), this.today.getMonth(), 1));
  }

  colorFor(type: string): string { return this.TYPE_COLORS[type] ?? '#6b7280'; }
  labelFor(type: string): string { return this.TYPE_LABELS[type] ?? type; }

  openPreview(o: Offre): void  { this.selected.set(o); }
  closePreview(): void         { this.selected.set(null); }
  goToOffre(id: number): void  { this.router.navigate(['/adherent/offres', id]); }

  imageUrl(o: Offre): string | null {
    return o.imageBase64 && o.imageType ? `data:${o.imageType};base64,${o.imageBase64}` : null;
  }
}
