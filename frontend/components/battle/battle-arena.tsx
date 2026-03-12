'use client';

import { useBattle } from '@/hooks/use-battle';
import { BattleField } from './battlefield';
import { BattleLogs } from './battle-logs';
import { GameOverModal } from './game-over-modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Swords, Wifi, WifiOff, Loader2, Play, Shield, Home, Zap, Sparkles, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useEffect } from 'react';

export function BattleArena() {
  const {
    phase,
    warriors,
    battleLogs,
    winner,
    score,
    isConnected,
    attackAnimations,
    startBattle,
    resetGame,
    getTeamWarriors,
    getAliveCount,
  } = useBattle();

  useEffect(() => {
  if (phase === 'idle') {
    console.log("Game is idle, waiting for backend deployment...");
  }
}, [phase]);

  const redWarriors = getTeamWarriors('red');
  const blueWarriors = getTeamWarriors('blue');
  const redAlive = getAliveCount('red');
  const blueAlive = getAliveCount('blue');

  // Debug log to check if warriors are being received
  console.log('[v0] BattleArena render - red:', redWarriors.length, 'blue:', blueWarriors.length, 'phase:', phase);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-secondary/20 to-background flex flex-col">
      <div className="fixed inset-0 bg-grid-pattern opacity-[0.02] pointer-events-none" />
      
      {/* Header */}
      <header className="border-b-2 border-border bg-card/90 backdrop-blur-md sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="ghost" size="icon" className="rounded-xl hover:bg-secondary">
                  <Home className="w-5 h-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-team-red/20 to-team-blue/20 flex items-center justify-center border-2 border-primary/20 shadow-sm">
                  <Swords className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl font-black">
                    <span className="text-team-red">Clash</span>
                    <span className="text-muted-foreground mx-1">of</span>
                    <span className="text-team-blue">Kube</span>
                  </h1>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className={cn(
                        'text-[10px] h-5 px-2',
                        phase === 'battle' && 'border-respawn-yellow text-respawn-yellow bg-respawn-yellow/10'
                      )}
                    >
                      {phase === 'idle' && 'Waiting...'}
                      {phase === 'setup' && 'Deploying'}
                      {phase === 'ready' && 'Ready!'}
                      {phase === 'battle' && 'FIGHTING'}
                      {phase === 'gameover' && 'Game Over'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Connection status */}
              <Badge 
                variant={isConnected ? 'default' : 'destructive'}
                className={cn(
                  'gap-1.5 px-3 h-8',
                  isConnected && 'bg-health-green text-white'
                )}
              >
                {isConnected ? (
                  <>
                    <Wifi className="w-3.5 h-3.5" />
                    Live
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3.5 h-3.5" />
                    Offline
                  </>
                )}
              </Badge>

              {/* Battle logs button */}
              <BattleLogs logs={battleLogs} />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-4 flex flex-col gap-4 relative z-10">
        {/* Battle status bar - Game HUD style */}
        <div className="flex items-center justify-between bg-card rounded-2xl border-2 border-border p-3 shadow-lg">
          {/* Red team */}
          <div className="flex items-center gap-3 flex-1">
            <div className={cn(
              'w-14 h-14 rounded-2xl flex items-center justify-center border-3 shadow-lg transition-all',
              'bg-gradient-to-br from-team-red to-team-red/80 border-team-red-glow',
              redAlive > 0 && phase === 'battle' && 'animate-pulse'
            )}>
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-black text-lg text-team-red">RED</span>
                <Users className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-4 bg-secondary rounded-full overflow-hidden border border-team-red/30">
                  <div 
                    className="h-full bg-gradient-to-r from-team-red to-team-red-glow transition-all duration-500 rounded-full"
                    style={{ width: redWarriors.length > 0 ? `${(redAlive / redWarriors.length) * 100}%` : '100%' }}
                  />
                </div>
                <span className="text-2xl font-black text-team-red min-w-[80px] text-right">
                  {redAlive}<span className="text-sm text-muted-foreground">/{redWarriors.length}</span>
                </span>
              </div>
            </div>
          </div>

          {/* VS / Status center */}
          <div className="px-6 flex flex-col items-center">
            {phase === 'setup' && (
              <div className="flex items-center gap-2 bg-secondary/80 px-4 py-2 rounded-xl">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span className="font-bold text-sm">Deploying...</span>
              </div>
            )}
            
            {phase === 'ready' && (
              <Button 
                onClick={startBattle}
                size="lg"
                className="gap-2 h-14 px-8 bg-gradient-to-r from-health-green to-health-green/80 hover:opacity-90 text-white font-black text-lg shadow-lg hover:scale-105 transition-transform"
              >
                <Play className="w-6 h-6" />
                START!
              </Button>
            )}

            {phase === 'battle' && (
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-respawn-yellow/20 border-2 border-respawn-yellow flex items-center justify-center">
                  <Zap className="w-10 h-10 text-respawn-yellow animate-pulse" />
                </div>
                <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-respawn-yellow animate-bounce" />
              </div>
            )}

            {(phase === 'idle' || phase === 'gameover') && (
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center border-2 border-border">
                <span className="text-2xl font-black text-muted-foreground">VS</span>
              </div>
            )}
          </div>

          {/* Blue team */}
          <div className="flex items-center gap-3 flex-1 flex-row-reverse">
            <div className={cn(
              'w-14 h-14 rounded-2xl flex items-center justify-center border-3 shadow-lg transition-all',
              'bg-gradient-to-br from-team-blue to-team-blue/80 border-team-blue-glow',
              blueAlive > 0 && phase === 'battle' && 'animate-pulse'
            )}>
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 justify-end">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="font-black text-lg text-team-blue">BLUE</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-team-blue min-w-[80px]">
                  {blueAlive}<span className="text-sm text-muted-foreground">/{blueWarriors.length}</span>
                </span>
                <div className="flex-1 h-4 bg-secondary rounded-full overflow-hidden border border-team-blue/30">
                  <div 
                    className="h-full bg-gradient-to-r from-team-blue-glow to-team-blue transition-all duration-500 rounded-full ml-auto"
                    style={{ width: blueWarriors.length > 0 ? `${(blueAlive / blueWarriors.length) * 100}%` : '100%' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Battlefield */}
        <BattleField
          redWarriors={redWarriors}
          blueWarriors={blueWarriors}
          attackAnimations={attackAnimations}
          phase={phase}
        />

        {/* Game over modal */}
        {phase === 'gameover' && winner && score && (
          <GameOverModal
            winner={winner}
            score={score}
            onPlayAgain={resetGame}
          />
        )}
      </main>
    </div>
  );
}
