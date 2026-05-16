import { Position } from './election.model';

export type CallStatus = 'OPEN' | 'CLOSED';
export type ApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface UserSummaryForApplication {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

export interface ElectionCall {
  id: number;
  titre: string;
  description?: string;
  status: CallStatus;
  dateFinCandidature?: string;
  dateDebut?: string;
  dateFin?: string;
  createdAt: string;
  updatedAt?: string;
  totalApplicationsCount: number;
  approvedCandidatesCount: number;
  publishedElectionId?: number;
  publishedElectionStatus?: 'OPEN' | 'CLOSED' | null;
  canApply: boolean;
  canPublish: boolean;
}

export interface CandidateApplication {
  id: number;
  user: UserSummaryForApplication;
  callId: number;
  position: Position;
  motivation: string;
  photo?: string;
  status: ApplicationStatus;
  createdAt: string;
  reviewedAt?: string;
  rejectionReason?: string;
  canApply: boolean;
}

export interface CreateCallRequest {
  titre: string;
  description?: string;
  dateFinCandidature: string;
  dateDebut: string;
  dateFin: string;
}

export interface ApplyRequest {
  position: Position;
  motivation: string;
}

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  PENDING:  'En attente',
  APPROVED: 'Acceptée',
  REJECTED: 'Refusée',
};
