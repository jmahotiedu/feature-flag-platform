import { evaluateFlag, type EvaluationContext, type FeatureFlag } from "@ff/shared";

export function evaluateForSdk(flag: FeatureFlag, context: EvaluationContext): unknown {
  return evaluateFlag(flag, context).value;
}
