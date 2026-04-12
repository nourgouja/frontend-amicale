import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { ResetPasswordModalComponent } from '../auth/reset-password-modal/reset-password-modal.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, ResetPasswordModalComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  constructor(public authService: AuthService) {}

  navLinks = [
    { label: 'Home',           route: '/home' },
    { label: 'Activities',     route: '/activities' },
    { label: 'Partners',       route: '/partners' },
    { label: 'Vote',           route: '/vote' },
    { label: 'Manage booking', route: '/manage-booking' },
  ];

  partnerLogos = [
    { src: 'partners-logos/telecom.png',      alt: 'Tunisie Telecom' },
    { src: 'partners-logos/traveltodo.png',    alt: 'Traveltodo' },
    { src: 'partners-logos/californiagym.png', alt: 'California Gym' },
    { src: 'partners-logos/samsung.png',       alt: 'Samsung' },
    { src: 'partners-logos/tunisair.png',      alt: 'Tunisair' },
    { src: 'partners-logos/hummel.png',        alt: 'Hummel' },
    { src: 'partners-logos/mastercard.png',    alt: 'Mastercard' },
  ];

  // tours count will come from API based on inscriptions per destination
  destinations = [
    { name: 'Djerba', tours: 30, image: 'destinations/djerba.jpg' },
    { name: 'Greece', tours: 6,  image: 'destinations/greece.jpg' },
    { name: 'Italy',  tours: 9,  image: 'destinations/italy.jpg'  },
    { name: 'Paris',  tours: 15, image: 'destinations/paris.jpg'  },
  ];

  steps = [
    {
      number: 1,
      color: '#ffac33',
      title: 'Choose Activity',
      description: "Browse our activities page to explore what's available and pick the one that suits you best.",
    },
    {
      number: 2,
      color: '#3d9a5c',
      title: 'Book Activity',
      description: 'Fill in the booking form with your details and submit your request to reserve your spot.',
    },
    {
      number: 3,
      color: '#9acd32',
      title: 'Make Payment',
      description: 'Contact a board member to complete your payment and confirm your booking.',
    },
  ];
}
