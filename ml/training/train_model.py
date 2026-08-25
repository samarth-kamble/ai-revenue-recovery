#!/usr/bin/env python3
"""
AI Revenue Recovery Platform - Python ML Model Trainer
Trains a Random Forest Classifier on data/synthetic/dataset.csv using scikit-learn & pandas
"""

import json
import os
import sys

def train():
    try:
        import pandas as pd
        import numpy as np
        from sklearn.ensemble import RandomForestClassifier
        from sklearn.model_selection import train_test_split
        from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
        import joblib
    except ImportError as e:
        print(f"Import Error: {e}. Ensure dependencies are installed in .venv.")
        sys.exit(1)

    print("======================================================")
    print("🤖 PYTHON ML MODEL TRAINER (CSV + Scikit-Learn)")
    print("======================================================")

    csv_path = os.path.join(os.path.dirname(__file__), '../../data/synthetic/dataset.csv')
    if not os.path.exists(csv_path):
        print(f"Error: Dataset CSV not found at {csv_path}.")
        sys.exit(1)

    df = pd.read_csv(csv_path)
    print(f"Loaded {len(df)} samples from dataset.csv.")

    # Feature Engineering
    failure_dummies = pd.get_dummies(df['failure_classification'], prefix='fail')
    X = pd.concat([failure_dummies, df[['amount', 'previous_attempts_count']]], axis=1)
    y = df['is_actually_recoverable'].astype(int)

    # Train / Test split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # Train Random Forest Classifier
    clf = RandomForestClassifier(n_estimators=100, max_depth=6, random_state=42)
    clf.fit(X_train, y_train)

    y_pred = clf.predict(X_test)

    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, zero_division=0)
    rec = recall_score(y_test, y_pred, zero_division=0)
    f1 = f1_score(y_test, y_pred, zero_division=0)

    print(f"🎯 Model Performance Metrics:")
    print(f"   - Accuracy:  {acc * 100:.2f}%")
    print(f"   - Precision: {prec * 100:.2f}%")
    print(f"   - Recall:    {rec * 100:.2f}%")
    print(f"   - F1 Score:  {f1 * 100:.2f}%")

    # Save Model Artifacts
    models_dir = os.path.join(os.path.dirname(__file__), '../models')
    os.makedirs(models_dir, exist_ok=True)

    model_path = os.path.join(models_dir, 'recovery_rf_model.joblib')
    joblib.dump(clf, model_path)

    # Save feature names list
    feature_path = os.path.join(models_dir, 'feature_names.json')
    with open(feature_path, 'w') as f:
        json.dump(list(X.columns), f)

    print(f"\n📁 Saved Joblib Model: {model_path}")
    print(f"📁 Saved Feature Names: {feature_path}")
    print("======================================================\n")

if __name__ == "__main__":
    train()
