
import type { Team } from './types';

export const initialTeams: [Team, Team] = [
  {
    id: 1,
    name: 'Team 1',
    coach: 'Coach',
    city: 'City',
    score: 0,
    timeoutsRemaining: 2,
    players: Array.from({ length: 12 }, (_, i) => ({
      id: 100 + i + 1,
      name: `Player ${i + 1}`,
      raidPoints: 0,
      tacklePoints: 0,
      bonusPoints: 0,
      totalPoints: 0,
      totalRaids: 0,
      successfulRaids: 0,
      superRaids: 0,
      superTacklePoints: 0,
      isPlaying: i < 7, // First 7 players are active
      isOut: false,
      outTimestamp: null,
      greenCards: 0,
      yellowCards: 0,
      isRedCarded: false,
      suspensionTimer: 0,
      isCaptain: i === 0, // First player is captain
    })),
  },
  {
    id: 2,
    name: 'Team 2',
    coach: 'Coach',
    city: 'City',
    score: 0,
    timeoutsRemaining: 2,
    players: Array.from({ length: 12 }, (_, i) => ({
      id: 200 + i + 1,
      name: `Player ${i + 1}`,
      raidPoints: 0,
      tacklePoints: 0,
      bonusPoints: 0,
      totalPoints: 0,
      totalRaids: 0,
      successfulRaids: 0,
      superRaids: 0,
      superTacklePoints: 0,
      isPlaying: i < 7, // First 7 players are active
      isOut: false,
      outTimestamp: null,
      greenCards: 0,
      yellowCards: 0,
      isRedCarded: false,
      suspensionTimer: 0,
      isCaptain: i === 0, // First player is captain
    })),
  },
];
