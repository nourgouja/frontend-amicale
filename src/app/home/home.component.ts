import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { ResetPasswordModalComponent } from '../auth/reset-password-modal/reset-password-modal.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [ResetPasswordModalComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  constructor(public authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    if (!this.authService.firstLogin()) {
      this.router.navigate([this.authService.getDashboardRoute()]);
    }
  }
}
