import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { setTimeout as sleep } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");
const baseUrl = "http://127.0.0.1:8080";

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: repoRoot,
      stdio: ["ignore", "pipe", "pipe"],
      ...options
    });

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr, code });
        return;
      }
      reject(new Error(`command failed (${command} ${args.join(" ")}): ${stderr || stdout}`));
    });
  });
}

function runCompose(args) {
  if (process.platform === "win32") {
    return runCommand("docker", ["compose", ...args], { cwd: repoRoot });
  }
  return runCommand("docker", ["compose", ...args], { cwd: repoRoot });
}

async function killProcessTree(child) {
  if (!child || child.pid === undefined) {
    return;
  }
  if (process.platform === "win32") {
    await runCommand("taskkill", ["/pid", String(child.pid), "/t", "/f"], {
      stdio: "ignore"
    }).catch(() => {
      // best effort cleanup
    });
    return;
  }
  child.kill("SIGTERM");
}

function startControlPlane() {
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
        return true;
      }
    } catch {
      // keep waiting
    }
    await sleep(300);
  }
  return false;
}

async function api(method, endpoint, { token, tenantId, body }) {
  const response = await fetch(`${baseUrl}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "x-tenant-id": tenantId,
      "Content-Type": "application/json"
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const text = await response.text();
  let payload;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = { raw: text };
  }
  return { status: response.status, body: payload };
}

async function runRedisStaleStateCheck() {
  const tenantId = "tenant-redis";
  const timeline = [];
  const startedAt = new Date().toISOString();
  let controlPlane = null;

  try {
    await runCompose(["up", "-d"]);
    timeline.push({ at: new Date().toISOString(), step: "docker compose stack started" });

    controlPlane = startControlPlane();
    if (!(await waitForHealth())) {
      throw new Error("control-plane did not become healthy");
    }
    timeline.push({ at: new Date().toISOString(), step: "control-plane healthy" });

    await api("POST", "/api/flags", {
      token: "admin-token",
      tenantId,
      body: {
        tenantId,
        key: "redis-stale",
        name: "Redis stale-state check",
        enabled: true,
        variants: { on: true, off: false },
        fallthroughVariant: "off",
        rules: [
          {
            id: "all-users-off",
            name: "All users off",
            conditions: [],
            variant: "off",
            rolloutPercentage: 100
          }
        ]
      }
    });

    await api("POST", "/api/flags/redis-stale/publish", {
      token: "operator-token",
      tenantId,
      body: { tenantId }
    });

    const preOutage = await api("POST", "/api/evaluate", {
      token: "viewer-token",
      tenantId,
      body: {
        tenantId,
        flagKey: "redis-stale",
        context: { key: "user-a", attributes: {} }
      }
    });

    await runCompose(["stop", "redis"]);
    timeline.push({ at: new Date().toISOString(), step: "redis stopped" });

    await api("PUT", "/api/flags/redis-stale", {
      token: "admin-token",
      tenantId,
      body: {
        tenantId,
        key: "redis-stale",
        name: "Redis stale-state check",
        enabled: true,
        variants: { on: true, off: false },
        fallthroughVariant: "off",
        rules: [
          {
            id: "all-users-on",
            name: "All users on",
            conditions: [],
            variant: "on",
            rolloutPercentage: 100
          }
        ]
      }
    });

    await api("POST", "/api/flags/redis-stale/publish", {
      token: "operator-token",
      tenantId,
      body: { tenantId }
    });
    timeline.push({ at: new Date().toISOString(), step: "published update while redis was down" });

    await runCompose(["start", "redis"]);
    timeline.push({ at: new Date().toISOString(), step: "redis restarted" });

    await sleep(1_000);

    const postRecovery = await api("POST", "/api/evaluate", {
      token: "viewer-token",
      tenantId,
      body: {
        tenantId,
        flagKey: "redis-stale",
        context: { key: "user-a", attributes: {} }
      }
    });

    if (preOutage.body?.result?.variantKey !== "off") {
      throw new Error(`unexpected pre-outage variant: ${preOutage.body?.result?.variantKey}`);
    }
    if (postRecovery.body?.result?.variantKey !== "on") {
      throw new Error(`stale variant after redis recovery: ${postRecovery.body?.result?.variantKey}`);
    }

    const report = `# Redis Outage Stale-State Check\n\n- **Started**: ${startedAt}\n- **Completed**: ${new Date().toISOString()}\n\n## Assertions\n\n- Pre-outage variant: ${preOutage.body?.result?.variantKey}\n- Post-recovery variant: ${postRecovery.body?.result?.variantKey}\n- Result: no prolonged stale flag state observed after Redis outage/restart\n\n## Timeline\n\n${timeline.map((item) => `- ${item.at}: ${item.step}`).join("\\n")}\n`;

    await mkdir(path.join(repoRoot, "docs", "postmortems"), { recursive: true });
    await writeFile(
      path.join(repoRoot, "docs", "postmortems", "2026-02-12-redis-outage-stale-state-check.md"),
      report,
      "utf8"
    );

    console.log("Redis stale-state check completed.");
  } finally {
    if (controlPlane) {
      await killProcessTree(controlPlane.child);
      await sleep(500);
    }
    await runCompose(["down", "-v"]).catch(() => {
      // best effort cleanup
    });
  }
}

runRedisStaleStateCheck().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
