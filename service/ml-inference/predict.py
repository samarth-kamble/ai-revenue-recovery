#!/usr/bin/env python3
"""
AI Revenue Recovery Platform - Python ML Inference Predictor
Scores payment failure payloads using trained scikit-learn Random Forest model
"""

import json
import os
import sys

def predict(payload):
    model_path = os.path.join(os.path.dirname(__file__), '../../ml/models/recovery_rf_model.joblib')
    feature_path = os.path.join(os.path.dirname(__file__), '../../ml/models/feature_names.json')

    failure_class = payload.get('errorClassification', payload.get('failureClassification', 'OTHER')).upper()
    amount = float(payload.get('amount', 1000))
    attempts = int(payload.get('previousAttemptsCount', payload.get('attemptsCount', 1)))

    probability = 0.50

    if os.path.exists(model_path) and os.path.exists(feature_path):
        try:
            import joblib
            import pandas as pd
            
            clf = joblib.load(model_path)
            with open(feature_path, 'r') as f:
                feature_names = json.load(f)

            # Build feature row matching trained model features
            row = {}
            for col in feature_names:
                if col.startswith('fail_'):
                    expected_fail = col.replace('fail_', '')
                    row[col] = 1.0 if failure_class == expected_fail else 0.0
                elif col == 'amount':
                    row[col] = amount
                elif col == 'previous_attempts_count':
                    row[col] = float(attempts)
                else:
                    row[col] = 0.0

            df_input = pd.DataFrame([row])
            probs = clf.predict_proba(df_input)
            probability = round(float(probs[0][1]), 4)
        except Exception as e:
            print(f"Fallback to heuristic scoring: {e}")

    # Fallback heuristics if joblib loading encounters discrepancy
    if probability == 0.50:
        prob_map = {
            "TRANSIENT_NETWORK": 0.92,
            "GATEWAY_TIMEOUT": 0.85,
            "BANK_DOWNTIME": 0.88,
            "CARD_EXPIRED": 0.75,
            "INSUFFICIENT_FUNDS": 0.65,
            "INVALID_ACCOUNT": 0.05,
        }
        probability = prob_map.get(failure_class, 0.50)
        if attempts > 1:
            probability = max(0.05, probability - (attempts - 1) * 0.20)

    risk_tier = "LOW" if probability >= 0.75 else "MEDIUM" if probability >= 0.40 else "HIGH"

    return {
        "paymentId": payload.get("paymentId", "pay_test_1"),
        "merchantId": payload.get("merchantId", "merch_demo_rzp"),
        "recoveryProbability": probability,
        "riskTier": risk_tier,
        "failureClassification": failure_class,
        "featureBreakdown": {
            "amount": amount,
            "currency": payload.get("currency", "INR"),
            "failureClassification": failure_class,
            "previousAttemptsCount": attempts,
        },
        "modelVersion": "v1.0.0",
    }

if __name__ == "__main__":
    sample = {
        "paymentId": "pay_test_999",
        "amount": 4999,
        "errorClassification": "GATEWAY_TIMEOUT",
        "attemptsCount": 1
    }
    if len(sys.argv) > 1:
        try:
            sample = json.loads(sys.argv[1])
        except Exception:
            pass

    res = predict(sample)
    print(json.dumps(res, indent=2))
