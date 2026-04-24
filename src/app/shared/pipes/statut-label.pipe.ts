import { Pipe, PipeTransform } from '@angular/core';
import { getStatutOffreLabel, getStatutInscriptionLabel, getStatutCotisationLabel } from '../utils/format.utils';

@Pipe({ name: 'statutLabel', standalone: true })
export class StatutLabelPipe implements PipeTransform {
  transform(value: string, type: 'offre' | 'inscription' | 'cotisation' = 'offre'): string {
    if (type === 'inscription') return getStatutInscriptionLabel(value);
    if (type === 'cotisation') return getStatutCotisationLabel(value);
    return getStatutOffreLabel(value);
  }
}
