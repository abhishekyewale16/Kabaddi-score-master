
"use client"

import { useState, useEffect } from 'react';
import type { Team } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Trophy } from 'lucide-react';

interface MatchResultProps {
    teams: [Team, Team];
    isMatchOver: boolean;
}

export function MatchResult({ teams, isMatchOver }: MatchResultProps) {
  const [team1, team2] = teams;
  const [winner, setWinner] = useState<Team | null>(null);
  const [isDraw, setIsDraw] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isMatchOver) {
        let winningTeam: Team | null = null;
        if (team1.score > team2.score) {
            winningTeam = team1;
        } else if (team2.score > team1.score) {
            winningTeam = team2;
        }

        if (winningTeam) {
            setWinner(winningTeam);
            setIsDraw(false);
        } else {
            setWinner(null);
            setIsDraw(true);
        }
        setIsOpen(true);
    } else {
        setIsOpen(false);
    }
  }, [isMatchOver, teams, team1, team2]);

  const captainName = winner?.players.find(p => p.isCaptain)?.name ?? 'Captain';

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader className="text-center z-10">
            <DialogTitle className="text-xl font-bold text-card-foreground flex items-center justify-center gap-2">
              <Trophy className="w-6 h-6 text-primary" />
              Final Result
            </DialogTitle>
          </DialogHeader>
          <div className="text-center z-10 py-6">
            {winner && (
              <div className="inline-block bg-primary/10 border-2 border-primary rounded-lg px-8 py-4 space-y-2">
                <p className="text-lg md:text-xl font-bold text-primary break-words px-4">
                  {winner.name}
                </p>
                <p className="text-4xl md:text-5xl font-black text-primary tracking-tight">
                  Winner!
                </p>
                <p className="text-xs text-foreground pt-2">
                  Congratulations Coach ({winner.coach}) and Captain ({captainName}).
                </p>
              </div>
            )}
            {isDraw && (
              <div className="inline-block bg-muted/50 border-2 border-border rounded-lg px-8 py-4">
                  <p className="text-lg md:text-xl font-bold text-foreground">
                    Match Drawn
                  </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
