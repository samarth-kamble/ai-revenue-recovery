import { RecoveryCase } from '../types';

const PAYMENT_SERVICE_URL = process.env.NEXT_PUBLIC_PAYMENT_SERVICE_URL || 'http://localhost:4001/api/v1';
const RECOVERY_SERVICE_URL = process.env.NEXT_PUBLIC_RECOVERY_SERVICE_URL || 'http://localhost:4002/api/v1';
export const DEFAULT_MERCHANT_ID = 'merch_demo_rzp';

export async function fetchRecoveryCases(merchantId = DEFAULT_MERCHANT_ID): Promise<RecoveryCase[]> {
  try {
    const res = await fetch(`${RECOVERY_SERVICE_URL}/recovery/cases`, {
      headers: { 'x-merchant-id': merchantId },
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
      headers: { 'x-merchant-id': merchantId },
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
      idempotencyKey: `idemp_sim_${payment.id}_${Date.now()}`,
      rawErrorCode: failureType,
      errorClassification: failureType,
      errorMessage: `Simulated payment failure (${failureType})`,
    }),
  });
  if (!attRes.ok) throw new Error('Failed to record attempt');

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
        merchantId: 'merch_demo_rzp',
        customerId: 'cust_demo_456',
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
            paymentId: 'pay_demo_7788',
            attemptNumber: 1,
            gateway: 'RAZORPAY',
            status: 'FAILED',
            idempotencyKey: 'idemp_pay_demo_7788_att_1',
            attemptAt: '2026-08-25T11:24:35.430Z',
            failures: [
              {
                id: 'fail_1',
                paymentAttemptId: 'att_demo_1',
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
          recoveryCaseId: 'c1bb2789-4f5d-44c9-9bcc-daf3a4102491',
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
          recoveryCaseId: 'c1bb2789-4f5d-44c9-9bcc-daf3a4102491',
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
          recoveryCaseId: 'c1bb2789-4f5d-44c9-9bcc-daf3a4102491',
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
          recoveryCaseId: 'c1bb2789-4f5d-44c9-9bcc-daf3a4102491',
          actionType: 'RETRY_PAYMENT',
          status: 'SCHEDULED',
          scheduledAt: '2026-08-25T14:02:59.511Z',
          idempotencyKey: 'act_c1bb2789_step_2_1787665679511',
          createdAt: '2026-08-25T13:47:59.512Z',
        },
      ],
      auditEvents: [
        { id: 'evt_1', merchantId: 'merch_demo_rzp', eventType: 'RISK_DETECTED', actor: 'SYSTEM', details: { amountAtRisk: 4999 }, createdAt: '2026-08-25T11:24:35.439Z' },
        { id: 'evt_2', merchantId: 'merch_demo_rzp', eventType: 'PREDICTION_GENERATED', actor: 'ML_MODEL', details: { recoveryProbability: 0.85 }, createdAt: '2026-08-25T13:47:59.504Z' },
        { id: 'evt_3', merchantId: 'merch_demo_rzp', eventType: 'RECOMMENDATION_CREATED', actor: 'AI_AGENT', details: { recommendedAction: 'RETRY_PAYMENT' }, createdAt: '2026-08-25T13:47:59.508Z' },
        { id: 'evt_4', merchantId: 'merch_demo_rzp', eventType: 'POLICY_EVALUATED', actor: 'POLICY_ENGINE', details: { outcome: 'ALLOW' }, createdAt: '2026-08-25T13:47:59.511Z' },
        { id: 'evt_5', merchantId: 'merch_demo_rzp', eventType: 'ACTION_SCHEDULED', actor: 'WORKFLOW_ENGINE', details: { actionType: 'RETRY_PAYMENT' }, createdAt: '2026-08-25T13:47:59.517Z' },
      ],
    },
  ];
}
