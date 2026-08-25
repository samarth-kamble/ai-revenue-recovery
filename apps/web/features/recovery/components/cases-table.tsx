"use client";

import React, { useState } from 'react';
import { Eye, Play, Shield, Cpu, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@workspace/ui/components/table';
import { Progress } from '@workspace/ui/components/progress';
import { RecoveryCase } from '../types';

interface CasesTableProps {
  cases: RecoveryCase[];
  onSelectCase: (caseId: string) => void;
  onEvaluateCase: (paymentId: string) => void;
  isEvaluating: boolean;
}

export function CasesTable({ cases, onSelectCase, onEvaluateCase, isEvaluating }: CasesTableProps) {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const filteredCases = cases.filter((c) => {
    if (filterStatus === 'ALL') return true;
    if (filterStatus === 'IN_PROGRESS') return c.status === 'IN_PROGRESS' || c.status === 'OPEN';
    if (filterStatus === 'RECOVERED') return c.status === 'RECOVERED';
    if (filterStatus === 'STOPPED') return c.status === 'STOPPED' || c.status === 'ESCALATED' || c.status === 'FAILED_TERMINAL';
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS':
      case 'OPEN':
        return (
          <Badge variant="secondary" className="gap-1 font-mono text-[10px] bg-blue-500/10 text-blue-400 border-blue-500/20">
            <Clock className="h-3 w-3" />
            In Progress
          </Badge>
        );
      case 'RECOVERED':
        return (
          <Badge variant="default" className="gap-1 font-mono text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
            <CheckCircle className="h-3 w-3" />
            Recovered
          </Badge>
        );
      case 'ESCALATED':
        return (
          <Badge variant="outline" className="gap-1 font-mono text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/20">
            <AlertCircle className="h-3 w-3" />
            Escalated
          </Badge>
        );
      case 'STOPPED':
      case 'FAILED_TERMINAL':
      default:
        return (
          <Badge variant="destructive" className="gap-1 font-mono text-[10px] bg-rose-500/10 text-rose-400 border-rose-500/20">
            <AlertCircle className="h-3 w-3" />
            Stopped
          </Badge>
        );
    }
  };

  return (
    <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-md overflow-hidden">
      {/* Header & Filter Tabs */}
      <div className="p-5 border-b border-border/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-foreground">Recovery Cases</h2>
          <p className="text-xs text-muted-foreground">Monitor payment failure recovery lifecycle & AI decision loops</p>
        </div>

        <div className="flex items-center gap-1 bg-secondary/50 p-1 rounded-xl border border-border/40 text-xs">
          {['ALL', 'IN_PROGRESS', 'RECOVERED', 'STOPPED'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterStatus(tab)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                filterStatus === tab
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab === 'ALL' ? 'All Cases' : tab === 'IN_PROGRESS' ? 'Active' : tab === 'RECOVERED' ? 'Recovered' : 'Stopped / Escalated'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Table>
        <TableHeader className="bg-secondary/30">
          <TableRow className="border-border/30">
            <TableHead className="font-mono uppercase text-[10px] tracking-wider">Case & Payment</TableHead>
            <TableHead className="font-mono uppercase text-[10px] tracking-wider">Customer</TableHead>
            <TableHead className="font-mono uppercase text-[10px] tracking-wider">Amount</TableHead>
            <TableHead className="font-mono uppercase text-[10px] tracking-wider">Failure Reason</TableHead>
            <TableHead className="font-mono uppercase text-[10px] tracking-wider">ML Score</TableHead>
            <TableHead className="font-mono uppercase text-[10px] tracking-wider">AI Recommendation</TableHead>
            <TableHead className="font-mono uppercase text-[10px] tracking-wider">Policy Check</TableHead>
            <TableHead className="font-mono uppercase text-[10px] tracking-wider">Status</TableHead>
            <TableHead className="font-mono uppercase text-[10px] tracking-wider text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredCases.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                No recovery cases matching current filter.
              </TableCell>
            </TableRow>
          ) : (
            filteredCases.map((c) => {
              const latestPred = c.predictions?.[0];
              const latestAi = c.aiDecisions?.[0];
              const latestPolicy = c.policyDecisions?.[0];
              const latestAttempt = c.payment?.attempts?.[0];
              const failureMsg = latestAttempt?.failures?.[0]?.errorClassification || 'GATEWAY_TIMEOUT';

              const prob = latestPred?.recoveryProbability ?? 0.85;
              const probPct = Math.round(prob * 100);

              return (
                <TableRow key={c.id} className="border-border/30 hover:bg-secondary/20 transition-colors">
                  {/* Case ID */}
                  <TableCell className="font-mono">
                    <div className="font-semibold text-foreground">{c.id.substring(0, 12)}...</div>
                    <div className="text-[10px] text-muted-foreground">Pay ID: {c.paymentId.substring(0, 12)}</div>
                  </TableCell>

                  {/* Customer */}
                  <TableCell>
                    <div className="font-medium text-foreground">{c.payment?.customer?.name || 'Customer'}</div>
                    <div className="text-[10px] text-muted-foreground">{c.payment?.customer?.email || 'N/A'}</div>
                  </TableCell>

                  {/* Amount */}
                  <TableCell className="font-semibold font-mono">
                    ₹{parseFloat(c.payment?.amount || '0').toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </TableCell>

                  {/* Failure Reason */}
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {failureMsg}
                    </Badge>
                  </TableCell>

                  {/* ML Score */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={probPct} className="w-12 h-1.5" />
                      <span className="font-mono font-bold text-[11px]">{probPct}%</span>
                    </div>
                  </TableCell>

                  {/* AI Recommendation */}
                  <TableCell>
                    <div className="flex items-center gap-1.5 font-medium text-cyan-300">
                      <Cpu className="h-3.5 w-3.5 text-cyan-400" />
                      {latestAi?.recommendedAction || 'RETRY_PAYMENT'}
                    </div>
                  </TableCell>

                  {/* Policy Check */}
                  <TableCell>
                    <Badge
                      variant={latestPolicy?.outcome === 'DENY' ? 'destructive' : 'default'}
                      className="gap-1 font-mono text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    >
                      <Shield className="h-3 w-3" />
                      {latestPolicy?.outcome || 'ALLOW'}
                    </Badge>
                  </TableCell>

                  {/* Status */}
                  <TableCell>{getStatusBadge(c.status)}</TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSelectCase(c.id)}
                        className="h-8 px-2.5 text-xs gap-1 text-muted-foreground hover:text-foreground"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Timeline
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEvaluateCase(c.paymentId)}
                        disabled={isEvaluating}
                        className="h-8 px-2.5 text-xs gap-1 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                      >
                        <Play className="h-3 w-3" />
                        Re-run AI
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
