const PAYMENT_SERVICE_URL = process.env.NEXT_PUBLIC_PAYMENT_SERVICE_URL || 'http://localhost:4001/api/v1';
const RECOVERY_SERVICE_URL = process.env.NEXT_PUBLIC_RECOVERY_SERVICE_URL || 'http://localhost:4002/api/v1';
const DEFAULT_MERCHANT_ID = 'merch_demo_rzp';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

export interface PaymentAttempt {
  id: string;
  attemptNumber: number;
  gateway: string;
  status: string;
  idempotencyKey: string;
  attemptAt: string;
  failures?: Array<{
    id: string;
    rawErrorCode: string;
    errorClassification: string;
    errorMessage: string;
    failedAt: string;
  }>;
}

export interface MLPrediction {
  id: string;
  recoveryProbability: number;
  riskTier: string;
  featureSnapshot: Record<string, any>;
  modelVersion: string;
  createdAt: string;
}

export interface AIDecision {
  id: string;
  recommendedAction: string;
  recommendedDelayMinutes: number;
  confidenceScore: number;
  reasonCodes: string[];
  agentVersion: string;
  createdAt: string;
}

export interface PolicyDecision {
  id: string;
  outcome: 'ALLOW' | 'DENY';
  evaluatedRules: string[];
  createdAt: string;
}

export interface RecoveryAction {
  id: string;
  actionType: string;
  status: string;
  scheduledAt: string;
  idempotencyKey: string;
  createdAt: string;
}

export interface AuditEvent {
  id: string;
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

export async function fetchRecoveryCases(merchantId = DEFAULT_MERCHANT_ID): Promise<RecoveryCase[]> {
  try {
    const res = await fetch(`${RECOVERY_SERVICE_URL}/recovery/cases`, {
      headers: {
        'x-merchant-id': merchantId,
      },
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Using fallback data for recovery cases:', err);
    return getFallbackCases();
  }
}

export async function fetchRecoveryCaseById(id: string, merchantId = DEFAULT_MERCHANT_ID): Promise<RecoveryCase> {
  try {
    const res = await fetch(`${RECOVERY_SERVICE_URL}/recovery/cases/${id}`, {
      headers: {
        'x-merchant-id': merchantId,
      },
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`Using fallback data for case ${id}:`, err);
    const fallbackList = getFallbackCases();
    return (fallbackList.find((c) => c.id === id) || fallbackList[0])!;
  }
}

export async function evaluateRecovery(paymentId: string, merchantId = DEFAULT_MERCHANT_ID) {
  const res = await fetch(`${RECOVERY_SERVICE_URL}/recovery/evaluate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-merchant-id': merchantId,
    },
    body: JSON.stringify({ paymentId }),
  });
  if (!res.ok) throw new Error(`Failed to evaluate recovery: HTTP ${res.status}`);
  return await res.json();
}

export async function createSimulatedFailure(merchantId = DEFAULT_MERCHANT_ID, amount = 3499, failureType = 'GATEWAY_TIMEOUT') {
  // 1. Create Payment
  const payRes = await fetch(`${PAYMENT_SERVICE_URL}/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-merchant-id': merchantId,
    },
    body: JSON.stringify({
      merchantId,
      customerId: 'cust_demo_456',
      amount,
      currency: 'INR',
      gateway: 'RAZORPAY',
    }),
  });
  if (!payRes.ok) throw new Error('Failed to create payment');
  const payment = await payRes.json();

  // 2. Record Failure Attempt
  const attRes = await fetch(`${PAYMENT_SERVICE_URL}/payments/attempts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      paymentId: payment.id,
      attemptNumber: 1,
      gateway: 'RAZORPAY',
      status: 'FAILED',
      idempotencyKey: `idemp_sim_${payment.id}_1`,
      rawErrorCode: failureType,
      errorClassification: failureType,
      errorMessage: `Simulated payment failure (${failureType})`,
    }),
  });
  if (!attRes.ok) throw new Error('Failed to record attempt');

  // 3. Evaluate Recovery Case
  return evaluateRecovery(payment.id, merchantId);
}

function getFallbackCases(): RecoveryCase[] {
  return [
    {
      id: 'c1bb2789-4f5d-44c9-9bcc-daf3a4102491',
      paymentId: 'pay_demo_7788',
      merchantId: 'merch_demo_rzp',
      status: 'IN_PROGRESS',
      currentStep: 2,
      totalAttempts: 1,
      totalRecoveredAmount: '0',
      createdAt: '2026-08-25T11:24:35.437Z',
      updatedAt: '2026-08-25T13:47:59.514Z',
      payment: {
        id: 'pay_demo_7788',
        amount: '4999.00',
        currency: 'INR',
        status: 'FAILED',
        gateway: 'RAZORPAY',
        customer: {
          id: 'cust_demo_456',
          name: 'Rohan Sharma',
          email: 'rohan.sharma@example.com',
          phone: '+919876543210',
        },
        attempts: [
          {
            id: 'att_demo_1',
            attemptNumber: 1,
            gateway: 'RAZORPAY',
            status: 'FAILED',
            idempotencyKey: 'idemp_pay_demo_7788_att_1',
            attemptAt: '2026-08-25T11:24:35.430Z',
            failures: [
              {
                id: 'fail_1',
                rawErrorCode: 'GATEWAY_TIMEOUT',
                errorClassification: 'GATEWAY_TIMEOUT',
                errorMessage: 'Payment gateway timed out during processing',
                failedAt: '2026-08-25T11:24:35.433Z',
              },
            ],
          },
        ],
      },
      predictions: [
        {
          id: 'pred_1',
          recoveryProbability: 0.85,
          riskTier: 'LOW',
          featureSnapshot: { amount: 4999, failureClassification: 'GATEWAY_TIMEOUT' },
          modelVersion: 'v1.0.0',
          createdAt: '2026-08-25T13:47:59.500Z',
        },
      ],
      aiDecisions: [
        {
          id: 'ai_1',
          recommendedAction: 'RETRY_PAYMENT',
          recommendedDelayMinutes: 15,
          confidenceScore: 0.9,
          reasonCodes: ['TRANSIENT_FAILURE', 'HIGH_RECOVERY_PROBABILITY'],
          agentVersion: 'v1.0.0',
          createdAt: '2026-08-25T13:47:59.506Z',
        },
      ],
      policyDecisions: [
        {
          id: 'pol_1',
          outcome: 'ALLOW',
          evaluatedRules: [
            'ALLOW: Attempt count (1) < Max Retries (3)',
            'ALLOW: Probability (0.85) >= Min Threshold (0.5)',
            "ALLOW: Action 'RETRY_PAYMENT' is permitted by merchant policy",
          ],
          createdAt: '2026-08-25T13:47:59.510Z',
        },
      ],
      recoveryActions: [
        {
          id: 'act_1',
          actionType: 'RETRY_PAYMENT',
          status: 'SCHEDULED',
          scheduledAt: '2026-08-25T14:02:59.511Z',
          idempotencyKey: 'act_c1bb2789_step_2_1787665679511',
          createdAt: '2026-08-25T13:47:59.512Z',
        },
      ],
      auditEvents: [
        { id: 'evt_1', eventType: 'RISK_DETECTED', actor: 'SYSTEM', details: { amountAtRisk: 4999 }, createdAt: '2026-08-25T11:24:35.439Z' },
        { id: 'evt_2', eventType: 'PREDICTION_GENERATED', actor: 'ML_MODEL', details: { recoveryProbability: 0.85 }, createdAt: '2026-08-25T13:47:59.504Z' },
        { id: 'evt_3', eventType: 'RECOMMENDATION_CREATED', actor: 'AI_AGENT', details: { recommendedAction: 'RETRY_PAYMENT' }, createdAt: '2026-08-25T13:47:59.508Z' },
        { id: 'evt_4', eventType: 'POLICY_EVALUATED', actor: 'POLICY_ENGINE', details: { outcome: 'ALLOW' }, createdAt: '2026-08-25T13:47:59.511Z' },
        { id: 'evt_5', eventType: 'ACTION_SCHEDULED', actor: 'WORKFLOW_ENGINE', details: { actionType: 'RETRY_PAYMENT' }, createdAt: '2026-08-25T13:47:59.517Z' },
      ],
    },
    {
      id: '97f818d1-0bd5-438f-9448-415df283869c',
      paymentId: '7912ba62-35d2-4f13-a018-ff0fe8a69a71',
      merchantId: 'merch_demo_rzp',
      status: 'IN_PROGRESS',
      currentStep: 1,
      totalAttempts: 1,
      totalRecoveredAmount: '0',
      createdAt: '2026-08-25T12:46:16.156Z',
      updatedAt: '2026-08-25T12:46:16.156Z',
      payment: {
        id: '7912ba62-35d2-4f13-a018-ff0fe8a69a71',
        amount: '2999.00',
        currency: 'INR',
        status: 'FAILED',
        gateway: 'RAZORPAY',
        customer: {
          id: 'cust_demo_456',
          name: 'Rohan Sharma',
          email: 'rohan.sharma@example.com',
        },
        attempts: [
          {
            id: '3e2dabb7-aca1-4f3b-8370-ef8566e294cb',
            attemptNumber: 1,
            gateway: 'RAZORPAY',
            status: 'FAILED',
            idempotencyKey: 'idemp_pay_7912ba62_1',
            attemptAt: '2026-08-25T12:46:16.139Z',
            failures: [
              {
                id: 'fail_2',
                rawErrorCode: 'INSUFFICIENT_FUNDS',
                errorClassification: 'INSUFFICIENT_FUNDS',
                errorMessage: 'Insufficient balance in account',
                failedAt: '2026-08-25T12:46:16.147Z',
              },
            ],
          },
        ],
      },
      predictions: [
        {
          id: 'pred_2',
          recoveryProbability: 0.65,
          riskTier: 'MEDIUM',
          featureSnapshot: { amount: 2999, failureClassification: 'INSUFFICIENT_FUNDS' },
          modelVersion: 'v1.0.0',
          createdAt: '2026-08-25T12:46:16.152Z',
        },
      ],
      aiDecisions: [
        {
          id: 'ai_2',
          recommendedAction: 'SEND_SMS_REMINDER',
          recommendedDelayMinutes: 720,
          confidenceScore: 0.82,
          reasonCodes: ['INSUFFICIENT_FUNDS', 'SCHEDULE_REMINDER_AND_RETRY'],
          agentVersion: 'v1.0.0',
          createdAt: '2026-08-25T12:46:16.154Z',
        },
      ],
      policyDecisions: [
        {
          id: 'pol_2',
          outcome: 'ALLOW',
          evaluatedRules: [
            'ALLOW: Attempt count (1) < Max Retries (3)',
            'ALLOW: Probability (0.65) >= Min Threshold (0.5)',
            "ALLOW: Action 'SEND_SMS_REMINDER' is permitted by merchant policy",
          ],
          createdAt: '2026-08-25T12:46:16.155Z',
        },
      ],
      recoveryActions: [
        {
          id: 'act_2',
          actionType: 'SEND_SMS_REMINDER',
          status: 'SCHEDULED',
          scheduledAt: '2026-08-25T20:46:16.156Z',
          idempotencyKey: 'act_97f818d1_step_2',
          createdAt: '2026-08-25T12:46:16.156Z',
        },
      ],
    },
  ];
}
