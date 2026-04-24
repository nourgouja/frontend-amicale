import { Pipe, PipeTransform } from '@angular/core';
import { getOffreTypeLabel } from '../utils/format.utils';

@Pipe({ name: 'offreTypeLabel', standalone: true })
export class OffreTypeLabelPipe implements PipeTransform {
  transform(value: string): string {
    return getOffreTypeLabel(value);
  }
}
