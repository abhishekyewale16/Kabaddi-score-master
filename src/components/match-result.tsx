
"use client"

import type { Team } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trophy } from 'lucide-react';

interface MatchResultProps {
  teams: [Team, Team];
  isMatchOver: boolean;
}

export function MatchResult({ teams, isMatchOver }: MatchResultProps) {
  if (!isMatchOver) {
    return null;
  }

  const [team1, team2] = teams;
  let resultText = '';
  let winner: Team | null = null;

  if (team1.score > team2.score) {
    winner = team1;
    resultText = `${winner.name} wins the match!`;
  } else if (team2.score > team1.score) {
    winner = team2;
    resultText = `${winner.name} wins the match!`;
  } else {
    resultText = "The match is a draw!";
  }

  return (
    <div className="mt-8">
      <Card className="border-primary border-2 shadow-lg animate-in fade-in zoom-in-95">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary flex items-center justify-center gap-2">
            <Trophy className="w-8 h-8" />
            Match Over!
          </CardTitle>
          <CardDescription className="text-lg">{resultText}</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-4xl font-bold">
            <span className={winner?.id === team1.id ? 'text-primary' : ''}>{team1.score}</span>
            <span> - </span>
            <span className={winner?.id === team2.id ? 'text-primary' : ''}>{team2.score}</span>
          </p>
          <p className="text-sm text-muted-foreground mt-2">{team1.name} vs {team2.name}</p>
        </CardContent>
      </Card>
    </div>
  );
}
