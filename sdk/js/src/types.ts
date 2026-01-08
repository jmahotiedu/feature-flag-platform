import type { EvaluationContext, FeatureFlag } from "@ff/shared";

export type FallbackMode = "use_stale" | "serve_default";

export interface SDKConfigSnapshot {
  tenantId: string;
  environment: string;
  generatedAt: string;
  flags: FeatureFlag[];
}

export interface FeatureFlagClientOptions {
  baseUrl: string;
  token: string;
  tenantId: string;
  environment: string;
  pollIntervalMs?: number;
  cacheTtlMs?: number;
  fallbackMode?: FallbackMode;
  fetchImpl?: typeof fetch;
}

export interface VariationOptions {
  context: EvaluationContext;
  defaultValue: unknown;
}
