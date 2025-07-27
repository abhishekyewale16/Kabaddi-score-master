
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

const ConfettiPiece = ({ className }: { className?: string }) => {
    const animationDuration = 1.5 + Math.random() * 1.5;
    const animationDelay = Math.random() * 2;
    const initialRotation = Math.random() * 360;
    const finalRotation = initialRotation + (Math.random() > 0.5 ? 1 : -1) * (360 + Math.random() * 360);
    const translateX = -50 + Math.random() * 100;
    const translateY = -50 + Math.random() * 100;

    return (
        <div className={cn("absolute w-1 h-4", className)} style={{
            top: '50%',
            left: '50%',
            animation: `confetti-blast ${animationDuration}s cubic-bezier(0.25, 1, 0.5, 1) ${animationDelay}s forwards`,
            // @ts-ignore
            '--initial-rotation': `${initialRotation}deg`,
            '--final-rotation': `${finalRotation}deg`,
            '--translate-x': `${translateX}vw`,
            '--translate-y': `${translateY}vh`,
        }}></div>
    );
};


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
        @keyframes confetti-blast {
            0% { 
                transform: translate(0, 0) rotate(var(--initial-rotation)) scale(1);
                opacity: 1;
            }
            100% { 
                transform: translate(var(--translate-x), var(--translate-y)) rotate(var(--final-rotation)) scale(0.5);
                opacity: 0;
            }
        }
      `}</style>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
              {isOpen && [...Array(100)].map((_, i) => (
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
