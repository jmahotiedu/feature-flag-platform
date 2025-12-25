import { randomUUID } from "node:crypto";
import type {
  AuditEvent,
  Environment,
  FeatureFlag,
  FlagVersionRecord,
  Segment
} from "@ff/shared";
import type { FeatureFlagStore } from "./types.js";

function nowIso(): string {
  return new Date().toISOString();
}

function keyFor(tenantId: string, key: string): string {
  return `${tenantId}:${key}`;
}

export class InMemoryFeatureFlagStore implements FeatureFlagStore {
  private readonly environments = new Map<string, Environment>();
  private readonly segments = new Map<string, Segment>();
  private readonly flags = new Map<string, FeatureFlag>();
  private readonly flagHistory = new Map<string, FlagVersionRecord[]>();
  private readonly auditEvents: AuditEvent[] = [];

  createEnvironment(input: Omit<Environment, "id" | "createdAt" | "updatedAt">): Environment {
    const id = randomUUID();
    const now = nowIso();
    const environment: Environment = {
      ...input,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.environments.set(keyFor(input.tenantId, input.key), environment);
    return environment;
  }

  listEnvironments(tenantId: string): Environment[] {
    return [...this.environments.values()].filter((item) => item.tenantId === tenantId);
  }

  createSegment(input: Omit<Segment, "id" | "createdAt" | "updatedAt">): Segment {
    const id = randomUUID();
    const now = nowIso();
    const segment: Segment = {
      ...input,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.segments.set(keyFor(input.tenantId, input.key), segment);
    return segment;
  }

  listSegments(tenantId: string): Segment[] {
    return [...this.segments.values()].filter((item) => item.tenantId === tenantId);
  }

  createFlag(input: Omit<FeatureFlag, "version" | "createdAt" | "updatedAt">): FeatureFlag {
    const compositeKey = keyFor(input.tenantId, input.key);
    if (this.flags.has(compositeKey)) {
      throw new Error("flag already exists");
    }
    const now = nowIso();
    const flag: FeatureFlag = {
      ...input,
      version: 1,
      createdAt: now,
      updatedAt: now
    };
    this.flags.set(compositeKey, flag);
    return flag;
  }

  updateFlag(
    tenantId: string,
    key: string,
    input: Omit<FeatureFlag, "version" | "createdAt" | "updatedAt"> & { version?: number }
  ): FeatureFlag | null {
    const compositeKey = keyFor(tenantId, key);
    const existing = this.flags.get(compositeKey);
    if (!existing) {
      return null;
    }
    const updated: FeatureFlag = {
      ...input,
      version: input.version ?? existing.version,
      createdAt: existing.createdAt,
      updatedAt: nowIso()
    };
    this.flags.set(compositeKey, updated);
    return updated;
  }

  getFlag(tenantId: string, key: string): FeatureFlag | null {
    return this.flags.get(keyFor(tenantId, key)) ?? null;
  }

  listFlags(tenantId: string): FeatureFlag[] {
    return [...this.flags.values()].filter((item) => item.tenantId === tenantId);
  }

  publishFlag(tenantId: string, key: string, actor: string): FlagVersionRecord | null {
    const compositeKey = keyFor(tenantId, key);
    const existing = this.flags.get(compositeKey);
    if (!existing) {
      return null;
    }
    const nextVersion = existing.version + 1;
    const publishedFlag: FeatureFlag = {
      ...existing,
      version: nextVersion,
      updatedAt: nowIso()
    };
    this.flags.set(compositeKey, publishedFlag);

    const versionRecord: FlagVersionRecord = {
      tenantId,
      flagKey: key,
      version: nextVersion,
      actor,
      flag: publishedFlag,
      createdAt: nowIso()
    };
    const history = this.flagHistory.get(compositeKey) ?? [];
    history.push(versionRecord);
    this.flagHistory.set(compositeKey, history);
    return versionRecord;
  }

  rollbackFlagToVersion(
    tenantId: string,
    key: string,
    targetVersion: number,
    actor: string
  ): FlagVersionRecord | null {
    const compositeKey = keyFor(tenantId, key);
    const existing = this.flags.get(compositeKey);
    const history = this.flagHistory.get(compositeKey) ?? [];
    if (!existing || history.length === 0) {
      return null;
    }

    const target = history.find((entry) => entry.version === targetVersion);
    if (!target) {
      return null;
    }

    const nextVersion = existing.version + 1;
    const rolledBackFlag: FeatureFlag = {
      ...target.flag,
      version: nextVersion,
      createdAt: existing.createdAt,
      updatedAt: nowIso()
    };
    this.flags.set(compositeKey, rolledBackFlag);

    const rollbackRecord: FlagVersionRecord = {
      tenantId,
      flagKey: key,
      version: nextVersion,
      actor,
      flag: rolledBackFlag,
      createdAt: nowIso()
    };
    history.push(rollbackRecord);
    this.flagHistory.set(compositeKey, history);
    return rollbackRecord;
  }

  listFlagHistory(tenantId: string, key: string): FlagVersionRecord[] {
    return [...(this.flagHistory.get(keyFor(tenantId, key)) ?? [])];
  }

  appendAudit(event: Omit<AuditEvent, "id" | "createdAt">): AuditEvent {
    const entry: AuditEvent = {
      ...event,
      id: randomUUID(),
      createdAt: nowIso()
    };
    this.auditEvents.push(entry);
    return entry;
  }

  listAudit(tenantId: string): AuditEvent[] {
    return this.auditEvents.filter((event) => event.tenantId === tenantId);
  }
}
