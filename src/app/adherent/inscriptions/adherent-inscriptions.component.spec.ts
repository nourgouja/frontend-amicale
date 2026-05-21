import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AdherentInscriptionsComponent } from './adherent-inscriptions.component';

const mockInscriptions = [
  {
    id: 1, offreTitre: 'Voyage Djerba', offreId: 10, typeOffre: 'VOYAGE',
    dateInscription: '2024-05-01', statut: 'APPROVED', montant: 800,
    dateDebutOffre: '2099-06-01', totalPeople: 2,
    echeances: [
      { id: 1, numero: 1, montant: 400, dateEcheance: '2024-06-01', statut: 'PAID' },
      { id: 2, numero: 2, montant: 400, dateEcheance: '2024-09-01', statut: 'PENDING' },
    ],
    guests: [{ nom: 'Dupont', prenom: 'Alice', age: 30, sexe: 'F' }],
  },
  {
    id: 2, offreTitre: 'Activité Sport', offreId: 11, typeOffre: 'ACTIVITE',
    dateInscription: '2024-04-01', statut: 'PENDING', montant: 50,
    totalPeople: 1, echeances: [], guests: [],
  },
];

describe('AdherentInscriptionsComponent', () => {
  let component: AdherentInscriptionsComponent;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdherentInscriptionsComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(AdherentInscriptionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    http.expectOne('/api/inscriptions/mesinscriptions').flush(mockInscriptions);
  });

  afterEach(() => http.verify());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads inscriptions on init', () => {
    expect(component.inscriptions().length).toBe(2);
  });

  it('loading is false after data loads', () => {
    expect(component.loading()).toBe(false);
  });

  it('filtered() returns all when filter is "all"', () => {
    component.statutFilter.set('all');
    expect(component.filtered().length).toBe(2);
  });

  it('filtered() filters by APPROVED status', () => {
    component.statutFilter.set('APPROVED');
    expect(component.filtered().length).toBe(1);
    expect(component.filtered()[0].statut).toBe('APPROVED');
  });

  it('filtered() filters by PENDING status', () => {
    component.statutFilter.set('PENDING');
    expect(component.filtered().length).toBe(1);
    expect(component.filtered()[0].statut).toBe('PENDING');
  });

  it('filtered() searches by title', () => {
    component.searchQuery.set('djerba');
    component.statutFilter.set('all');
    expect(component.filtered().length).toBe(1);
    expect(component.filtered()[0].offreTitre).toBe('Voyage Djerba');
  });

  it('toggleExpand() expands an inscription', () => {
    const ins = component.inscriptions()[0];
    component.toggleExpand(ins);
    expect(component.expandedInsId()).toBe(ins.id);
  });

  it('toggleExpand() collapses already-expanded inscription', () => {
    const ins = component.inscriptions()[0];
    component.toggleExpand(ins);
    component.toggleExpand(ins);
    expect(component.expandedInsId()).toBeNull();
  });

  it('paidCount() returns correct number of paid echeances', () => {
    const ins = component.inscriptions()[0];
    expect(component.paidCount(ins as any)).toBe(1);
  });

  it('montantConfirme() sums APPROVED inscriptions with future offer date', () => {
    expect(component.montantConfirme()).toBe(800);
  });

  it('montantEnAttente() sums PENDING inscriptions', () => {
    expect(component.montantEnAttente()).toBe(50);
  });

  it('montantTotal() is sum of confirmed + pending', () => {
    expect(component.montantTotal()).toBe(850);
  });

  it('typeLabel() returns correct labels', () => {
    expect(component.typeLabel('VOYAGE')).toBe('Voyage');
    expect(component.typeLabel('ACTIVITE')).toBe('Activité');
    expect(component.typeLabel('SEJOUR')).toBe('Séjour');
  });

  it('statutLabel() returns correct labels', () => {
    expect(component.statutLabel('APPROVED')).toBe('Confirmée');
    expect(component.statutLabel('PENDING')).toBe('En attente');
    expect(component.statutLabel('CANCELLED')).toBe('Annulée');
  });

  it('sexeLabel() maps sex codes correctly', () => {
    expect(component.sexeLabel('M')).toBe('Homme');
    expect(component.sexeLabel('F')).toBe('Femme');
    expect(component.sexeLabel('AUTRE')).toBe('Autre');
    expect(component.sexeLabel(null)).toBe('');
  });

  it('openCancel/closeCancel manage cancelTarget signal', () => {
    const ins = component.inscriptions()[0] as any;
    component.openCancel(ins);
    expect(component.cancelTarget()).toEqual(ins);
    component.closeCancel();
    expect(component.cancelTarget()).toBeNull();
  });

  it('formatDate() formats a valid date', () => {
    expect(component.formatDate('2024-06-15')).toBe('15/06/2024');
  });

  it('formatDate() returns — for empty string', () => {
    expect(component.formatDate('')).toBe('—');
  });
});
