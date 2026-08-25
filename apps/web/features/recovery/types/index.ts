export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

export interface PaymentFailure {
  id: string;
  paymentAttemptId: string;
  rawErrorCode: string;
  errorClassification: string;
  errorMessage: string;
  failedAt: string;
}

export interface PaymentAttempt {
  id: string;
  paymentId: string;
  attemptNumber: number;
  gateway: string;
  gatewayTransactionId?: string;
  status: string;
  idempotencyKey: string;
  attemptAt: string;
  failures?: PaymentFailure[];
}

export interface MLPrediction {
  id: string;
  recoveryCaseId: string;
  recoveryProbability: number;
  riskTier: string;
  featureSnapshot: Record<string, any>;
  modelVersion: string;
  createdAt: string;
}

export interface AIDecision {
  id: string;
  recoveryCaseId: string;
  recommendedAction: string;
  recommendedDelayMinutes: number;
  confidenceScore: number;
  reasonCodes: string[];
  agentVersion: string;
  createdAt: string;
}

export interface PolicyDecision {
  id: string;
  recoveryCaseId: string;
  aiDecisionId?: string;
  outcome: 'ALLOW' | 'DENY';
  evaluatedRules: string[];
  createdAt: string;
}

export interface RecoveryAction {
  id: string;
  recoveryCaseId: string;
  actionType: string;
  status: string;
  scheduledAt: string;
  executedAt?: string;
  idempotencyKey: string;
  createdAt: string;
}

export interface AuditEvent {
  id: string;
  merchantId: string;
  recoveryCaseId?: string;
  eventType: string;
  actor: string;
  details: Record<string, any>;
  createdAt: string;
}

export interface RecoveryCase {
  id: string;
  paymentId: string;
  merchantId: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RECOVERED' | 'FAILED_TERMINAL' | 'STOPPED' | 'ESCALATED';
  currentStep: number;
  totalAttempts: number;
  totalRecoveredAmount: string;
  stoppedReason?: string;
  createdAt: string;
  updatedAt: string;
  payment?: {
    id: string;
    merchantId: string;
    customerId: string;
    amount: string;
    currency: string;
    status: string;
    gateway: string;
    customer?: Customer;
    attempts?: PaymentAttempt[];
  };
  predictions?: MLPrediction[];
  aiDecisions?: AIDecision[];
  policyDecisions?: PolicyDecision[];
  recoveryActions?: RecoveryAction[];
  auditEvents?: AuditEvent[];
}
