import { Pipe, PipeTransform } from '@angular/core';
import { formatDate } from '../utils/format.utils';

@Pipe({ name: 'formatDate', standalone: true })
export class FormatDatePipe implements PipeTransform {
  transform(value: string): string {
    return formatDate(value);
  }
}
