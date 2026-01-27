import { mkdir, writeFile } from "node:fs/promises";
import { percentile } from "./percentile.js";

interface Sample {
  durationMs: number;
  ok: boolean;
  error?: string;
}

async function run(): Promise<void> {
  const baseUrl = process.env.LOADTEST_BASE_URL ?? "http://localhost:8080";
  const requests = Number(process.env.LOADTEST_REQUESTS ?? 100);
  const concurrency = Number(process.env.LOADTEST_CONCURRENCY ?? 10);

  const samples: Sample[] = [];
  const headers = {
    Authorization: `Bearer ${process.env.LOADTEST_TOKEN ?? "viewer-token"}`,
    "x-tenant-id": process.env.LOADTEST_TENANT ?? "tenant-a"
  };

  let cursor = 0;
  async function worker(): Promise<void> {
    while (cursor < requests) {
      const current = cursor;
      cursor += 1;
      const start = performance.now();
      try {
        const response = await fetch(`${baseUrl}/api/flags?cursor=${current}`, { headers });
        const durationMs = performance.now() - start;
        samples.push({ durationMs, ok: response.ok });
        await response.arrayBuffer();
      } catch (error) {
        samples.push({
          durationMs: performance.now() - start,
          ok: false,
          error: error instanceof Error ? error.message : "unknown fetch error"
        });
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));

  const durations = samples.map((sample) => sample.durationMs);
  const okCount = samples.filter((sample) => sample.ok).length;
  const report = {
    requests,
    concurrency,
    successRate: samples.length === 0 ? 0 : okCount / samples.length,
    errorCount: samples.length - okCount,
    p50Ms: percentile(durations, 50),
    p95Ms: percentile(durations, 95),
    p99Ms: percentile(durations, 99),
    timestamp: new Date().toISOString()
  };

  const targetDir = new URL("../../docs/benchmarks/", import.meta.url);
  await mkdir(targetDir, { recursive: true });
  await writeFile(new URL("control-plane-load-report.json", targetDir), JSON.stringify(report, null, 2));

  // eslint-disable-next-line no-console
  console.log(JSON.stringify(report, null, 2));
}

void run();
