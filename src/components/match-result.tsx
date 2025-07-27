
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
        if (team1.score > team2.score) {
            setResultText(`${team1.name} Won`);
        } else if (team2.score > team1.score) {
            setResultText(`${team2.name} Won`);
        } else {
            setResultText("Match Drawn");
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
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
