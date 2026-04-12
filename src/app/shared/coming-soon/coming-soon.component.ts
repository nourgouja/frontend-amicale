import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-coming-soon',
  standalone: true,
  template: `<p style="padding:40px;font-family:'Poppins',sans-serif;">{{ title() }} — coming soon</p>`,
})
export class ComingSoonComponent {
  private route = inject(ActivatedRoute);
  title = toSignal(this.route.data.pipe(map((d) => d['title'] ?? '')), { initialValue: '' });
}
