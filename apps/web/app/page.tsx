"use client";

import React, { useState } from 'react';
import {
  useRecoveryCases,
  useRecoveryCaseDetail,
  useEvaluateMutation,
  useSimulateFailureMutation,
  Header,
  MetricsCards,
  CasesTable,
  TimelineModal,
  SimulateModal,
} from '@/features/recovery';

export default function DashboardPage() {
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [isSimulateOpen, setIsSimulateOpen] = useState<boolean>(false);

  // TanStack Query Hooks
  const { data: cases = [], isFetching, refetch } = useRecoveryCases();
  const { data: selectedCase = null } = useRecoveryCaseDetail(selectedCaseId);

  const evaluateMutation = useEvaluateMutation();
  const simulateMutation = useSimulateFailureMutation();

  const handleEvaluateCase = async (paymentId: string) => {
    try {
      await evaluateMutation.mutateAsync(paymentId);
    } catch (err) {
      console.error('Error evaluating recovery case:', err);
    }
  };

  const handleSimulate = async (amount: number, failureType: string) => {
    try {
      await simulateMutation.mutateAsync({ amount, failureType });
    } catch (err) {
      console.error('Error running simulation:', err);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Platform Header */}
      <Header
        onOpenSimulate={() => setIsSimulateOpen(true)}
        onRefresh={() => refetch()}
        isLoading={isFetching}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-6 space-y-6">
        {/* Top Financial & Recovery Metrics */}
        <MetricsCards cases={cases} />

        {/* Live Recovery Cases Table */}
        <CasesTable
          cases={cases}
          onSelectCase={(id) => setSelectedCaseId(id)}
          onEvaluateCase={handleEvaluateCase}
          isEvaluating={evaluateMutation.isPending}
        />
      </main>

      {/* Interactive Case Detail & Timeline Modal */}
      <TimelineModal
        recoveryCase={selectedCase}
        onClose={() => setSelectedCaseId(null)}
      />

      {/* Payment Failure Simulation Modal */}
      <SimulateModal
        isOpen={isSimulateOpen}
        onClose={() => setIsSimulateOpen(false)}
        onSimulate={handleSimulate}
        isSimulating={simulateMutation.isPending}
      />
    </div>
  );
}
