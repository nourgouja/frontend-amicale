import { Component, Input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [DecimalPipe, LucideAngularModule],
  templateUrl: './kpi-card.component.html',
  styleUrl: './kpi-card.component.scss',
  host: { style: 'display: flex; flex-direction: column;' },
})
export class KpiCardComponent {
  @Input() label = '';
  @Input() value: number | string = 0;
  @Input() icon = 'activity';
  @Input() color: 'primary' | 'blue' | 'green' | 'orange' | 'purple' | 'red' = 'primary';
  @Input() unit = '';
  @Input() subtitle = '';
  @Input() badge = '';
  @Input() badgeVariant: 'green' | 'orange' | 'red' | 'muted' = 'green';
  @Input() breakdown: { label: string; count: number }[] = [];

  get isNumeric(): boolean { return typeof this.value === 'number'; }
}
