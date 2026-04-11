import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgStyle } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, NgStyle],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  navLinks = ['Home', 'Activities', 'Partners', 'Vote', 'Manage booking'];

  destinations = [
    { name: 'Rome', activities: 6, tours: 3 },
    { name: 'Greece', activities: 1, tours: 0 },
    { name: 'Italy', activities: 63, tours: 9 },
  ];

  steps = [
    {
      number: 1,
      color: '#2dafde',
      title: 'Choose Activity',
      description:
        'Browse our activities page to explore what\'s available and pick the one that suits you best.',
    },
    {
      number: 2,
      color: '#ffac33',
      title: 'Book Activity',
      description:
        'Fill in the booking form with your details and submit your request to reserve your spot.',
    },
    {
      number: 3,
      color: '#14435a',
      title: 'Make Payment',
      description:
        'Contact a board member to complete your payment and confirm your booking.',
    },
  ];
}
