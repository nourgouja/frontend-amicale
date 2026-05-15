export type ElectionStatus = 'DRAFT' | 'ACTIVE' | 'CLOSED';
export type Position = 'PRESIDENT' | 'TRESORIER' | 'RESPONSABLE_POLE';

export interface Candidate {
  id: number;
  userId: number;
  nom: string;
  prenom: string;
  email: string;
  position: Position;
  description?: string;
  pictureUrl?: string;
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
  createdByNom: string;
  createdByPrenom: string;
  createdAt: string;
  updatedAt?: string;
  openedAt?: string;
  closedAt?: string;
  candidates: Candidate[];
  candidatesByPosition: Record<Position, Candidate[]>;
  votedPositions: Position[];
  resultsPublished: boolean;
  hasTie: boolean;
  tiedPositions: Position[];
  isExtraRound: boolean;
  parentElectionId?: number;
  extraRoundElectionId?: number;
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
  { value: 'TRESORIER',        label: 'Trésorier' },
  { value: 'RESPONSABLE_POLE', label: 'Responsable de pôle' },
];

export function positionLabel(p: Position): string {
  return POSITIONS.find(x => x.value === p)?.label ?? p;
}
