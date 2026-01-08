import { evaluateFlag, type FeatureFlag } from "@ff/shared";
import { TtlCache } from "./cache.js";
import type { FeatureFlagClientOptions, SDKConfigSnapshot, VariationOptions } from "./types.js";

const SNAPSHOT_KEY = "sdk-config";

export class FeatureFlagClient {
  private readonly fetchImpl: typeof fetch;
  private readonly cache = new TtlCache<SDKConfigSnapshot>();
  private readonly pollIntervalMs: number;
  private readonly cacheTtlMs: number;
  private readonly fallbackMode: FeatureFlagClientOptions["fallbackMode"];
  private timer: NodeJS.Timeout | null = null;

  constructor(private readonly options: FeatureFlagClientOptions) {
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.pollIntervalMs = options.pollIntervalMs ?? 30_000;
    this.cacheTtlMs = options.cacheTtlMs ?? 60_000;
    this.fallbackMode = options.fallbackMode ?? "use_stale";
  }

  async start(): Promise<void> {
    await this.refresh();
    if (this.pollIntervalMs > 0) {
      this.timer = setInterval(() => {
        this.refresh().catch(() => {
          // Best effort refresh loop; fallback behavior handles failures at read time.
        });
      }, this.pollIntervalMs);
    }
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async refresh(): Promise<SDKConfigSnapshot> {
    const url = new URL("/api/sdk/config", this.options.baseUrl);
    url.searchParams.set("environment", this.options.environment);

    const response = await this.fetchImpl(url, {
      headers: {
        Authorization: `Bearer ${this.options.token}`,
        "x-tenant-id": this.options.tenantId
      }
    });

    if (!response.ok) {
      throw new Error(`SDK refresh failed with status ${response.status}`);
    }

    const snapshot = (await response.json()) as SDKConfigSnapshot;
    this.cache.set(SNAPSHOT_KEY, snapshot, this.cacheTtlMs);
    return snapshot;
  }

  getSnapshot(): SDKConfigSnapshot | null {
    return this.cache.get(SNAPSHOT_KEY) ?? null;
  }

  variation(flagKey: string, options: VariationOptions): unknown {
    const snapshot = this.cache.get(SNAPSHOT_KEY);
    if (!snapshot) {
      return options.defaultValue;
    }

    const flag = this.findFlag(snapshot.flags, flagKey);
    if (!flag) {
      return options.defaultValue;
    }

    try {
      return evaluateFlag(flag, options.context).value;
    } catch {
      if (this.fallbackMode === "serve_default") {
        return options.defaultValue;
      }
      return options.defaultValue;
    }
  }

  invalidateSnapshot(): void {
    this.cache.delete(SNAPSHOT_KEY);
  }

  async variationWithRefresh(flagKey: string, options: VariationOptions): Promise<unknown> {
    const snapshot = this.getSnapshot();
    if (!snapshot) {
      try {
        await this.refresh();
      } catch {
        if (this.fallbackMode === "serve_default") {
          return options.defaultValue;
        }
      }
    }

    return this.variation(flagKey, options);
  }

  private findFlag(flags: FeatureFlag[], key: string): FeatureFlag | undefined {
    return flags.find((flag) => flag.key === key);
  }
}
