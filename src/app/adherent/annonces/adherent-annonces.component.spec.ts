import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { DatePipe } from '@angular/common';
import { AdherentAnnoncesComponent } from './adherent-annonces.component';
import { SondageService } from '../../core/services/sondage.service';
import { ElectionCallService } from '../../core/services/election-call.service';
import { ElectionService } from '../../core/services/election.service';
import { Sondage } from '../../core/models/sondage.model';
import { Election } from '../../core/models/election.model';
import { ElectionCall } from '../../core/models/election-call.model';

const mockOpenSondage: Sondage = {
  id: 1, titre: 'Sondage A', statut: 'OPEN',
  options: [{ id: 10, titre: 'X', voteCount: 4 }, { id: 11, titre: 'Y', voteCount: 6 }],
  hasVoted: false, votedOptionId: null, totalVotes: 10,
};

const mockClosedSondage: Sondage = {
  id: 2, titre: 'Sondage B', statut: 'CLOSED', closedAt: '2024-05-01',
  options: [{ id: 20, titre: 'A', voteCount: 3 }, { id: 21, titre: 'B', voteCount: 7 }],
  hasVoted: true, votedOptionId: 20, totalVotes: 10,
};

const mockElection: Election = {
  id: 5, titre: 'Élection 2024', status: 'RESULTS_PUBLISHED',
  totalVotes: 20, totalCandidatesCount: 4, createdAt: '2024-01-01',
  candidates: [
    { id: 100, prenom: 'Alice', nom: 'D', position: 'PRESIDENT', voteCount: 12, votePercentage: 60, winner: true, autoSelected: false },
    { id: 101, prenom: 'Bob', nom: 'M', position: 'SECRETARY', voteCount: 8, votePercentage: 40, winner: false, autoSelected: false },
  ],
  candidatesByPosition: {} as any,
  votedPositions: [],
  isResultsPublished: true, resultsPublished: true,
  hasTie: false, tiedPositions: [], isExtraRound: false,
  canVote: false, canPublishResults: false,
};

const mockCall: ElectionCall = {
  id: 1, titre: 'Appel 2024', status: 'CLOSED', createdAt: '2024-01-01',
  totalApplicationsCount: 2, approvedCandidatesCount: 2,
  canApply: false, canPublish: false,
  publishedElectionId: 5, publishedElectionStatus: 'RESULTS_PUBLISHED',
};

describe('AdherentAnnoncesComponent', () => {
  let component: AdherentAnnoncesComponent;
  let sondageSpy: { getActiveSondages: ReturnType<typeof vi.fn> };
  let callSpy: { getActiveCall: ReturnType<typeof vi.fn> };
  let electionSpy: { getElectionById: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    sondageSpy = { getActiveSondages: vi.fn().mockReturnValue(of([])) };
    callSpy = { getActiveCall: vi.fn().mockReturnValue(of(null)) };
    electionSpy = { getElectionById: vi.fn().mockReturnValue(of(null)) };

    await TestBed.configureTestingModule({
      imports: [AdherentAnnoncesComponent, DatePipe],
      providers: [
        { provide: SondageService, useValue: sondageSpy },
        { provide: ElectionCallService, useValue: callSpy },
        { provide: ElectionService, useValue: electionSpy },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AdherentAnnoncesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loading is false after ngOnInit with no data', () => {
    callSpy.getActiveCall.mockReturnValue(of(null));
    component.ngOnInit();
    expect(component.loading()).toBe(false);
  });

  it('hasContent() is false when no sondages and no election', () => {
    component.sondages.set([]);
    component.publishedElection.set(null);
    expect(component.hasContent()).toBe(false);
  });

  it('hasContent() is true when there are closed sondages', () => {
    component.sondages.set([mockClosedSondage]);
    expect(component.hasContent()).toBe(true);
  });

  it('hasContent() is true when there is a published election', () => {
    component.sondages.set([]);
    component.publishedElection.set(mockElection);
    expect(component.hasContent()).toBe(true);
  });

  it('closedSondages() filters only CLOSED sondages, sorted newest first', () => {
    const older: Sondage = { ...mockClosedSondage, id: 3, closedAt: '2024-01-01' };
    const newer: Sondage = { ...mockClosedSondage, id: 4, closedAt: '2024-06-01' };
    component.sondages.set([mockOpenSondage, older, newer]);
    const result = component.closedSondages();
    expect(result.length).toBe(2);
    expect(result[0].id).toBe(4);
  });

  it('totalVotes() sums up option voteCounts', () => {
    expect(component.totalVotes(mockClosedSondage)).toBe(10);
  });

  it('optionPercent() calculates correct percentage', () => {
    expect(component.optionPercent(7, 10)).toBe(70);
  });

  it('optionPercent() returns 0 when total is 0', () => {
    expect(component.optionPercent(5, 0)).toBe(0);
  });

  it('isWinner() returns true for option with max votes', () => {
    const opt = mockClosedSondage.options[1]; // 7 votes
    expect(component.isWinner(opt, mockClosedSondage)).toBe(true);
  });

  it('isWinner() returns false for option without max votes', () => {
    const opt = mockClosedSondage.options[0]; // 3 votes
    expect(component.isWinner(opt, mockClosedSondage)).toBe(false);
  });

  it('optionImageUrl() returns null when no image', () => {
    expect(component.optionImageUrl({ id: 1, titre: 'X', voteCount: 0 })).toBeNull();
  });

  it('optionImageUrl() returns data URL when image present', () => {
    const opt = { id: 1, titre: 'X', voteCount: 0, imageBase64: 'abc123', imageType: 'image/jpeg' };
    expect(component.optionImageUrl(opt)).toBe('data:image/jpeg;base64,abc123');
  });

  it('electedMembers() returns only winner candidates', () => {
    const winners = component.electedMembers(mockElection);
    expect(winners.length).toBe(1);
    expect(winners[0].prenom).toBe('Alice');
  });

  it('loads published election when call has RESULTS_PUBLISHED status', () => {
    callSpy.getActiveCall.mockReturnValue(of(mockCall));
    electionSpy.getElectionById.mockReturnValue(of(mockElection));
    component.ngOnInit();
    expect(component.publishedElection()).toEqual(mockElection);
  });

  it('loading is false even when sondage service errors', () => {
    sondageSpy.getActiveSondages.mockReturnValue(throwError(() => new Error('fail')));
    callSpy.getActiveCall.mockReturnValue(of(null));
    component.ngOnInit();
    expect(component.loading()).toBe(false);
  });
});
