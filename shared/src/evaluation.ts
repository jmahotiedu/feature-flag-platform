import type {
  EvaluationContext,
  EvaluationResult,
  FeatureFlag,
  RulePredicate,
  TargetRule
} from "./types.js";

function fnv1a32(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export function stableBucket(seed: string): number {
  return fnv1a32(seed) % 10_000;
}

function asArray(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }
  return [];
}

function predicateMatches(predicate: RulePredicate, attributes: Record<string, unknown>): boolean {
  const actual = attributes[predicate.attribute];
  const expected = predicate.value;

  switch (predicate.operator) {
    case "eq":
      return actual === expected;
    case "neq":
      return actual !== expected;
    case "in":
      return asArray(expected).includes(actual);
    case "not_in":
      return !asArray(expected).includes(actual);
    case "contains": {
      if (typeof actual === "string" && typeof expected === "string") {
        return actual.includes(expected);
      }
      if (Array.isArray(actual)) {
        return actual.includes(expected);
      }
      return false;
    }
    case "gte":
      return Number(actual) >= Number(expected);
    case "lte":
      return Number(actual) <= Number(expected);
    default:
      return false;
  }
}

function ruleMatches(rule: TargetRule, attributes: Record<string, unknown>): boolean {
  return rule.conditions.every((condition) => predicateMatches(condition, attributes));
}

function rolloutAllows(flagKey: string, rule: TargetRule, identity: string): boolean {
  if (typeof rule.rolloutPercentage !== "number") {
    return true;
  }
  const bucket = stableBucket(`${flagKey}:${rule.id}:${identity}`);
  const threshold = Math.floor(rule.rolloutPercentage * 100);
  return bucket < threshold;
}

export function evaluateFlag(flag: FeatureFlag, context: EvaluationContext): EvaluationResult {
  const identity = context.key ?? context.userId ?? "anonymous";
  const attributes: Record<string, unknown> = {
    ...(context.attributes ?? {}),
    userId: context.userId,
    key: context.key
  };

  if (!flag.enabled) {
    return {
      flagKey: flag.key,
      variantKey: flag.fallthroughVariant,
      value: flag.variants[flag.fallthroughVariant],
      reason: "fallthrough"
    };
  }

  for (const rule of flag.rules) {
    if (!ruleMatches(rule, attributes)) {
      continue;
    }
    if (!rolloutAllows(flag.key, rule, identity)) {
      continue;
    }
    return {
      flagKey: flag.key,
      variantKey: rule.variant,
      value: flag.variants[rule.variant],
      reason: "rule_match",
      matchedRuleId: rule.id
    };
  }

  return {
    flagKey: flag.key,
    variantKey: flag.fallthroughVariant,
    value: flag.variants[flag.fallthroughVariant],
    reason: "fallthrough"
  };
}
