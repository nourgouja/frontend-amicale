export type ElectionStatus = 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'RESULTS_PUBLISHED';
export type Position = 'PRESIDENT' | 'VICE_PRESIDENT' | 'SECRETARY' | 'TREASURER' | 'RESPONSABLE_POLE' | 'MEMBER';

export interface Candidate {
  id: number;
  prenom: string;
  nom: string;
  email?: string;
  position: Position;
  pictureUrl?: string;
  description?: string;
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
  { value: 'PRESIDENT',        label: 'Président' },
  { value: 'VICE_PRESIDENT',   label: 'Vice-Président' },
  { value: 'SECRETARY',        label: 'Secrétaire' },
  { value: 'TREASURER',        label: 'Trésorier' },
  { value: 'RESPONSABLE_POLE', label: 'Responsable de Pôle' },
  { value: 'MEMBER',           label: 'Membre' },
];

export function positionLabel(p: Position): string {
  return POSITIONS.find(x => x.value === p)?.label ?? p;
}
