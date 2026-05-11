export interface SondageOption {
  id: number;
  titre: string;
  description: string;
  imageUrl?: string;
  voteCount: number;
}

export interface Sondage {
  id: number;
  titre: string;
  description: string;
  statut: 'DRAFT' | 'ACTIVE' | 'CLOSED';
  options: SondageOption[];
  createdAt?: string;
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
