import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { setTimeout as sleep } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");
const baseUrl = "http://127.0.0.1:8080";

function waitForChildExit(child, timeoutMs = 5_000) {
  if (!child || child.exitCode !== null) {
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    let settled = false;
    const finish = (result) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      child.off("close", onClose);
      child.off("exit", onExit);
      resolve(result);
    };

    const onClose = () => finish(true);
    const onExit = () => finish(true);
    const timer = setTimeout(() => finish(false), timeoutMs);

    child.once("close", onClose);
    child.once("exit", onExit);
  });
}

function hasFailedPublishMetric(metricsText) {
  // Depending on express route label resolution, path can be templated or concrete.
  const byTemplate = /ff_http_requests_total\{[^}]*path="\/flags\/:flagKey\/publish"[^}]*status="404"/m;
  const byApiTemplate = /ff_http_requests_total\{[^}]*path="\/api\/flags\/:flagKey\/publish"[^}]*status="404"/m;
  const byConcrete = /ff_http_requests_total\{[^}]*path="\/api\/flags\/[^"]+\/publish"[^}]*status="404"/m;
  return byTemplate.test(metricsText) || byApiTemplate.test(metricsText) || byConcrete.test(metricsText);
}

async function killProcessTree(child) {
  if (!child || child.pid === undefined) {
    return;
  }
  if (process.platform === "win32") {
    await new Promise((resolve) => {
      const killer = spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], {
        stdio: "ignore"
      });
      killer.on("close", () => resolve());
      killer.on("error", () => resolve());
    });
    await waitForChildExit(child);
    return;
  }

  child.kill("SIGTERM");
  const exitedAfterTerm = await waitForChildExit(child);
  if (!exitedAfterTerm && child.exitCode === null) {
    child.kill("SIGKILL");
    await waitForChildExit(child);
  }
}

function runControlPlane() {
  const child =
    process.platform === "win32"
      ? spawn("cmd.exe", ["/d", "/s", "/c", "npm run -w @ff/control-plane start"], {
          cwd: repoRoot,
          env: {
            ...process.env,
            PORT: "8080"
          },
          stdio: ["ignore", "pipe", "pipe"]
        })
      : spawn("npm", ["run", "-w", "@ff/control-plane", "start"], {
          cwd: repoRoot,
          env: {
            ...process.env,
            PORT: "8080"
          },
          stdio: ["ignore", "pipe", "pipe"]
        });

  const logs = [];
  child.stdout.on("data", (chunk) => logs.push(`[stdout] ${chunk.toString().trimEnd()}`));
  child.stderr.on("data", (chunk) => logs.push(`[stderr] ${chunk.toString().trimEnd()}`));

  return { child, logs };
}

async function waitForHealth(timeoutMs = 20_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.ok) {
        return;
      }
    } catch {
      // keep waiting
    }
    await sleep(300);
  }
  throw new Error("control-plane health check timed out");
}

function authHeaders(token, tenantId, extra = {}) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "x-tenant-id": tenantId,
    ...extra
  };
}

async function api(method, endpoint, { token, tenantId, body, headers = {} }) {
  const response = await fetch(`${baseUrl}${endpoint}`, {
    method,
    headers: authHeaders(token, tenantId, headers),
    body: body ? JSON.stringify(body) : undefined
  });

  const text = await response.text();
  let parsed;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = { raw: text };
  }

  return {
    status: response.status,
    headers: Object.fromEntries(response.headers.entries()),
    body: parsed
  };
}

async function runDemo() {
  const tenantId = "tenant-demo";
  const timeline = [];
  const startedAt = new Date().toISOString();

  const runtime = runControlPlane();
  try {
    await waitForHealth();
    timeline.push({ at: new Date().toISOString(), step: "control-plane healthy" });

    const createFlag = await api("POST", "/api/flags", {
      token: "admin-token",
      tenantId,
      body: {
        tenantId,
        key: "new-homepage",
        name: "New Homepage",
        enabled: true,
        variants: { on: true, off: false },
        fallthroughVariant: "off",
        rules: [
          {
            id: "country-us",
            name: "US users",
            conditions: [{ attribute: "country", operator: "eq", value: "US" }],
            variant: "on",
            rolloutPercentage: 100
          }
        ]
      }
    });
    timeline.push({ at: new Date().toISOString(), step: "created new-homepage flag", status: createFlag.status });

    const publishOne = await api("POST", "/api/flags/new-homepage/publish", {
      token: "operator-token",
      tenantId,
      headers: { "Idempotency-Key": "demo-publish-1" },
      body: { tenantId }
    });
    const publishTwo = await api("POST", "/api/flags/new-homepage/publish", {
      token: "operator-token",
      tenantId,
      headers: { "Idempotency-Key": "demo-publish-1" },
      body: { tenantId }
    });
    timeline.push({
      at: new Date().toISOString(),
      step: "published new-homepage with idempotency replay",
      status: publishTwo.status
    });

    const evalUs = await api("POST", "/api/evaluate", {
      token: "viewer-token",
      tenantId,
      body: {
        tenantId,
        flagKey: "new-homepage",
        context: { key: "user-1", attributes: { country: "US" } }
      }
    });

    const evalCa = await api("POST", "/api/evaluate", {
      token: "viewer-token",
      tenantId,
      body: {
        tenantId,
        flagKey: "new-homepage",
        context: { key: "user-2", attributes: { country: "CA" } }
      }
    });
    timeline.push({ at: new Date().toISOString(), step: "evaluated US and CA users" });

    const createRollout = await api("POST", "/api/flags", {
      token: "admin-token",
      tenantId,
      body: {
        tenantId,
        key: "rollout-sample",
        name: "Rollout Sample",
        enabled: true,
        variants: { on: true, off: false },
        fallthroughVariant: "off",
        rules: [
          {
            id: "all-users",
            name: "All users",
            conditions: [],
            variant: "on",
            rolloutPercentage: 20
          }
        ]
      }
    });

    const publishRollout = await api("POST", "/api/flags/rollout-sample/publish", {
      token: "operator-token",
      tenantId,
      body: { tenantId }
    });

    let rolloutOn = 0;
    const rolloutTotal = 200;
    for (let i = 0; i < rolloutTotal; i += 1) {
      const evalRollout = await api("POST", "/api/evaluate", {
        token: "viewer-token",
        tenantId,
        body: {
          tenantId,
          flagKey: "rollout-sample",
          context: { key: `sample-user-${i}`, attributes: {} }
        }
      });
      if (evalRollout.body?.result?.variantKey === "on") {
        rolloutOn += 1;
      }
    }
    const rolloutRatio = rolloutOn / rolloutTotal;
    timeline.push({ at: new Date().toISOString(), step: "measured rollout percentage", ratio: rolloutRatio });

    const rollback = await api("POST", "/api/flags/new-homepage/rollback", {
      token: "operator-token",
      tenantId,
      body: { tenantId, targetVersion: 2 }
    });

    const failedPublishAt = Date.now();
    const failedPublish = await api("POST", "/api/flags/missing-flag/publish", {
      token: "operator-token",
      tenantId,
      body: { tenantId }
    });

    let failureDetectedAt = null;
    for (let i = 0; i < 120; i += 1) {
      const probe = await fetch(`${baseUrl}/api/metrics`);
      const text = await probe.text();
      if (hasFailedPublishMetric(text)) {
        failureDetectedAt = Date.now();
        break;
      }
      await sleep(1_000);
    }
    const detectionMs = failureDetectedAt === null ? null : failureDetectedAt - failedPublishAt;
    timeline.push({
      at: new Date().toISOString(),
      step: "observed failed publish metric",
      durationMs: detectionMs ?? -1
    });

    const audit = await api("GET", "/api/audit", {
      token: "viewer-token",
      tenantId
    });

    const metricsResponse = await fetch(`${baseUrl}/api/metrics`);
    const metricsText = await metricsResponse.text();

    if (createFlag.status !== 201) {
      throw new Error(`create flag failed (${createFlag.status})`);
    }
    if (publishOne.status !== 201 || publishTwo.status !== 201 || publishTwo.headers["idempotent-replay"] !== "true") {
      throw new Error("idempotent publish behavior did not match expected replay semantics");
    }
    if (evalUs.body?.result?.variantKey !== "on" || evalCa.body?.result?.variantKey !== "off") {
      throw new Error("evaluate endpoint did not produce expected variants");
    }
    if (createRollout.status !== 201 || publishRollout.status !== 201) {
      throw new Error("rollout sample setup failed");
    }
    if (rolloutRatio < 0.12 || rolloutRatio > 0.28) {
      throw new Error(`rollout ratio ${rolloutRatio} outside expected 20% tolerance`);
    }
    if (rollback.status !== 200) {
      throw new Error(`rollback failed (${rollback.status})`);
    }
    if (failedPublish.status !== 404) {
      throw new Error(`failed publish probe returned ${failedPublish.status} instead of 404`);
    }
    if (detectionMs === null || detectionMs > 120_000) {
      throw new Error("failed publish metric was not detected within 2 minutes");
    }

    const auditActions = (audit.body?.events ?? []).map((entry) => entry.action);
    if (!auditActions.includes("flag.rolled_back")) {
      throw new Error("audit did not record rollback action");
    }
    if (!metricsText.includes("ff_http_requests_total") || !metricsText.includes("ff_http_request_duration_ms")) {
      throw new Error("metrics endpoint missing expected series");
    }

    const report = `# Live E2E Demo Report\n\n- **Started**: ${startedAt}\n- **Completed**: ${new Date().toISOString()}\n- **Base URL**: ${baseUrl}\n- **Tenant**: ${tenantId}\n\n## Assertions\n\n- Create flag: ${createFlag.status} (expected 201)\n- Publish: ${publishOne.status} (expected 201)\n- Idempotent replay: ${publishTwo.status} + header \`Idempotent-Replay=${publishTwo.headers["idempotent-replay"]}\`\n- Evaluate US variant: ${evalUs.body?.result?.variantKey}\n- Evaluate CA variant: ${evalCa.body?.result?.variantKey}\n- Rollout ratio (${rolloutTotal} users): ${(rolloutRatio * 100).toFixed(2)}%\n- Rollback status: ${rollback.status}\n- Rollback audit present: ${auditActions.includes("flag.rolled_back")}\n- Failed publish detected in metrics within 2 minutes: ${detectionMs !== null && detectionMs <= 120_000} (${detectionMs} ms)\n\n## Timeline\n\n${timeline
      .map(
        (item) =>
          `- ${item.at}: ${item.step}${item.status ? ` (status ${item.status})` : ""}${item.ratio ? ` (ratio ${(item.ratio * 100).toFixed(2)}%)` : ""}${item.durationMs ? ` (detected in ${item.durationMs} ms)` : ""}`
      )
      .join("\\n")}\n\n## Metrics Snapshot (excerpt)\n\n\`\`\`\n${metricsText.split("\\n").slice(0, 40).join("\\n")}\n\`\`\`\n\n## Control Plane Logs (tail)\n\n\`\`\`\n${runtime.logs.slice(-40).join("\\n")}\n\`\`\`\n`;

    await mkdir(path.join(repoRoot, "docs", "demo"), { recursive: true });
    await writeFile(path.join(repoRoot, "docs", "demo", "live-e2e-report.md"), report, "utf8");

    console.log("Live E2E demo completed successfully.");
  } finally {
    await killProcessTree(runtime.child);
    await sleep(500);
  }
}

runDemo().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
