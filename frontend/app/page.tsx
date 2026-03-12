'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Swords, Shield, Zap, Trophy, Sparkles, Users, Flame, Heart, Info, Github, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SetupPage() {
  const router = useRouter();
  const [redReplicas, setRedReplicas] = useState(5);
  const [blueReplicas, setBlueReplicas] = useState(5);
  const [red, setRed] = useState({ replicas: 5, health: 100, attack: 10 });
  const [blue, setBlue] = useState({ replicas: 5, health: 100, attack: 10 });

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Navigate to battle page IMMEDIATELY - don't wait for API
    router.push('/battle');
    
    // Fire and forget - API call happens in background
    fetch(`${apiUrl}/battle/setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ red, blue }),
    }).catch(error => {
      console.error('Setup error:', error);
    });
  };

const podsConfig = [
  // Red Pods
  ['top-[10%]', 'left-[5%]', 'w-16 h-16', 'bg-team-red/20', '18s', '0s'],
  ['top-[60%]', 'left-[10%]', 'w-12 h-12', 'bg-team-red/15', '22s', '-2s'],
  ['bottom-[10%]', 'right-[15%]', 'w-24 h-24', 'bg-team-red/10', '25s', '-5s'],
  ['top-[45%]', 'right-[5%]', 'w-14 h-14', 'bg-team-red/20', '20s', '-1s'],
  ['bottom-[30%]', 'left-[40%]', 'w-10 h-10', 'bg-team-red/15', '15s', '-3s'],
  
  // Blue Pods
  ['top-[25%]', 'right-[10%]', 'w-12 h-12', 'bg-team-blue/15', '17s', '-4s'],
  ['bottom-[15%]', 'left-[15%]', 'w-20 h-20', 'bg-team-blue/10', '24s', '0s'],
  ['top-[5%]', 'right-[25%]', 'w-10 h-10', 'bg-team-blue/15', '19s', '-6s'],
  ['bottom-[45%]', 'right-[30%]', 'w-18 h-18', 'bg-team-blue/10', '21s', '-2s'],
  ['top-[70%]', 'right-[40%]', 'w-14 h-14', 'bg-team-blue/20', '23s', '-8s'],

  // Extra "Network" Noise Pods
  ['top-[40%]', 'left-[20%]', 'w-8 h-8', 'bg-team-red/10', '16s', '-1s'],
  ['bottom-[5%]', 'left-[50%]', 'w-12 h-12', 'bg-team-blue/10', '28s', '-4s'],
];

  const getRandom = (min: number, max: number) => Math.random() * (max - min) + min;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-secondary/30 to-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements... */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {podsConfig.map(([posVert, posHoriz, size, color, duration], index) => (
          <div
            key={index}
            className={cn(
              'absolute rounded-2xl border-2 border-border/20 shadow-xl',
              size,
              color,
              posVert,
              posHoriz,
              'animate-bounce' // Standard Tailwind bouncy/float animation
            )}
            style={{ 
              // Add randomness via inline style
              animationDuration: duration, 
              animationDelay: `${index * 0.5}s`, // Staggered delays
              opacity: 0.8,
            }}
          />
        ))}

        {/* --- Grid pattern (can keep this too if you like) --- */}
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]" />
      </div>

      <Card className="w-full max-w-2xl ... relative z-10 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-team-red via-primary to-team-blue" />
        
        <CardHeader className="text-center pb-2 pt-8">
          <h1 className="text-5xl font-black tracking-tight">
            <span className="text-team-red">Clash</span>
            <span className="text-muted-foreground mx-2">of</span>
            <span className="text-team-blue">Kube</span>
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">Configure your forces</p>
        {/* Project Description */}
          <div className="mt-4 flex flex-col items-center gap-2 max-w-md mx-auto">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
              <Info className="w-3.5 h-3.5" />
              Microservices Chaos Sim
            </div>
<p className="text-muted-foreground text-sm leading-relaxed">
              A battle simulation in <span className='font-bold'>Kubernetes</span> where each <span className='font-bold'>Pod</span> is a soldier. 
              Visualizing how Kubernetes handles a distributed system in real-time.
            </p>
          </div>
        </CardHeader>
        
        <CardContent className="pt-4 pb-8 px-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-2 gap-8">
              {/* Red Team Section */}
              <div className="space-y-4 p-5 rounded-2xl border-2 border-team-red/30 bg-team-red/5">
                <div className="flex items-center gap-3 mb-2">
                  <Shield className="w-6 h-6 text-team-red" />
                  <span className="font-bold text-xl text-team-red">Red Team</span>
                </div>
                
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold uppercase flex items-center gap-1">
                      <Zap className="w-3 h-3" /> Replicas
                    </Label>
                    <Input 
                      type="number" 
                      value={red.replicas} 
                      onChange={e => setRed({...red, replicas: parseInt(e.target.value) || 1})}
                      className="border-team-red/20 focus-visible:ring-team-red"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold uppercase flex items-center gap-1">
                      <Heart className="w-3 h-3" /> Health
                    </Label>
                    <Input 
                      type="number" 
                      value={red.health} 
                      onChange={e => setRed({...red, health: parseInt(e.target.value) || 1})}
                      className="border-team-red/20 focus-visible:ring-team-red"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold uppercase flex items-center gap-1">
                      <Flame className="w-3 h-3" /> Attack
                    </Label>
                    <Input 
                      type="number" 
                      value={red.attack} 
                      onChange={e => setRed({...red, attack: parseInt(e.target.value) || 1})}
                      className="border-team-red/20 focus-visible:ring-team-red"
                    />
                  </div>
                </div>
              </div>

              {/* Blue Team Section */}
              <div className="space-y-4 p-5 rounded-2xl border-2 border-team-blue/30 bg-team-blue/5">
                <div className="flex items-center gap-3 mb-2">
                  <Shield className="w-6 h-6 text-team-blue" />
                  <span className="font-bold text-xl text-team-blue">Blue Team</span>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold uppercase flex items-center gap-1">
                      <Zap className="w-3 h-3" /> Replicas
                    </Label>
                    <Input 
                      type="number" 
                      value={blue.replicas} 
                      onChange={e => setBlue({...blue, replicas: parseInt(e.target.value) || 1})}
                      className="border-team-blue/20 focus-visible:ring-team-blue"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold uppercase flex items-center gap-1">
                      <Heart className="w-3 h-3" /> Health
                    </Label>
                    <Input 
                      type="number" 
                      value={blue.health} 
                      onChange={e => setBlue({...blue, health: parseInt(e.target.value) || 1})}
                      className="border-team-blue/20 focus-visible:ring-team-blue"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold uppercase flex items-center gap-1">
                      <Flame className="w-3 h-3" /> Attack
                    </Label>
                    <Input 
                      type="number" 
                      value={blue.attack} 
                      onChange={e => setBlue({...blue, attack: parseInt(e.target.value) || 1})}
                      className="border-team-blue/20 focus-visible:ring-team-blue"
                    />
                  </div>
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-16 gap-3 text-xl font-black bg-gradient-to-r from-team-red via-primary to-team-blue hover:scale-[1.01] transition-transform shadow-xl"
            >
              <Zap className="w-7 h-7" />
              DEPLOY & BATTLE!
            </Button>
          </form>

          {/* Footer Section */}
          <div className="mt-8 pt-6 border-t border-border/50 flex flex-col items-center gap-4">
            <div className="flex items-center gap-4">
              <a 
                href="https://github.com/metooo" // Update with your actual handle
                target="_blank"
                className="flex items-center gap-2 text-sm font-semibold hover:text-primary transition-colors group"
              >
                <Github className="w-5 h-5" />
                <span>metooo</span>
                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
              
              <div className="h-4 w-px bg-border" />
              
              <a 
                href="https://github.com/metooo/clash-of-kube" // Placeholder repo
                target="_blank"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                View Source
              </a>
            </div>
            
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 font-bold">
              Built with NestJS • Go • Kubernetes • Redis
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
