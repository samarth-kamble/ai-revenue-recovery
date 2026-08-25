import { prisma } from '../src/client';

async function main() {
  console.log('🌱 Seeding demo database...');

  // 1. Seed Demo Merchant
  const merchant = await prisma.merchant.upsert({
    where: { email: 'merchant@example.com' },
    update: {},
    create: {
      id: 'merch_demo_rzp',
      name: 'Acme Razorpay Merchant',
      email: 'merchant@example.com',
      apiKey: 'rzp_test_key_9988776655',
    },
  });
  console.log(`✅ Merchant created: ${merchant.name} (${merchant.id})`);

  // 2. Seed Default Merchant Policy
  const policy = await prisma.policy.upsert({
    where: { id: 'pol_demo_default' },
    update: {},
    create: {
      id: 'pol_demo_default',
      merchantId: merchant.id,
      maxRetries: 3,
      minRecoveryProbability: 0.5,
      allowedActions: ['RETRY_PAYMENT', 'SEND_SMS_REMINDER', 'SEND_EMAIL_LINK'],
      quietHoursEnabled: true,
      quietHoursStart: '22:00',
      quietHoursEnd: '07:00',
    },
  });
  console.log(`✅ Policy configured for merchant: Max retries ${policy.maxRetries}`);

  // 3. Seed Demo Customer
  const customer = await prisma.customer.upsert({
    where: { id: 'cust_demo_456' },
    update: {},
    create: {
      id: 'cust_demo_456',
      merchantId: merchant.id,
      name: 'Rohan Sharma',
      email: 'rohan.sharma@example.com',
      phone: '+919876543210',
    },
  });
  console.log(`✅ Customer created: ${customer.name}`);

  // 4. Seed Demo Payment with Failure
  const payment = await prisma.payment.upsert({
    where: { id: 'pay_demo_7788' },
    update: {
      merchantId: merchant.id,
      customerId: customer.id,
      amount: 4999.0,
      currency: 'INR',
      status: 'FAILED',
      gateway: 'RAZORPAY',
    },
    create: {
      id: 'pay_demo_7788',
      merchantId: merchant.id,
      customerId: customer.id,
      amount: 4999.0,
      currency: 'INR',
      status: 'FAILED',
      gateway: 'RAZORPAY',
    },
  });

  const attempt = await prisma.paymentAttempt.upsert({
    where: { idempotencyKey: `idemp_${payment.id}_att_1` },
    update: {
      paymentId: payment.id,
      attemptNumber: 1,
      gateway: 'RAZORPAY',
      status: 'FAILED',
    },
    create: {
      id: 'att_demo_1',
      paymentId: payment.id,
      attemptNumber: 1,
      gateway: 'RAZORPAY',
      status: 'FAILED',
      idempotencyKey: `idemp_${payment.id}_att_1`,
    },
  });

  const existingFailure = await prisma.paymentFailure.findFirst({
    where: { paymentAttemptId: attempt.id },
  });
  if (!existingFailure) {
    await prisma.paymentFailure.create({
      data: {
        paymentAttemptId: attempt.id,
        rawErrorCode: 'GATEWAY_TIMEOUT',
        errorClassification: 'GATEWAY_TIMEOUT',
        errorMessage: 'Payment gateway timed out during processing',
      },
    });
  }

  // 5. Seed Revenue Risk & Recovery Case
  const risk = await prisma.revenueRisk.upsert({
    where: { paymentId: payment.id },
    update: {
      merchantId: merchant.id,
      amountAtRisk: 4999.0,
      currency: 'INR',
      riskScore: 0.84,
      status: 'ACTIVE_RECOVERY',
    },
    create: {
      paymentId: payment.id,
      merchantId: merchant.id,
      amountAtRisk: 4999.0,
      currency: 'INR',
      riskScore: 0.84,
      status: 'ACTIVE_RECOVERY',
    },
  });

  const recoveryCase = await prisma.recoveryCase.upsert({
    where: { paymentId: payment.id },
    update: {
      merchantId: merchant.id,
      status: 'IN_PROGRESS',
      currentStep: 1,
      totalAttempts: 1,
    },
    create: {
      paymentId: payment.id,
      merchantId: merchant.id,
      status: 'IN_PROGRESS',
      currentStep: 1,
      totalAttempts: 1,
    },
  });

  const existingAuditEvent = await prisma.auditEvent.findFirst({
    where: { recoveryCaseId: recoveryCase.id, eventType: 'RISK_DETECTED' },
  });
  if (!existingAuditEvent) {
    await prisma.auditEvent.create({
      data: {
        merchantId: merchant.id,
        recoveryCaseId: recoveryCase.id,
        eventType: 'RISK_DETECTED',
        actor: 'SYSTEM',
        details: {
          amountAtRisk: 4999.0,
          riskId: risk.id,
          reason: 'Payment failed due to GATEWAY_TIMEOUT',
        },
      },
    });
  }

  console.log(`✅ Seeded sample failed payment (${payment.id}) and active RecoveryCase (${recoveryCase.id})`);
  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
