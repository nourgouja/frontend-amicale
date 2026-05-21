import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { BureauSondagesComponent } from './bureau-sondages.component';
import { SondageService } from '../../core/services/sondage.service';
import { Sondage } from '../../core/models/sondage.model';

const mockSondageOpen: Sondage = {
  id: 1, titre: 'Sondage En Cours', statut: 'OPEN',
  options: [{ id: 10, titre: 'A', voteCount: 5 }, { id: 11, titre: 'B', voteCount: 3 }],
  hasVoted: false, votedOptionId: null, totalVotes: 8,
};

const mockSondageClosed: Sondage = {
  id: 2, titre: 'Sondage Clôturé', statut: 'CLOSED',
  options: [{ id: 20, titre: 'X', voteCount: 10 }, { id: 21, titre: 'Y', voteCount: 4 }],
  hasVoted: false, votedOptionId: null, totalVotes: 14,
};

describe('BureauSondagesComponent', () => {
  let component: BureauSondagesComponent;
  let sondageSpy: { getActiveSondages: ReturnType<typeof vi.fn>; publishSondage: ReturnType<typeof vi.fn>; closeSondage: ReturnType<typeof vi.fn>; deleteSondage: ReturnType<typeof vi.fn> };
  let routerSpy: { navigate: ReturnType<typeof vi.fn>; url: string };
  let http: HttpTestingController;

  beforeEach(async () => {
    sondageSpy = {
      getActiveSondages: vi.fn().mockReturnValue(of([mockSondageOpen, mockSondageClosed])),
      publishSondage: vi.fn().mockReturnValue(of(void 0)),
      closeSondage: vi.fn().mockReturnValue(of(void 0)),
      deleteSondage: vi.fn().mockReturnValue(of(void 0)),
    };
    routerSpy = { navigate: vi.fn(), url: '/bureau/sondages' };

    await TestBed.configureTestingModule({
      imports: [BureauSondagesComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: SondageService, useValue: sondageSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(BureauSondagesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    try { http.expectOne('/api/bureau/dashboard').flush({ totalAdherents: 50 }); } catch {}
  });

  afterEach(() => http.verify());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads sondages on init', () => {
    expect(component.sondages().length).toBe(2);
  });

  it('loading is false after data loads', () => {
    expect(component.loading()).toBe(false);
  });

  it('totalVotes() sums option voteCounts', () => {
    expect(component.totalVotes(mockSondageOpen)).toBe(8);
  });

  it('optionPercent() returns correct percentage', () => {
    expect(component.optionPercent(5, 8)).toBe(63);
  });

  it('optionPercent() returns 0 when total is 0', () => {
    expect(component.optionPercent(3, 0)).toBe(0);
  });

  it('isWinner() returns false for OPEN sondage regardless of votes', () => {
    expect(component.isWinner(mockSondageOpen, 10)).toBe(false);
  });

  it('isWinner() returns true for max vote option in CLOSED sondage', () => {
    expect(component.isWinner(mockSondageClosed, 10)).toBe(true);
  });

  it('isWinner() returns false for non-max vote in CLOSED sondage', () => {
    expect(component.isWinner(mockSondageClosed, 4)).toBe(false);
  });

  it('statusLabel() returns correct labels', () => {
    expect(component.statusLabel('OPEN')).toBe('En cours');
    expect(component.statusLabel('CLOSED')).toBe('Clôturé');
    expect(component.statusLabel('DRAFT')).toBe('Brouillon');
  });

  it('publish() calls sondageService.publishSondage and reloads', () => {
    component.publish(1);
    expect(sondageSpy.publishSondage).toHaveBeenCalledWith(1);
    expect(sondageSpy.getActiveSondages).toHaveBeenCalledTimes(2);
  });

  it('close() calls sondageService.closeSondage and reloads', () => {
    component.close(1);
    expect(sondageSpy.closeSondage).toHaveBeenCalledWith(1);
    expect(sondageSpy.getActiveSondages).toHaveBeenCalledTimes(2);
  });

  it('delete() calls sondageService.deleteSondage and reloads', () => {
    component.delete(1);
    expect(sondageSpy.deleteSondage).toHaveBeenCalledWith(1);
    expect(sondageSpy.getActiveSondages).toHaveBeenCalledTimes(2);
  });

  it('goToCreate() navigates to /bureau/sondages/creer', () => {
    component.goToCreate();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/bureau/sondages/creer']);
  });

  it('participationStat() returns pct=0 when no members', () => {
    component.totalMembres.set(0);
    expect(component.participationStat().pct).toBe(0);
  });

  it('sondageStatusStat() counts open and closed sondages', () => {
    const stats = component.sondageStatusStat();
    const openStat = stats.find(s => s.label === 'En cours');
    const closedStat = stats.find(s => s.label === 'Clôturés');
    expect(openStat?.count).toBe(1);
    expect(closedStat?.count).toBe(1);
  });

  it('shows toast on publish error', () => {
    sondageSpy.publishSondage.mockReturnValue(throwError(() => ({ error: { message: 'Déjà publié' } })));
    component.publish(1);
    expect(component.toast()?.type).toBe('error');
  });
});
