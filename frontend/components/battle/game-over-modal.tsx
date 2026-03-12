'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Trophy, RotateCcw, Shield, Skull, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import { useEffect } from 'react';

interface GameOverModalProps {
  winner: string;
  score: { red: number; blue: number };
  onPlayAgain: () => void;
}

export function GameOverModal({ winner, score, onPlayAgain }: GameOverModalProps) {
  const router = useRouter();
  const isRedWinner = winner.toLowerCase() === 'red';

  // Fire confetti on mount
  useEffect(() => {
    const colors = isRedWinner 
      ? ['#ef4444', '#dc2626', '#fca5a5']
      : ['#3b82f6', '#2563eb', '#93c5fd'];
    
    const end = Date.now() + 2000;
    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, [isRedWinner]);

  const handlePlayAgain = () => {
    onPlayAgain();
    router.push('/');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className={cn(
        'relative w-full max-w-lg mx-4 rounded-3xl border-4 p-10 bg-card shadow-2xl animate-in zoom-in-95 duration-500',
        isRedWinner ? 'border-team-red' : 'border-team-blue',
      )}>
        {/* Glow effect */}
        <div className={cn(
          'absolute inset-0 rounded-3xl blur-2xl opacity-40 -z-10',
          isRedWinner ? 'bg-team-red' : 'bg-team-blue',
        )} />

        {/* Sparkles */}
        <Sparkles className={cn(
          'absolute top-4 right-4 w-6 h-6 animate-pulse',
          isRedWinner ? 'text-team-red' : 'text-team-blue',
        )} />
        <Sparkles className={cn(
          'absolute top-8 left-6 w-4 h-4 animate-pulse',
          isRedWinner ? 'text-team-red' : 'text-team-blue',
        )} style={{ animationDelay: '0.5s' }} />

        {/* Trophy icon */}
        <div className="flex justify-center mb-8">
          <div className={cn(
            'w-28 h-28 rounded-full flex items-center justify-center',
            isRedWinner ? 'bg-team-red/20 border-4 border-team-red/40' : 'bg-team-blue/20 border-4 border-team-blue/40',
          )}>
            <Trophy className={cn(
              'w-14 h-14 animate-bounce',
              isRedWinner ? 'text-team-red' : 'text-team-blue',
            )} />
          </div>
        </div>

        {/* Winner announcement */}
        <h1 className="text-center mb-2">
          <span className="text-2xl text-muted-foreground font-medium">Victory!</span>
        </h1>
        <h2 className={cn(
          'text-center text-5xl font-black uppercase tracking-wider mb-10',
          isRedWinner ? 'text-team-red' : 'text-team-blue',
        )}>
          {winner} Team
        </h2>

        {/* Score display */}
        <div className="flex items-center justify-center gap-8 mb-10">
          {/* Red team score */}
          <div className={cn(
            'flex flex-col items-center p-5 rounded-2xl min-w-[140px]',
            'bg-team-red/10 border-2 border-team-red/30',
            isRedWinner && 'border-team-red ring-2 ring-team-red/30',
          )}>
            <Shield className="w-10 h-10 text-team-red mb-2" />
            <span className="text-sm text-team-red uppercase tracking-wide font-bold mb-1">Red</span>
            <span className="text-5xl font-black text-team-red">{score.red}</span>
            <span className="text-xs text-muted-foreground mt-1">survivors</span>
          </div>

          {/* VS */}
          <div className="flex flex-col items-center">
            <Skull className="w-8 h-8 text-muted-foreground" />
          </div>

          {/* Blue team score */}
          <div className={cn(
            'flex flex-col items-center p-5 rounded-2xl min-w-[140px]',
            'bg-team-blue/10 border-2 border-team-blue/30',
            !isRedWinner && 'border-team-blue ring-2 ring-team-blue/30',
          )}>
            <Shield className="w-10 h-10 text-team-blue mb-2" />
            <span className="text-sm text-team-blue uppercase tracking-wide font-bold mb-1">Blue</span>
            <span className="text-5xl font-black text-team-blue">{score.blue}</span>
            <span className="text-xs text-muted-foreground mt-1">survivors</span>
          </div>
        </div>

        {/* Play again button */}
        <Button 
          onClick={handlePlayAgain}
          size="lg"
          className="w-full gap-3 h-14 text-lg font-bold bg-gradient-to-r from-team-red via-primary to-team-blue hover:opacity-90"
        >
          <RotateCcw className="w-6 h-6" />
          New Battle
        </Button>
      </div>
    </div>
  );
}
