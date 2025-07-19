
export interface Player {
  id: number;
  name: string;
  raidPoints: number;
  tacklePoints: number;
  bonusPoints: number;
  totalPoints: number;
  totalRaids: number;
  successfulRaids: number;
  superRaids: number;
  superTacklePoints: number;
  isPlaying: boolean;
  greenCards: number;
  yellowCards: number;
  isRedCarded: boolean;
  suspensionTimer: number; // in seconds
}

export interface Team {
  id: number;
  name:string;
  coach: string;
  city: string;
  score: number;
  players: Player[];
  timeoutsRemaining: number;
}
