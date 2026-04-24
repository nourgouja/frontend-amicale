import { Component, Input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [DecimalPipe, LucideAngularModule],
  templateUrl: './kpi-card.component.html',
  styleUrl: './kpi-card.component.scss',
})
export class KpiCardComponent {
  @Input() label = '';
  @Input() value: number | string = 0;
  @Input() icon = 'activity';
  @Input() trend?: number;
  @Input() color: 'primary' | 'blue' | 'green' | 'orange' | 'purple' | 'red' = 'primary';
  @Input() unit = '';
  @Input() subtitle = '';

  get trendPositive(): boolean { return (this.trend ?? 0) >= 0; }
  get trendAbs(): number { return Math.abs(this.trend ?? 0); }
  get isNumeric(): boolean { return typeof this.value === 'number'; }
}
