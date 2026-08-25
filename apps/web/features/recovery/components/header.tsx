"use client";

import React from 'react';
import { Activity, Cpu, Sparkles, PlusCircle } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';

interface HeaderProps {
  onOpenSimulate: () => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export function Header({ onOpenSimulate, onRefresh, isLoading }: HeaderProps) {
  return (
    <header className="border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Title & Brand */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-950/20">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground">AI Revenue Recovery</h1>
              <Badge variant="default" className="text-[10px] uppercase tracking-widest font-mono bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                Track 3
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">Autonomous Policy-Controlled Payment Recovery Engine</p>
          </div>
        </div>

        {/* Status Badges & Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50 border border-border/60 text-xs">
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-muted-foreground font-mono">Gateway:</span>
            <span className="font-semibold text-foreground">:4000</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50 border border-border/60 text-xs">
            <Cpu className="h-3.5 w-3.5 text-cyan-400" />
            <span className="text-muted-foreground font-mono">AI Agent:</span>
            <span className="font-semibold text-foreground">:4002</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="text-xs gap-1.5"
          >
            <Activity className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={onOpenSimulate}
            className="text-xs gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium shadow-md shadow-emerald-950/20"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            Simulate Payment Failure
          </Button>
        </div>
      </div>
    </header>
  );
}
