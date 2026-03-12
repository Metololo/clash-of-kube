'use client';

import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Warrior, GamePhase } from '@/types/battle';
import { PodUnit } from './pod-unit';
import { Loader2, Swords } from 'lucide-react';

interface BattleFieldProps {
  redWarriors: Warrior[];
  blueWarriors: Warrior[];
  attackAnimations: Map<string, { target: string; damage: number }>;
  phase: GamePhase;
}

interface LaserBeam {
  id: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  color: string;
}

export function BattleField({ redWarriors, blueWarriors, attackAnimations, phase }: BattleFieldProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [podPositions, setPodPositions] = useState<Map<string, { x: number; y: number }>>(new Map());
  const [lasers, setLasers] = useState<LaserBeam[]>([]);
  
  // Limit lasers to prevent lag
  const MAX_CONCURRENT_LASERS = 8;

  // Calculate grid layout based on warrior count
  const getGridConfig = useCallback((count: number) => {
    if (count <= 4) return { cols: 2, size: 'large' };
    if (count <= 9) return { cols: 3, size: 'medium' };
    if (count <= 16) return { cols: 4, size: 'medium' };
    if (count <= 36) return { cols: 6, size: 'small' };
    if (count <= 64) return { cols: 8, size: 'tiny' };
    return { cols: 10, size: 'micro' };
  }, []);

  const redConfig = useMemo(() => getGridConfig(redWarriors.length), [redWarriors.length, getGridConfig]);
  const blueConfig = useMemo(() => getGridConfig(blueWarriors.length), [blueWarriors.length, getGridConfig]);

  // Update pod positions when warriors change
  const updatePodPosition = useCallback((podName: string, x: number, y: number) => {
    setPodPositions(prev => {
      const newMap = new Map(prev);
      newMap.set(podName, { x, y });
      return newMap;
    });
  }, []);

  // Handle attack animations with lasers
  useEffect(() => {
    if (attackAnimations.size === 0) return;

    const newLasers: LaserBeam[] = [];
    let laserCount = 0;

    attackAnimations.forEach((attack, attackerName) => {
      if (laserCount >= MAX_CONCURRENT_LASERS) return;
      
      const attackerPos = podPositions.get(attackerName);
      const targetPos = podPositions.get(attack.target);
      
      if (attackerPos && targetPos) {
        const attacker = [...redWarriors, ...blueWarriors].find(w => w.podName === attackerName);
        const color = attacker?.team === 'red' ? 'var(--team-red)' : 'var(--team-blue)';
        
        newLasers.push({
          id: `${attackerName}-${attack.target}-${Date.now()}`,
          fromX: attackerPos.x,
          fromY: attackerPos.y,
          toX: targetPos.x,
          toY: targetPos.y,
          color,
        });
        laserCount++;
      }
    });

    if (newLasers.length > 0) {
      setLasers(prev => [...prev, ...newLasers].slice(-MAX_CONCURRENT_LASERS));
      
      // Clear lasers after animation
      setTimeout(() => {
        setLasers(prev => prev.filter(l => !newLasers.some(nl => nl.id === l.id)));
      }, 400);
    }
  }, [attackAnimations, podPositions, redWarriors, blueWarriors]);

  return (
    <div 
      ref={containerRef}
      className="flex-1 relative rounded-2xl border-2 border-border bg-card shadow-lg overflow-hidden min-h-[500px]"
    >
      {/* Battle arena background - checkerboard pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.04]" />
      
      {/* Gradient overlays for team sides */}
      <div className="absolute left-0 top-0 bottom-0 w-[48%] bg-gradient-to-r from-team-red/5 to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-[48%] bg-gradient-to-l from-team-blue/5 to-transparent pointer-events-none" />
      
      {/* Center divider */}
      <div className="absolute left-1/2 top-4 bottom-4 w-[3px] bg-gradient-to-b from-team-red/40 via-border to-team-blue/40 -translate-x-1/2 rounded-full" />
      
      {/* VS Badge in center */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
        <div className={cn(
          'w-14 h-14 rounded-2xl border-2 flex items-center justify-center shadow-lg',
          phase === 'battle' ? 'bg-respawn-yellow/20 border-respawn-yellow' : 'bg-card border-border'
        )}>
          <Swords className={cn(
            'w-7 h-7',
            phase === 'battle' ? 'text-respawn-yellow' : 'text-muted-foreground'
          )} />
        </div>
      </div>

      {/* SVG layer for lasers */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-30">
        <defs>
          <filter id="glow-red" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <filter id="glow-blue" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        {lasers.map(laser => (
          <g key={laser.id}>
            {/* Laser glow */}
            <line
              x1={laser.fromX}
              y1={laser.fromY}
              x2={laser.toX}
              y2={laser.toY}
              stroke={laser.color}
              strokeWidth="8"
              strokeLinecap="round"
              opacity="0.4"
              className="animate-laser"
            />
            {/* Laser core */}
            <line
              x1={laser.fromX}
              y1={laser.fromY}
              x2={laser.toX}
              y2={laser.toY}
              stroke={laser.color}
              strokeWidth="3"
              strokeLinecap="round"
              className="animate-laser"
            />
            {/* Impact flash */}
            <circle
              cx={laser.toX}
              cy={laser.toY}
              r="12"
              fill={laser.color}
              opacity="0.6"
              className="animate-ping"
            />
          </g>
        ))}
      </svg>

      {/* Red team side (left) */}
      <div className="absolute left-0 top-0 bottom-0 w-[48%] p-4 flex flex-col">
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-team-red/20">
          <div className="w-8 h-8 rounded-lg bg-team-red flex items-center justify-center shadow">
            <span className="text-white font-black text-sm">R</span>
          </div>
          <span className="font-black text-team-red uppercase tracking-wide">Red Army</span>
          <span className="text-sm text-muted-foreground ml-auto">
            {redWarriors.filter(w => w.status === 'ready' || w.status === 'alive').length} / {redWarriors.length}
          </span>
        </div>
        <div 
          className="flex-1 grid gap-3 content-start justify-items-center auto-rows-min"
          style={{ 
            gridTemplateColumns: `repeat(${redConfig.cols}, minmax(0, 1fr))`,
          }}
        >
          {redWarriors.map(warrior => (
            <PodUnit
              key={warrior.podName}
              warrior={warrior}
              size={redConfig.size as 'large' | 'medium' | 'small' | 'tiny' | 'micro'}
              onPositionUpdate={updatePodPosition}
              isAttacking={attackAnimations.has(warrior.podName)}
              isBeingAttacked={Array.from(attackAnimations.values()).some(a => a.target === warrior.podName)}
            />
          ))}
        </div>
      </div>

      {/* Blue team side (right) */}
      <div className="absolute right-0 top-0 bottom-0 w-[48%] p-4 flex flex-col">
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-team-blue/20">
          <span className="text-sm text-muted-foreground">
            {blueWarriors.filter(w => w.status === 'ready' || w.status === 'alive').length} / {blueWarriors.length}
          </span>
          <span className="font-black text-team-blue uppercase tracking-wide ml-auto">Blue Army</span>
          <div className="w-8 h-8 rounded-lg bg-team-blue flex items-center justify-center shadow">
            <span className="text-white font-black text-sm">B</span>
          </div>
        </div>
        <div 
          className="flex-1 grid gap-3 content-start justify-items-center auto-rows-min"
          style={{ 
            gridTemplateColumns: `repeat(${blueConfig.cols}, minmax(0, 1fr))`,
          }}
        >
          {blueWarriors.map(warrior => (
            <PodUnit
              key={warrior.podName}
              warrior={warrior}
              size={blueConfig.size as 'large' | 'medium' | 'small' | 'tiny' | 'micro'}
              onPositionUpdate={updatePodPosition}
              isAttacking={attackAnimations.has(warrior.podName)}
              isBeingAttacked={Array.from(attackAnimations.values()).some(a => a.target === warrior.podName)}
            />
          ))}
        </div>
      </div>

      {/* Waiting message */}
      {redWarriors.length === 0 && blueWarriors.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="text-center bg-card/90 backdrop-blur-sm p-8 rounded-2xl border-2 border-border shadow-xl">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
            <p className="text-xl font-bold text-foreground">Deploying Warriors...</p>
            <p className="text-muted-foreground mt-1">Pods will spawn here shortly</p>
          </div>
        </div>
      )}
    </div>
  );
}
