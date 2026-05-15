import { Position } from './election.model';

export type CallStatus = 'OPEN' | 'CLOSED';
export type ApplicationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export interface ElectionCall {
  id: number;
  title: string;
  description?: string;
  status: CallStatus;
  deadline?: string;
  createdByNom: string;
  createdByPrenom: string;
  createdAt: string;
  applicationCount: number;
  pendingCount: number;
  acceptedCount: number;
  rejectedCount: number;
  publishedElectionId?: number;
  publishedElectionStatus?: 'ACTIVE' | 'CLOSED' | null;
  applications?: CandidateApplication[];
  myApplication?: CandidateApplication | null;
}

export interface CandidateApplication {
  id: number;
  callId: number;
  userId: number;
  nom: string;
  prenom: string;
  email: string;
  position: Position;
  motivation: string;
  pictureUrl?: string;
  status: ApplicationStatus;
  createdAt: string;
}

export interface CreateCallRequest {
  title: string;
  description?: string;
  deadline?: string;
}

export interface ApplyRequest {
  position: Position;
  motivation: string;
}

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  PENDING:  'En attente',
  ACCEPTED: 'Acceptée',
  REJECTED: 'Refusée',
};
