
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

const ConfettiPiece = ({ className }: { className?: string }) => (
    <div className={cn("absolute w-2 h-2 rounded-full", className)} style={{
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        animation: `confetti-fall ${1 + Math.random() * 2}s ease-out ${Math.random() * 2}s infinite`,
        transform: `rotate(${Math.random() * 360}deg)`
    }}></div>
)

export function MatchResult({ teams, isMatchOver }: MatchResultProps) {
  const [team1, team2] = teams;
  const [winner, setWinner] = useState<Team | null>(null);
  const [resultText, setResultText] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isMatchOver) {
        if (team1.score > team2.score) {
            setWinner(team1);
            setResultText(`${team1.name} wins the match!`);
        } else if (team2.score > team1.score) {
            setWinner(team2);
            setResultText(`${team2.name} wins the match!`);
        } else {
            setWinner(null);
            setResultText("The match is a draw!");
        }
        setIsOpen(true);
    } else {
        setIsOpen(false);
    }
  }, [isMatchOver, teams, team1, team2]);

  return (
    <>
      <style>{`
        @keyframes confetti-fall {
            0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
            100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
              {[...Array(50)].map((_, i) => (
                  <ConfettiPiece key={i} className={i % 3 === 0 ? 'bg-primary' : i % 3 === 1 ? 'bg-yellow-400' : 'bg-destructive'} />
              ))}
          </div>
          <DialogHeader className="text-center z-10">
            <DialogTitle className="text-2xl font-bold text-primary flex items-center justify-center gap-2">
              <Trophy className="w-8 h-8" />
              Match Over!
            </DialogTitle>
            <DialogDescription className="text-lg">{resultText}</DialogDescription>
          </DialogHeader>
          <div className="text-center z-10">
            <p className="text-4xl font-bold">
              <span className={winner?.id === team1.id ? 'text-primary' : ''}>{team1.score}</span>
              <span> - </span>
              <span className={winner?.id === team2.id ? 'text-primary' : ''}>{team2.score}</span>
            </p>
            <p className="text-sm text-muted-foreground mt-2">{team1.name} vs {team2.name}</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
