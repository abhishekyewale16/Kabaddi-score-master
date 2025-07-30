
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
  isOut: boolean; // true if player is temporarily out of the match
  outTimestamp: number | null; // Timestamp when player got out
  greenCards: number;
  yellowCards: number;
  isRedCarded: boolean;
  suspensionTimer: number; // in seconds
  isCaptain?: boolean;
}

export interface Team {
  id: number;
  name:string;
  coach: string;
  city: string;
  score: number;
  players: Player[];
  timeoutsRemaining: number;
  lonaPoints: number;
  extraPoints: number;
}

export interface MatchEvent {
  type: 'Timeout' | 'Substitution';
  teamName: string;
  half: 1 | 2;
  time: string; // e.g., "15:30"
  details: string;
}
