export type Role = "admin" | "operator" | "viewer";

export type PredicateOperator =
  | "eq"
  | "neq"
  | "in"
  | "not_in"
  | "contains"
  | "gte"
  | "lte";

export interface RulePredicate {
  attribute: string;
  operator: PredicateOperator;
  value: unknown;
}

export interface TargetRule {
  id: string;
  name: string;
  conditions: RulePredicate[];
  variant: string;
  rolloutPercentage?: number;
}

export interface Segment {
  id: string;
  tenantId: string;
  key: string;
  name: string;
  conditions: RulePredicate[];
  createdAt: string;
  updatedAt: string;
}

export interface Environment {
  id: string;
  tenantId: string;
  key: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeatureFlag {
  tenantId: string;
  key: string;
  name: string;
  description?: string;
  enabled: boolean;
  variants: Record<string, unknown>;
  fallthroughVariant: string;
  rules: TargetRule[];
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface FlagVersionRecord {
  tenantId: string;
  flagKey: string;
  version: number;
  flag: FeatureFlag;
  actor: string;
  createdAt: string;
}

export interface AuditEvent {
  id: string;
  tenantId: string;
  actor: string;
  action: string;
  resourceType: "flag" | "segment" | "environment";
  resourceKey: string;
  diff: Record<string, unknown>;
  createdAt: string;
}

export interface ValidationError {
  path: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface EvaluationContext {
  userId?: string;
  key?: string;
  attributes?: Record<string, unknown>;
}

export interface EvaluationResult {
  flagKey: string;
  variantKey: string;
  value: unknown;
  reason: "rule_match" | "fallthrough";
  matchedRuleId?: string;
}
