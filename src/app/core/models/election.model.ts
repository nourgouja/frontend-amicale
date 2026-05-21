export type ElectionStatus = 'DRAFT' | 'OPEN' | 'CLOSED' | 'RESULTS_PUBLISHED';
export type Position =
  | 'PRESIDENT'
  | 'SECRETARY'
  | 'TREASURER'
  | 'RESPONSABLE_POLE_VOYAGE_SEJOURS'
  | 'RESPONSABLE_POLE_ACTIVITES_LOISIRS'
  | 'RESPONSABLE_POLE_EVENEMENTS_CONVENTIONS';

export interface Candidate {
  id: number;
  prenom: string;
  nom: string;
  email?: string;
  position: Position;
  pictureUrl?: string;
  description?: string;
  motivation?: string;
  voteCount: number;
  votePercentage: number;
  winner: boolean;
  autoSelected: boolean;
}

export interface Election {
  id: number;
  titre: string;
  description?: string;
  status: ElectionStatus;
  dateDebut?: string;
  dateFin?: string;
  closedAt?: string;
  callId?: number;
  parentElectionId?: number;
  totalVotes: number;
  totalCandidatesCount: number;
  createdAt: string;
  updatedAt?: string;
  resultsPublishedAt?: string;
  candidates: Candidate[];
  candidatesByPosition: Record<Position, Candidate[]>;
  votedPositions: Position[];
  isResultsPublished: boolean;
  resultsPublished: boolean;
  hasTie: boolean;
  tiedPositions: Position[];
  isExtraRound: boolean;
  extraRoundElectionId?: number;
  canVote: boolean;
  canPublishResults: boolean;
}

export interface UserSummary {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: string;
}

export interface CreateElectionRequest {
  titre: string;
  description?: string;
}

export interface AddCandidateRequest {
  userId: number;
  position: Position;
  description?: string;
}

export const POSITIONS: { value: Position; label: string }[] = [
  { value: 'PRESIDENT',                             label: 'Président' },
  { value: 'SECRETARY',                             label: 'Secrétaire' },
  { value: 'TREASURER',                             label: 'Trésorier' },
  { value: 'RESPONSABLE_POLE_VOYAGE_SEJOURS',        label: 'Responsable Pôle Voyage & Séjours' },
  { value: 'RESPONSABLE_POLE_ACTIVITES_LOISIRS',     label: 'Responsable Pôle Activités & Loisirs' },
  { value: 'RESPONSABLE_POLE_EVENEMENTS_CONVENTIONS', label: 'Responsable Pôle Événements & Conventions' },
];

export function positionLabel(p: Position): string {
  return POSITIONS.find(x => x.value === p)?.label ?? p;
}
