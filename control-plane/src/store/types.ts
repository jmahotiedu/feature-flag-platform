import type {
  AuditEvent,
  Environment,
  FeatureFlag,
  FlagVersionRecord,
  Segment
} from "@ff/shared";

export interface FeatureFlagStore {
  createEnvironment(input: Omit<Environment, "id" | "createdAt" | "updatedAt">): Environment;
  listEnvironments(tenantId: string): Environment[];
  createSegment(input: Omit<Segment, "id" | "createdAt" | "updatedAt">): Segment;
  listSegments(tenantId: string): Segment[];

  createFlag(input: Omit<FeatureFlag, "version" | "createdAt" | "updatedAt">): FeatureFlag;
  updateFlag(
    tenantId: string,
    key: string,
    input: Omit<FeatureFlag, "version" | "createdAt" | "updatedAt"> & { version?: number }
  ): FeatureFlag | null;
  getFlag(tenantId: string, key: string): FeatureFlag | null;
  listFlags(tenantId: string): FeatureFlag[];

  publishFlag(tenantId: string, key: string, actor: string): FlagVersionRecord | null;
  rollbackFlagToVersion(
    tenantId: string,
    key: string,
    targetVersion: number,
    actor: string
  ): FlagVersionRecord | null;
  listFlagHistory(tenantId: string, key: string): FlagVersionRecord[];

  appendAudit(event: Omit<AuditEvent, "id" | "createdAt">): AuditEvent;
  listAudit(tenantId: string): AuditEvent[];
}
