import { Component, Input, Output, EventEmitter, computed, signal, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { getOffreTypeColor } from '../../utils/format.utils';

export interface CalendarOffre {
  id: number;
  titre: string;
  typeOffre: string;
  dateDebut: string;
  dateFin?: string | null;
}

@Component({
  selector: 'app-mini-calendar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mini-calendar.component.html',
  styleUrl: './mini-calendar.component.scss',
})
export class MiniCalendarComponent implements OnChanges {
  @Input() offres: CalendarOffre[] = [];
  @Output() dayClick = new EventEmitter<{ date: Date; offres: CalendarOffre[] }>();

  readonly today = new Date();
  viewDate = signal(new Date(this.today.getFullYear(), this.today.getMonth(), 1));

  readonly WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  ngOnChanges(): void {}

  monthLabel = computed(() =>
    this.viewDate().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
      .replace(/^\w/, c => c.toUpperCase())
  );

  weeks = computed(() => {
    const d = this.viewDate();
    const year = d.getFullYear();
    const month = d.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDow = (firstDay.getDay() + 6) % 7;

    const days: Date[] = [];
    for (let i = 0; i < startDow; i++) {
      days.push(new Date(year, month, 1 - (startDow - i)));
    }
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(year, month, day));
    }
    while (days.length % 7 !== 0) {
      days.push(new Date(year, month + 1, days.length - lastDay.getDate() - startDow + 1));
    }

    const result: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) result.push(days.slice(i, i + 7));
    return result;
  });

  isToday(day: Date): boolean {
    const t = this.today;
    return day.getDate() === t.getDate() &&
           day.getMonth() === t.getMonth() &&
           day.getFullYear() === t.getFullYear();
  }

  isCurrentMonth(day: Date): boolean {
    return day.getMonth() === this.viewDate().getMonth();
  }

  offresForDay(day: Date): CalendarOffre[] {
    return this.offres.filter(o => {
      const s = new Date(o.dateDebut);
      const e = o.dateFin ? new Date(o.dateFin) : s;
      const nd = new Date(day.getFullYear(), day.getMonth(), day.getDate());
      const ns = new Date(s.getFullYear(), s.getMonth(), s.getDate());
      const ne = new Date(e.getFullYear(), e.getMonth(), e.getDate());
      return nd >= ns && nd <= ne;
    });
  }

  dotsForDay(day: Date): string[] {
    const types = [...new Set(this.offresForDay(day).map(o => o.typeOffre))];
    return types.map(t => getOffreTypeColor(t));
  }

  labelsForDay(day: Date): { color: string; label: string }[] {
    return this.offresForDay(day).map(o => ({
      color: getOffreTypeColor(o.typeOffre),
      label: o.titre.length > 9 ? o.titre.slice(0, 9) + '…' : o.titre,
    }));
  }

  prevMonth(): void {
    const d = this.viewDate();
    this.viewDate.set(new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }

  nextMonth(): void {
    const d = this.viewDate();
    this.viewDate.set(new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }

  onDayClick(day: Date): void {
    this.dayClick.emit({ date: day, offres: this.offresForDay(day) });
  }
}
