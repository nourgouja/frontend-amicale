export interface SondageOption {
  id: number;
  titre: string;
  description?: string;
  imageBase64?: string;
  imageType?: string;
  ordre?: number;
  voteCount: number;
}

export interface Sondage {
  id: number;
  titre: string;
  description?: string;
  statut: 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'ARCHIVED';
  options: SondageOption[];
  hasVoted: boolean;
  votedOptionId: number | null;
  totalVotes: number;
  createdByNom?: string;
  createdByPrenom?: string;
  createdAt?: string;
  updatedAt?: string;
  closedAt?: string;
}

export interface SondageOptionRequest {
  titre: string;
  description: string;
}

export interface CreateSondageRequest {
  titre: string;
  option1: SondageOptionRequest;
  option2: SondageOptionRequest;
}
