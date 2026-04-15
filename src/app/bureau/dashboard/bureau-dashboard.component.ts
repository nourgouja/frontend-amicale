import { Component } from '@angular/core';

@Component({
  selector: 'app-bureau-dashboard',
  standalone: true,
  template: `
    <div class="blank-dashboard">
      <div class="placeholder">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24"
          fill="none" stroke="#0d6a63" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
          <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
        </svg>
        <h2>Tableau de bord — Membre Bureau</h2>
        <p>Cette section est en cours de développement.</p>
      </div>
    </div>
  `,
  styles: [`
    .blank-dashboard {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 60vh;
      font-family: 'Poppins', sans-serif;
    }
    .placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 14px;
      text-align: center;
      color: #626263;
    }
    h2 { font-size: 18px; font-weight: 600; color: #181818; margin: 0; }
    p  { font-size: 13px; font-weight: 400; margin: 0; }
  `],
})
export class BureauDashboardComponent {}
