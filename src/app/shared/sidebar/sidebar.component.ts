import { Component, inject } from '@angular/core';
import { SidebarService } from '../../core/services/sidebar.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  sidebar = inject(SidebarService);
  private auth = inject(AuthService);

  logout() {
    this.sidebar.closeMobile();
    this.auth.logout();
  }
}
