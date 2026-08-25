"use client";

import React, { useState } from 'react';
import { X, Play, Sparkles } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';

interface SimulateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSimulate: (amount: number, failureType: string) => Promise<void>;
  isSimulating: boolean;
}

export function SimulateModal({ isOpen, onClose, onSimulate, isSimulating }: SimulateModalProps) {
  const [amount, setAmount] = useState<number>(3499);
  const [failureType, setFailureType] = useState<string>('GATEWAY_TIMEOUT');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSimulate(amount, failureType);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card border border-border/50 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-5 border-b border-border/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Simulate Payment Failure</h3>
              <p className="text-[11px] text-muted-foreground">Trigger failure event & watch AI Agent pipeline</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div>
            <Label className="block font-semibold text-foreground mb-1.5">Payment Amount (₹ INR)</Label>
            <Input
              type="number"
              min="100"
              step="100"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 100)}
              className="font-mono text-sm"
            />
          </div>

          <div>
            <Label className="block font-semibold text-foreground mb-1.5">Failure Classification</Label>
            <select
              value={failureType}
              onChange={(e) => setFailureType(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border/60 text-foreground text-xs focus:outline-none focus:border-emerald-500"
            >
              <option value="GATEWAY_TIMEOUT">GATEWAY_TIMEOUT (High Probability ~85%)</option>
              <option value="INSUFFICIENT_FUNDS">INSUFFICIENT_FUNDS (SMS Reminder Flow ~65%)</option>
              <option value="BANK_DOWNTIME">BANK_DOWNTIME (High Probability ~88%)</option>
              <option value="CARD_EXPIRED">CARD_EXPIRED (Medium Probability ~75%)</option>
              <option value="INVALID_ACCOUNT">INVALID_ACCOUNT (Low Probability ~15% -&gt; Stop)</option>
            </select>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSimulating}
              className="bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5"
            >
              <Play className="h-3.5 w-3.5" />
              {isSimulating ? 'Evaluating...' : 'Run Simulation'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
