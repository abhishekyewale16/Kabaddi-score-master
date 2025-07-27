
"use client"

import { useState, useEffect } from 'react';
import type { Team } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MatchResultProps {
    teams: [Team, Team];
    isMatchOver: boolean;
}

export function MatchResult({ teams, isMatchOver }: MatchResultProps) {
  const [team1, team2] = teams;
  const [winner, setWinner] = useState<Team | null>(null);
  const [resultText, setResultText] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isMatchOver) {
        if (team1.score > team2.score) {
            setWinner(team1);
            setResultText(`Match Over! ${team1.name} winner`);
        } else if (team2.score > team1.score) {
            setWinner(team2);
            setResultText(`Match Over! ${team2.name} winner`);
        } else {
            setWinner(null);
            setResultText("Match Over! Match Drawn");
        }
        setIsOpen(true);
    } else {
        setIsOpen(false);
    }
  }, [isMatchOver, teams, team1, team2]);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center z-10">
            <DialogTitle className="text-2xl font-bold text-primary flex items-center justify-center gap-2">
              <Trophy className="w-8 h-8" />
              Final Result
            </DialogTitle>
          </DialogHeader>
          <div className="text-center z-10 py-8">
            <p className="text-4xl md:text-5xl font-extrabold text-primary break-words">
              {resultText}
            </p>
            <p className="text-3xl font-bold mt-4">
              <span className={winner?.id === team1.id ? 'text-primary' : ''}>{team1.score}</span>
              <span> - </span>
              <span className={winner?.id === team2.id ? 'text-primary' : ''}>{team2.score}</span>
            </p>
            <p className="text-sm text-muted-foreground mt-1">{team1.name} vs {team2.name}</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
