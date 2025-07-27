
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
  const [resultText, setResultText] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isMatchOver) {
        let winner: Team | null = null;
        if (team1.score > team2.score) {
            winner = team1;
        } else if (team2.score > team1.score) {
            winner = team2;
        }

        if (winner) {
            setResultText(`${winner.name} are the Winners! Congratulations to Coach ${winner.coach} and the captain.`);
        } else {
            setResultText("The match is a Draw!");
        }
        setIsOpen(true);
    } else {
        setIsOpen(false);
    }
  }, [isMatchOver, teams, team1, team2]);

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
             <div className="inline-block bg-primary/10 border-2 border-primary rounded-lg px-8 py-4">
                <p className="text-lg md:text-xl font-bold text-primary break-words px-4">
                  {resultText}
                </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
