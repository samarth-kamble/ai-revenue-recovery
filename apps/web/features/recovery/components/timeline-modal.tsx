"use client";

import React from 'react';
import { X, Shield, Cpu, Clock, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import { Progress } from '@workspace/ui/components/progress';
import { RecoveryCase } from '../types';

interface TimelineModalProps {
  recoveryCase: RecoveryCase | null;
  onClose: () => void;
}

export function TimelineModal({ recoveryCase, onClose }: TimelineModalProps) {
  if (!recoveryCase) return null;

  const latestPred = recoveryCase.predictions?.[0];
  const latestAi = recoveryCase.aiDecisions?.[0];
  const latestPolicy = recoveryCase.policyDecisions?.[0];
  const latestAction = recoveryCase.recoveryActions?.[0];
  const latestAttempt = recoveryCase.payment?.attempts?.[0];
  const failure = latestAttempt?.failures?.[0];

  const probPct = Math.round((latestPred?.recoveryProbability ?? 0.85) * 100);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end transition-opacity">
      <div className="w-full max-w-2xl bg-card border-l border-border/50 h-full overflow-y-auto flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Modal Header */}
        <div className="p-6 border-b border-border/40 flex items-center justify-between sticky top-0 bg-card/90 backdrop-blur-md z-10">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-foreground">Decision & Audit Timeline</h2>
              <Badge variant="outline" className="font-mono text-xs">
                {recoveryCase.id.substring(0, 12)}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Traceable audit chain for payment failure recovery</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 flex-1">
          {/* Summary Card */}
          <div className="p-4 rounded-xl bg-secondary/30 border border-border/40 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div>
              <span className="text-muted-foreground text-[10px] uppercase block">Customer</span>
              <span className="font-semibold text-foreground">{recoveryCase.payment?.customer?.name || 'Rohan Sharma'}</span>
            </div>
            <div>
              <span className="text-muted-foreground text-[10px] uppercase block">Amount</span>
              <span className="font-semibold text-emerald-400">₹{parseFloat(recoveryCase.payment?.amount || '0').toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div>
              <span className="text-muted-foreground text-[10px] uppercase block">Failure Reason</span>
              <span className="font-semibold text-amber-400">{failure?.errorClassification || 'GATEWAY_TIMEOUT'}</span>
            </div>
            <div>
              <span className="text-muted-foreground text-[10px] uppercase block">Case Status</span>
              <span className="font-semibold text-cyan-400">{recoveryCase.status}</span>
            </div>
          </div>

          {/* Decision Timeline Flow */}
          <div className="relative pl-6 border-l-2 border-border/50 space-y-8">
            {/* Step 1: Payment Failed Event */}
            <div className="relative">
              <div className="absolute -left-[31px] top-0 h-6 w-6 rounded-full bg-rose-500/20 border border-rose-500/50 flex items-center justify-center text-rose-400">
                <AlertTriangle className="h-3.5 w-3.5" />
              </div>
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-foreground">Step 1: Payment Failure Recorded</span>
                  <span className="text-[10px] text-muted-foreground font-mono">{latestAttempt?.attemptAt ? new Date(latestAttempt.attemptAt).toLocaleTimeString() : '11:24 AM'}</span>
                </div>
                <div className="p-3 rounded-lg bg-secondary/40 border border-border/30 text-xs text-muted-foreground space-y-1">
                  <div><strong className="text-foreground">Gateway:</strong> {latestAttempt?.gateway || 'RAZORPAY'}</div>
                  <div><strong className="text-foreground">Error Code:</strong> {failure?.rawErrorCode || 'GATEWAY_TIMEOUT'}</div>
                  <div><strong className="text-foreground">Message:</strong> {failure?.errorMessage || 'Payment gateway connection timed out.'}</div>
                  <div><strong className="text-foreground">Idempotency Key:</strong> <code className="text-[10px] font-mono text-cyan-400">{latestAttempt?.idempotencyKey || 'idemp_pay_demo_1'}</code></div>
                </div>
              </div>
            </div>

            {/* Step 2: ML Model Prediction */}
            <div className="relative">
              <div className="absolute -left-[31px] top-0 h-6 w-6 rounded-full bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center text-cyan-400">
                <Cpu className="h-3.5 w-3.5" />
              </div>
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-foreground">Step 2: ML Recoverability Prediction</span>
                  <span className="text-[10px] text-muted-foreground font-mono">{latestPred?.createdAt ? new Date(latestPred.createdAt).toLocaleTimeString() : '11:24 AM'}</span>
                </div>
                <div className="p-3 rounded-lg bg-secondary/40 border border-border/30 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Recovery Probability:</span>
                    <span className="font-mono font-bold text-emerald-400 text-sm">{probPct}% ({latestPred?.riskTier || 'LOW'} Risk Tier)</span>
                  </div>
                  <Progress value={probPct} className="h-2" />
                  <div className="text-[10px] text-muted-foreground font-mono">
                    Model Version: {latestPred?.modelVersion || 'v1.0.0'}
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: AI Agent Recommendation */}
            <div className="relative">
              <div className="absolute -left-[31px] top-0 h-6 w-6 rounded-full bg-purple-500/20 border border-purple-500/50 flex items-center justify-center text-purple-400">
                <Cpu className="h-3.5 w-3.5" />
              </div>
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-foreground">Step 3: AI Recovery Agent Recommendation</span>
                  <span className="text-[10px] text-muted-foreground font-mono">{latestAi?.createdAt ? new Date(latestAi.createdAt).toLocaleTimeString() : '11:25 AM'}</span>
                </div>
                <div className="p-3 rounded-lg bg-secondary/40 border border-border/30 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Recommended Action:</span>
                    <Badge variant="outline" className="font-mono text-purple-300 border-purple-500/20 bg-purple-500/10">
                      {latestAi?.recommendedAction || 'RETRY_PAYMENT'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">Recommended Delay:</span>
                    <span className="font-mono text-foreground">{latestAi?.recommendedDelayMinutes || 15} mins</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">Agent Confidence:</span>
                    <span className="font-mono text-emerald-400 font-bold">{Math.round((latestAi?.confidenceScore || 0.9) * 100)}%</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    <span className="font-semibold text-foreground">Reason Codes:</span> {latestAi?.reasonCodes?.join(', ') || 'TRANSIENT_FAILURE, HIGH_RECOVERY_PROBABILITY'}
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4: Policy Engine Check */}
            <div className="relative">
              <div className="absolute -left-[31px] top-0 h-6 w-6 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
                <Shield className="h-3.5 w-3.5" />
              </div>
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-foreground">Step 4: Deterministic Policy Engine Evaluation</span>
                  <span className="text-[10px] text-muted-foreground font-mono">{latestPolicy?.createdAt ? new Date(latestPolicy.createdAt).toLocaleTimeString() : '11:25 AM'}</span>
                </div>
                <div className="p-3 rounded-lg bg-secondary/40 border border-border/30 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Policy Outcome:</span>
                    <Badge variant={latestPolicy?.outcome === 'DENY' ? 'destructive' : 'default'} className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                      {latestPolicy?.outcome || 'ALLOW'}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Evaluated Rules Checklist:</span>
                    <ul className="space-y-1 text-[11px] font-mono">
                      {(latestPolicy?.evaluatedRules || [
                        'ALLOW: Attempt count (1) < Max Retries (3)',
                        'ALLOW: Probability (0.85) >= Min Threshold (0.50)',
                        "ALLOW: Action 'RETRY_PAYMENT' is permitted by merchant policy",
                      ]).map((rule, idx) => (
                        <li key={idx} className="flex items-center gap-1.5 text-emerald-400/90">
                          <CheckCircle2 className="h-3 w-3 shrink-0" />
                          <span>{rule}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 5: Scheduled Action */}
            <div className="relative">
              <div className="absolute -left-[31px] top-0 h-6 w-6 rounded-full bg-blue-500/20 border border-blue-500/50 flex items-center justify-center text-blue-400">
                <Clock className="h-3.5 w-3.5" />
              </div>
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-foreground">Step 5: Recovery Action Scheduled</span>
                  <span className="text-[10px] text-muted-foreground font-mono">{latestAction?.createdAt ? new Date(latestAction.createdAt).toLocaleTimeString() : '11:25 AM'}</span>
                </div>
                <div className="p-3 rounded-lg bg-secondary/40 border border-border/30 text-xs space-y-1 text-muted-foreground">
                  <div><strong className="text-foreground">Action Type:</strong> {latestAction?.actionType || 'RETRY_PAYMENT'}</div>
                  <div><strong className="text-foreground">Scheduled Execution:</strong> {latestAction?.scheduledAt ? new Date(latestAction.scheduledAt).toLocaleString() : 'In 15 minutes'}</div>
                  <div><strong className="text-foreground">Idempotency Key:</strong> <code className="text-[10px] font-mono text-cyan-400">{latestAction?.idempotencyKey || 'act_c1bb2789_step_2'}</code></div>
                </div>
              </div>
            </div>
          </div>

          {/* Audit Event Trail Listing */}
          <div className="pt-4 border-t border-border/40">
            <h3 className="text-xs font-bold text-foreground mb-3 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-emerald-400" />
              Immutable Audit Events ({recoveryCase.auditEvents?.length || 5})
            </h3>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {(recoveryCase.auditEvents || []).map((evt) => (
                <div key={evt.id} className="p-2.5 rounded bg-secondary/30 border border-border/30 text-[11px] font-mono flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">{evt.eventType}</span>
                    <span className="text-muted-foreground text-[10px]">by {evt.actor}</span>
                  </div>
                  <span className="text-muted-foreground text-[10px]">{new Date(evt.createdAt).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
