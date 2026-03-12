'use client';

import { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Warrior } from '@/types/battle';
import { Skull, Shield, Loader2, Zap } from 'lucide-react';

interface PodUnitProps {
  warrior: Warrior;
  size: 'large' | 'medium' | 'small' | 'tiny' | 'micro';
  onPositionUpdate: (podName: string, x: number, y: number) => void;
  isAttacking?: boolean;
  isBeingAttacked?: boolean;
}

const sizeConfig = {
  large: {
    container: 'w-20 h-24',
    icon: 'w-8 h-8',
    iconContainer: 'w-12 h-12',
    showName: true,
    showHealth: true,
    showStatus: true,
    fontSize: 'text-xs',
  },
  medium: {
    container: 'w-16 h-20',
    icon: 'w-6 h-6',
    iconContainer: 'w-10 h-10',
    showName: true,
    showHealth: true,
    showStatus: false,
    fontSize: 'text-[10px]',
  },
  small: {
    container: 'w-12 h-14',
    icon: 'w-5 h-5',
    iconContainer: 'w-8 h-8',
    showName: false,
    showHealth: true,
    showStatus: false,
    fontSize: 'text-[9px]',
  },
  tiny: {
    container: 'w-8 h-10',
    icon: 'w-4 h-4',
    iconContainer: 'w-6 h-6',
    showName: false,
    showHealth: false,
    showStatus: false,
    fontSize: 'text-[8px]',
  },
  micro: {
    container: 'w-6 h-6',
    icon: 'w-3 h-3',
    iconContainer: 'w-5 h-5',
    showName: false,
    showHealth: false,
    showStatus: false,
    fontSize: 'text-[7px]',
  },
};

export function PodUnit({ warrior, size, onPositionUpdate, isAttacking, isBeingAttacked }: PodUnitProps) {
  const ref = useRef<HTMLDivElement>(null);
  const config = sizeConfig[size];
  const isRed = warrior.team === 'red';
  const healthPercent = (warrior.health / warrior.maxHealth) * 100;
  const shortName = warrior.podName.split('-').slice(-1)[0];

  // Update position for laser targeting
  useEffect(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const parent = ref.current.offsetParent as HTMLElement;
      const parentRect = parent?.getBoundingClientRect() || { left: 0, top: 0 };
      
      const x = rect.left + rect.width / 2 - parentRect.left;
      const y = rect.top + rect.height / 2 - parentRect.top;
      
      onPositionUpdate(warrior.podName, x, y);
    }
  }, [warrior.podName, onPositionUpdate, warrior.status]);

  const isDead = warrior.status === 'dead';
  const isRespawning = warrior.status === 'respawning';
  const isPending = warrior.status === 'pending';
  const isReady = warrior.status === 'ready';

  return (
    <div
      ref={ref}
      className={cn(
        'relative flex flex-col items-center justify-center rounded-xl transition-all duration-300 animate-pod-spawn shadow-md',
        config.container,
        // Team colors - more vibrant on light theme
        isRed 
          ? 'bg-gradient-to-b from-team-red/25 to-team-red/10 border-team-red/60 shadow-team-red/10' 
          : 'bg-gradient-to-b from-team-blue/25 to-team-blue/10 border-team-blue/60 shadow-team-blue/10',
        // Border
        size !== 'micro' && 'border-2',
        size === 'micro' && 'border',
        // Status-based styling
        isPending && 'opacity-50 border-dashed bg-secondary/50',
        isReady && 'ring-2 ring-health-green ring-offset-2 ring-offset-background',
        isDead && 'opacity-30 grayscale bg-muted/50',
        isRespawning && 'opacity-60 border-respawn-yellow ring-2 ring-respawn-yellow animate-pulse',
        // Attack states
        isAttacking && 'scale-110 z-20 shadow-lg',
        isBeingAttacked && 'animate-shake',
      )}
    >
      {/* Attack flash */}
      {isAttacking && (
        <div className={cn(
          'absolute inset-0 rounded-lg animate-pulse-ring',
          isRed ? 'text-team-red/50' : 'text-team-blue/50'
        )} />
      )}

      {/* Damage indicator */}
      {isBeingAttacked && warrior.lastDamageReceived && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 animate-damage-float z-30">
          <span className="text-destructive font-bold text-sm bg-background/80 px-1 rounded">
            -{warrior.lastDamageReceived}
          </span>
        </div>
      )}

      {/* Attacking indicator */}
      {isAttacking && size !== 'micro' && (
        <div className="absolute -top-1 -right-1 z-20">
          <Zap className="w-4 h-4 text-respawn-yellow animate-pulse" />
        </div>
      )}

      {/* Icon container */}
      <div className={cn(
        'rounded-full flex items-center justify-center',
        config.iconContainer,
        isRed ? 'bg-team-red/30' : 'bg-team-blue/30',
        isDead && 'bg-muted',
        isRespawning && 'bg-respawn-yellow/30',
      )}>
        {isDead ? (
          <Skull className={cn(config.icon, 'text-muted-foreground')} />
        ) : isRespawning ? (
          <Loader2 className={cn(config.icon, 'text-respawn-yellow animate-spin')} />
        ) : (
          <Shield className={cn(
            config.icon,
            isRed ? 'text-team-red' : 'text-team-blue',
          )} />
        )}
      </div>

      {/* Name */}
      {config.showName && (
        <span className={cn(
          'font-mono font-medium truncate max-w-full mt-1',
          config.fontSize,
          isRed ? 'text-team-red' : 'text-team-blue',
        )}>
          {shortName}
        </span>
      )}

      {/* Status */}
      {config.showStatus && (
        <span className={cn(
          'uppercase tracking-wide',
          'text-[8px]',
          isPending && 'text-muted-foreground',
          isReady && 'text-health-green',
          warrior.status === 'alive' && 'text-health-green',
          isDead && 'text-destructive',
          isRespawning && 'text-respawn-yellow',
        )}>
          {warrior.status}
        </span>
      )}

      {/* Health bar */}
      {config.showHealth && (warrior.status === 'alive' || warrior.status === 'ready') && (
        <div className="w-full px-1 mt-1">
          <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full transition-all duration-300 rounded-full',
                healthPercent > 50 && 'bg-health-green',
                healthPercent <= 50 && healthPercent > 25 && 'bg-respawn-yellow',
                healthPercent <= 25 && 'bg-destructive',
              )}
              style={{ width: `${healthPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Micro/tiny status indicator dot */}
      {size === 'micro' && !isDead && !isRespawning && (
        <div className={cn(
          'absolute bottom-0 right-0 w-1.5 h-1.5 rounded-full',
          healthPercent > 50 && 'bg-health-green',
          healthPercent <= 50 && healthPercent > 25 && 'bg-respawn-yellow',
          healthPercent <= 25 && 'bg-destructive',
        )} />
      )}
    </div>
  );
}
