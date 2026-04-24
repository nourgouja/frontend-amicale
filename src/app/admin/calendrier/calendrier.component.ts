import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

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
  capaciteMax?: number | null;
  placesRestantes?: number | null;
}

@Component({
  selector: 'app-calendrier',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calendrier.component.html',
  styleUrl: './calendrier.component.scss',
})
export class CalendrierComponent implements OnInit {
  private http = inject(HttpClient);

  today = new Date();
  viewDate = signal(new Date(this.today.getFullYear(), this.today.getMonth(), 1));
  offres = signal<Offre[]>([]);
  loading = signal(true);
  selectedOffre = signal<Offre | null>(null);

  readonly TYPE_COLORS: Record<string, string> = {
    VOYAGE:     '#3b82f6',
    SEJOUR:     '#10b981',
    ACTIVITE:   '#f59e0b',
    CONVENTION: '#8b5cf6',
  };

  ngOnInit(): void {
    this.http.get<Offre[]>('/api/offres/all').subscribe({
      next: res => { this.offres.set(res); this.loading.set(false); },
      error: ()  => this.loading.set(false),
    });
  }

  monthLabel = computed(() => {
    return this.viewDate().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  });

  weeks = computed(() => {
    const d = this.viewDate();
    const year = d.getFullYear();
    const month = d.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay  = new Date(year, month + 1, 0);

    const startDow = (firstDay.getDay() + 6) % 7; // Monday = 0
    const days: Date[] = [];

    for (let i = 0; i < startDow; i++) {
      days.push(new Date(year, month, 1 - (startDow - i)));
    }
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d));
    }
    while (days.length % 7 !== 0) {
      days.push(new Date(year, month + 1, days.length - lastDay.getDate() - startDow + 1));
    }

    const result: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) result.push(days.slice(i, i + 7));
    return result;
  });

  offresForDay(day: Date): Offre[] {
    return this.offres().filter(o => {
      const start = new Date(o.dateDebut);
      const end   = o.dateFin ? new Date(o.dateFin) : start;
      const d = new Date(day.getFullYear(), day.getMonth(), day.getDate());
      const s = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      const e = new Date(end.getFullYear(),   end.getMonth(),   end.getDate());
      return d >= s && d <= e;
    });
  }

  isToday(day: Date): boolean {
    const t = this.today;
    return day.getDate() === t.getDate() &&
           day.getMonth() === t.getMonth() &&
           day.getFullYear() === t.getFullYear();
  }

  isCurrentMonth(day: Date): boolean {
    return day.getMonth() === this.viewDate().getMonth();
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

  colorFor(type: string): string {
    return this.TYPE_COLORS[type] ?? '#6b7280';
  }

  select(offre: Offre): void {
    this.selectedOffre.set(offre);
  }

  closeDetail(): void {
    this.selectedOffre.set(null);
  }

  imageUrl(o: Offre): string | null {
    if (!o.imageBase64 || !o.imageType) return null;
    return `data:${o.imageType};base64,${o.imageBase64}`;
  }

  inscrits(o: Offre): number {
    return Math.max(0, (o.capaciteMax ?? 0) - (o.placesRestantes ?? 0));
  }

  readonly WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
}
