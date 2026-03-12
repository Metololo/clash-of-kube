'use client';

import { cn } from '@/lib/utils';
import { BattleEventType, BattleLogEntry } from '@/types/battle';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Swords, 
  Skull, 
  Shield, 
  Trophy, 
  Rocket,
  Plus,
  ScrollText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

interface BattleLogsProps {
  logs: BattleLogEntry[];
}

function getEventIcon(type: BattleEventType) {
  switch (type) {
    case BattleEventType.WARRIOR_ATTACK:
      return <Swords className="w-4 h-4" />;
    case BattleEventType.WARRIOR_DIED:
      return <Skull className="w-4 h-4" />;
    case BattleEventType.WARRIOR_READY:
      return <Shield className="w-4 h-4" />;
    case BattleEventType.GAME_OVER:
      return <Trophy className="w-4 h-4" />;
    case BattleEventType.GAME_STARTED:
      return <Rocket className="w-4 h-4" />;
    case BattleEventType.POD_ADDED:
      return <Plus className="w-4 h-4" />;
    default:
      return null;
  }
}

function getEventColor(type: BattleEventType, team?: string) {
  if (team === 'red') return 'text-team-red';
  if (team === 'blue') return 'text-team-blue';
  
  switch (type) {
    case BattleEventType.WARRIOR_ATTACK:
      return 'text-respawn-yellow';
    case BattleEventType.WARRIOR_DIED:
      return 'text-destructive';
    case BattleEventType.WARRIOR_READY:
      return 'text-health-green';
    case BattleEventType.GAME_OVER:
      return 'text-primary';
    case BattleEventType.GAME_STARTED:
      return 'text-primary';
    default:
      return 'text-muted-foreground';
  }
}

function getEventBgColor(type: BattleEventType, team?: string) {
  if (team === 'red') return 'bg-team-red/10';
  if (team === 'blue') return 'bg-team-blue/10';
  
  switch (type) {
    case BattleEventType.WARRIOR_ATTACK:
      return 'bg-respawn-yellow/10';
    case BattleEventType.WARRIOR_DIED:
      return 'bg-destructive/10';
    case BattleEventType.WARRIOR_READY:
      return 'bg-health-green/10';
    case BattleEventType.GAME_OVER:
      return 'bg-primary/10';
    case BattleEventType.GAME_STARTED:
      return 'bg-primary/10';
    default:
      return 'bg-muted/30';
  }
}

function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function LogEntry({ log }: { log: BattleLogEntry }) {
  return (
    <div className={cn(
      'flex items-start gap-3 py-3 px-4 rounded-xl border border-transparent hover:border-border transition-colors',
      getEventBgColor(log.type, log.team),
    )}>
      <div className={cn(
        'mt-0.5 p-2 rounded-lg',
        getEventColor(log.type, log.team),
        'bg-background/50',
      )}>
        {getEventIcon(log.type)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground font-medium break-words">{log.message}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {formatTime(log.timestamp)}
        </p>
      </div>
    </div>
  );
}

export function BattleLogs({ logs }: BattleLogsProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 border-2">
          <ScrollText className="w-4 h-4" />
          Battle Logs
          {logs.length > 0 && (
            <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full font-bold">
              {logs.length}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:w-[600px] sm:max-w-[600px] p-0 flex flex-col">
        <SheetHeader className="px-6 py-4 border-b border-border bg-card/50">
          <SheetTitle className="flex items-center gap-3 text-xl">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <ScrollText className="w-5 h-5 text-primary" />
            </div>
            Battle Chronicle
            <span className="text-sm font-normal text-muted-foreground">
              ({logs.length} events)
            </span>
          </SheetTitle>
        </SheetHeader>
        <ScrollArea className="flex-1 px-4 py-4">
          <div className="space-y-2">
            {logs.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
                  <Swords className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-lg font-medium">No battle events yet</p>
                <p className="text-sm text-muted-foreground mt-1">Events will appear here once the battle begins</p>
              </div>
            ) : (
              logs.map(log => (
                <LogEntry key={log.id} log={log} />
              ))
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
