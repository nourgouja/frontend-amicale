import { Component, computed, inject } from '@angular/core';
import { AuthService } from '../core/services/auth.service';
import { SidebarService } from '../core/services/sidebar.service';
import { SidebarComponent } from '../shared/sidebar/sidebar.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [SidebarComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  private auth = inject(AuthService);
  sidebar = inject(SidebarService);

  today = new Date();

  dateLabel = this.today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).toUpperCase();

  userName = computed(() => {
    const email = this.auth.currentUser()?.email ?? '';
    const name = email.split('@')[0].replace(/[._]/g, ' ');
    return name.replace(/\b\w/g, c => c.toUpperCase());
  });

  userRole = computed(() => this.auth.currentUser()?.role ?? '');

  metrics = [
    { value: '12', label: 'ACTIVE BOOKINGS', progress: 67 },
    { value: '03', label: 'OPEN VOTES',      progress: 25 },
    { value: '48', label: 'LOCAL PARTNERS',  progress: 80 },
    { value: '07', label: 'ACTIVE COUPONS',  progress: 50 },
  ];

  activities = [
    { title: 'Lunch reservation confirmed', sub: 'Le Petit Bistro • Today, 12:30 PM',  color: 'rgba(2,102,84,0.1)' },
    { title: 'Coupon redeemed',             sub: 'Cinema Gaumont • Yesterday',         color: 'rgba(183,213,53,0.1)' },
    { title: 'Gym membership renewal',      sub: 'PureFit Studio • 3 days ago',        color: 'rgba(2,102,84,0.1)' },
  ];

  events = [
    { month: 'OCT', day: '18', title: 'Annual Gala Night',  time: '7:00 PM • MAIN HALL',  active: true  },
    { month: 'OCT', day: '24', title: 'Summer Travel',     time: '9:00 AM • Turkey',   active: false },
  ];

}
