import { Pipe, PipeTransform } from '@angular/core';
import { getRoleLabel } from '../utils/format.utils';

@Pipe({ name: 'roleLabel', standalone: true })
export class RoleLabelPipe implements PipeTransform {
  transform(value: string): string {
    return getRoleLabel(value);
  }
}
