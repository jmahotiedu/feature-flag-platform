# Live E2E Demo Report

- **Started**: 2026-02-12T03:15:42.896Z
- **Completed**: 2026-02-12T03:15:44.160Z
- **Base URL**: http://127.0.0.1:8080
- **Tenant**: tenant-demo

## Assertions

- Create flag: 201 (expected 201)
- Publish: 201 (expected 201)
- Idempotent replay: 201 + header `Idempotent-Replay=true`
- Evaluate US variant: on
- Evaluate CA variant: off
- Rollout ratio (200 users): 19.50%
- Rollback status: 200
- Rollback audit present: true
- Failed publish detected in metrics within 2 minutes: true (5 ms)

## Timeline

- 2026-02-12T03:15:43.871Z: control-plane healthy\n- 2026-02-12T03:15:43.885Z: created new-homepage flag (status 201)\n- 2026-02-12T03:15:43.890Z: published new-homepage with idempotency replay (status 201)\n- 2026-02-12T03:15:43.895Z: evaluated US and CA users\n- 2026-02-12T03:15:44.149Z: measured rollout percentage (ratio 19.50%)\n- 2026-02-12T03:15:44.156Z: observed failed publish metric (detected in 5 ms)

## Metrics Snapshot (excerpt)

```
# HELP process_cpu_user_seconds_total Total user CPU time spent in seconds.
# TYPE process_cpu_user_seconds_total counter
process_cpu_user_seconds_total 0.125

# HELP process_cpu_system_seconds_total Total system CPU time spent in seconds.
# TYPE process_cpu_system_seconds_total counter
process_cpu_system_seconds_total 0.047

# HELP process_cpu_seconds_total Total user and system CPU time spent in seconds.
# TYPE process_cpu_seconds_total counter
process_cpu_seconds_total 0.172

# HELP process_start_time_seconds Start time of the process since unix epoch in seconds.
# TYPE process_start_time_seconds gauge
process_start_time_seconds 1770866143

# HELP process_resident_memory_bytes Resident memory size in bytes.
# TYPE process_resident_memory_bytes gauge
process_resident_memory_bytes 88563712

# HELP nodejs_eventloop_lag_seconds Lag of event loop in seconds.
# TYPE nodejs_eventloop_lag_seconds gauge
nodejs_eventloop_lag_seconds 0.0027026

# HELP nodejs_eventloop_lag_min_seconds The minimum recorded event loop delay.
# TYPE nodejs_eventloop_lag_min_seconds gauge
nodejs_eventloop_lag_min_seconds 9223372036.854776

# HELP nodejs_eventloop_lag_max_seconds The maximum recorded event loop delay.
# TYPE nodejs_eventloop_lag_max_seconds gauge
nodejs_eventloop_lag_max_seconds 0

# HELP nodejs_eventloop_lag_mean_seconds The mean of the recorded event loop delays.
# TYPE nodejs_eventloop_lag_mean_seconds gauge
nodejs_eventloop_lag_mean_seconds Nan

# HELP nodejs_eventloop_lag_stddev_seconds The standard deviation of the recorded event loop delays.
# TYPE nodejs_eventloop_lag_stddev_seconds gauge
nodejs_eventloop_lag_stddev_seconds Nan

# HELP nodejs_eventloop_lag_p50_seconds The 50th percentile of the recorded event loop delays.
# TYPE nodejs_eventloop_lag_p50_seconds gauge
nodejs_eventloop_lag_p50_seconds 5.11e-7

# HELP nodejs_eventloop_lag_p90_seconds The 90th percentile of the recorded event loop delays.
# TYPE nodejs_eventloop_lag_p90_seconds gauge
nodejs_eventloop_lag_p90_seconds 5.11e-7

# HELP nodejs_eventloop_lag_p99_seconds The 99th percentile of the recorded event loop delays.
# TYPE nodejs_eventloop_lag_p99_seconds gauge
nodejs_eventloop_lag_p99_seconds 5.11e-7

# HELP nodejs_active_resources Number of active resources that are currently keeping the event loop alive, grouped by async resource type.
# TYPE nodejs_active_resources gauge
nodejs_active_resources{type="PipeWrap"} 2
nodejs_active_resources{type="TCPServerWrap"} 1
nodejs_active_resources{type="TCPSocketWrap"} 2
nodejs_active_resources{type="Immediate"} 1

# HELP nodejs_active_resources_total Total number of active resources.
# TYPE nodejs_active_resources_total gauge
nodejs_active_resources_total 6

# HELP nodejs_active_handles Number of active libuv handles grouped by handle type. Every handle type is C++ class name.
# TYPE nodejs_active_handles gauge
nodejs_active_handles{type="Socket"} 4
nodejs_active_handles{type="Server"} 1

# HELP nodejs_active_handles_total Total number of active handles.
# TYPE nodejs_active_handles_total gauge
nodejs_active_handles_total 5

# HELP nodejs_active_requests Number of active libuv requests grouped by request type. Every request type is C++ class name.
# TYPE nodejs_active_requests gauge

# HELP nodejs_active_requests_total Total number of active requests.
# TYPE nodejs_active_requests_total gauge
nodejs_active_requests_total 0

# HELP nodejs_heap_size_total_bytes Process heap size from Node.js in bytes.
# TYPE nodejs_heap_size_total_bytes gauge
nodejs_heap_size_total_bytes 32342016

# HELP nodejs_heap_size_used_bytes Process heap size used from Node.js in bytes.
# TYPE nodejs_heap_size_used_bytes gauge
nodejs_heap_size_used_bytes 20670024

# HELP nodejs_external_memory_bytes Node.js external memory size in bytes.
# TYPE nodejs_external_memory_bytes gauge
nodejs_external_memory_bytes 4213335

# HELP nodejs_heap_space_size_total_bytes Process heap space size total from Node.js in bytes.
# TYPE nodejs_heap_space_size_total_bytes gauge
nodejs_heap_space_size_total_bytes{space="read_only"} 0
nodejs_heap_space_size_total_bytes{space="new"} 16777216
nodejs_heap_space_size_total_bytes{space="old"} 11845632
nodejs_heap_space_size_total_bytes{space="code"} 1310720
nodejs_heap_space_size_total_bytes{space="shared"} 0
nodejs_heap_space_size_total_bytes{space="trusted"} 2138112
nodejs_heap_space_size_total_bytes{space="new_large_object"} 0
nodejs_heap_space_size_total_bytes{space="large_object"} 270336
nodejs_heap_space_size_total_bytes{space="code_large_object"} 0
nodejs_heap_space_size_total_bytes{space="shared_large_object"} 0
nodejs_heap_space_size_total_bytes{space="trusted_large_object"} 0

# HELP nodejs_heap_space_size_used_bytes Process heap space size used from Node.js in bytes.
# TYPE nodejs_heap_space_size_used_bytes gauge
nodejs_heap_space_size_used_bytes{space="read_only"} 0
nodejs_heap_space_size_used_bytes{space="new"} 6782064
nodejs_heap_space_size_used_bytes{space="old"} 10706320
nodejs_heap_space_size_used_bytes{space="code"} 1069952
nodejs_heap_space_size_used_bytes{space="shared"} 0
nodejs_heap_space_size_used_bytes{space="trusted"} 1853392
nodejs_heap_space_size_used_bytes{space="new_large_object"} 0
nodejs_heap_space_size_used_bytes{space="large_object"} 262160
nodejs_heap_space_size_used_bytes{space="code_large_object"} 0
nodejs_heap_space_size_used_bytes{space="shared_large_object"} 0
nodejs_heap_space_size_used_bytes{space="trusted_large_object"} 0

# HELP nodejs_heap_space_size_available_bytes Process heap space size available from Node.js in bytes.
# TYPE nodejs_heap_space_size_available_bytes gauge
nodejs_heap_space_size_available_bytes{space="read_only"} 0
nodejs_heap_space_size_available_bytes{space="new"} 1465232
nodejs_heap_space_size_available_bytes{space="old"} 935096
nodejs_heap_space_size_available_bytes{space="code"} 158688
nodejs_heap_space_size_available_bytes{space="shared"} 0
nodejs_heap_space_size_available_bytes{space="trusted"} 244840
nodejs_heap_space_size_available_bytes{space="new_large_object"} 8388608
nodejs_heap_space_size_available_bytes{space="large_object"} 0
nodejs_heap_space_size_available_bytes{space="code_large_object"} 0
nodejs_heap_space_size_available_bytes{space="shared_large_object"} 0
nodejs_heap_space_size_available_bytes{space="trusted_large_object"} 0

# HELP nodejs_version_info Node.js version info.
# TYPE nodejs_version_info gauge
nodejs_version_info{version="v22.19.0",major="22",minor="19",patch="0"} 1

# HELP nodejs_gc_duration_seconds Garbage collection duration by kind, one of major, minor, incremental or weakcb.
# TYPE nodejs_gc_duration_seconds histogram
nodejs_gc_duration_seconds_bucket{le="0.001",kind="minor"} 2
nodejs_gc_duration_seconds_bucket{le="0.01",kind="minor"} 2
nodejs_gc_duration_seconds_bucket{le="0.1",kind="minor"} 2
nodejs_gc_duration_seconds_bucket{le="1",kind="minor"} 2
nodejs_gc_duration_seconds_bucket{le="2",kind="minor"} 2
nodejs_gc_duration_seconds_bucket{le="5",kind="minor"} 2
nodejs_gc_duration_seconds_bucket{le="+Inf",kind="minor"} 2
nodejs_gc_duration_seconds_sum{kind="minor"} 0.0014843000024557114
nodejs_gc_duration_seconds_count{kind="minor"} 2
nodejs_gc_duration_seconds_bucket{le="0.001",kind="incremental"} 1
nodejs_gc_duration_seconds_bucket{le="0.01",kind="incremental"} 1
nodejs_gc_duration_seconds_bucket{le="0.1",kind="incremental"} 1
nodejs_gc_duration_seconds_bucket{le="1",kind="incremental"} 1
nodejs_gc_duration_seconds_bucket{le="2",kind="incremental"} 1
nodejs_gc_duration_seconds_bucket{le="5",kind="incremental"} 1
nodejs_gc_duration_seconds_bucket{le="+Inf",kind="incremental"} 1
nodejs_gc_duration_seconds_sum{kind="incremental"} 0.0002419000118970871
nodejs_gc_duration_seconds_count{kind="incremental"} 1
nodejs_gc_duration_seconds_bucket{le="0.001",kind="major"} 0
nodejs_gc_duration_seconds_bucket{le="0.01",kind="major"} 1
nodejs_gc_duration_seconds_bucket{le="0.1",kind="major"} 1
nodejs_gc_duration_seconds_bucket{le="1",kind="major"} 1
nodejs_gc_duration_seconds_bucket{le="2",kind="major"} 1
nodejs_gc_duration_seconds_bucket{le="5",kind="major"} 1
nodejs_gc_duration_seconds_bucket{le="+Inf",kind="major"} 1
nodejs_gc_duration_seconds_sum{kind="major"} 0.001675499990582466
nodejs_gc_duration_seconds_count{kind="major"} 1

# HELP ff_http_requests_total Total HTTP requests handled by the control-plane
# TYPE ff_http_requests_total counter
ff_http_requests_total{method="GET",path="/api/health",status="200"} 1
ff_http_requests_total{method="POST",path="/flags",status="201"} 2
ff_http_requests_total{method="POST",path="/flags/:flagKey/publish",status="201"} 2
ff_http_requests_total{method="POST",path="/api/flags/new-homepage/publish",status="201"} 1
ff_http_requests_total{method="POST",path="/evaluate",status="200"} 202
ff_http_requests_total{method="POST",path="/flags/:flagKey/rollback",status="200"} 1
ff_http_requests_total{method="POST",path="/flags/:flagKey/publish",status="404"} 1
ff_http_requests_total{method="GET",path="/api/metrics",status="200"} 1
ff_http_requests_total{method="GET",path="/audit",status="200"} 1

# HELP ff_http_request_duration_ms HTTP request duration in milliseconds
# TYPE ff_http_request_duration_ms histogram
ff_http_request_duration_ms_bucket{le="5",method="GET",path="/api/health",status="200"} 1
ff_http_request_duration_ms_bucket{le="10",method="GET",path="/api/health",status="200"} 1
ff_http_request_duration_ms_bucket{le="25",method="GET",path="/api/health",status="200"} 1
ff_http_request_duration_ms_bucket{le="50",method="GET",path="/api/health",status="200"} 1
ff_http_request_duration_ms_bucket{le="100",method="GET",path="/api/health",status="200"} 1
ff_http_request_duration_ms_bucket{le="250",method="GET",path="/api/health",status="200"} 1
ff_http_request_duration_ms_bucket{le="500",method="GET",path="/api/health",status="200"} 1
ff_http_request_duration_ms_bucket{le="1000",method="GET",path="/api/health",status="200"} 1
ff_http_request_duration_ms_bucket{le="2500",method="GET",path="/api/health",status="200"} 1
ff_http_request_duration_ms_bucket{le="+Inf",method="GET",path="/api/health",status="200"} 1
ff_http_request_duration_ms_sum{method="GET",path="/api/health",status="200"} 3.2076000000000136
ff_http_request_duration_ms_count{method="GET",path="/api/health",status="200"} 1
ff_http_request_duration_ms_bucket{le="5",method="POST",path="/flags",status="201"} 2
ff_http_request_duration_ms_bucket{le="10",method="POST",path="/flags",status="201"} 2
ff_http_request_duration_ms_bucket{le="25",method="POST",path="/flags",status="201"} 2
ff_http_request_duration_ms_bucket{le="50",method="POST",path="/flags",status="201"} 2
ff_http_request_duration_ms_bucket{le="100",method="POST",path="/flags",status="201"} 2
ff_http_request_duration_ms_bucket{le="250",method="POST",path="/flags",status="201"} 2
ff_http_request_duration_ms_bucket{le="500",method="POST",path="/flags",status="201"} 2
ff_http_request_duration_ms_bucket{le="1000",method="POST",path="/flags",status="201"} 2
ff_http_request_duration_ms_bucket{le="2500",method="POST",path="/flags",status="201"} 2
ff_http_request_duration_ms_bucket{le="+Inf",method="POST",path="/flags",status="201"} 2
ff_http_request_duration_ms_sum{method="POST",path="/flags",status="201"} 1.880899999999997
ff_http_request_duration_ms_count{method="POST",path="/flags",status="201"} 2
ff_http_request_duration_ms_bucket{le="5",method="POST",path="/flags/:flagKey/publish",status="201"} 2
ff_http_request_duration_ms_bucket{le="10",method="POST",path="/flags/:flagKey/publish",status="201"} 2
ff_http_request_duration_ms_bucket{le="25",method="POST",path="/flags/:flagKey/publish",status="201"} 2
ff_http_request_duration_ms_bucket{le="50",method="POST",path="/flags/:flagKey/publish",status="201"} 2
ff_http_request_duration_ms_bucket{le="100",method="POST",path="/flags/:flagKey/publish",status="201"} 2
ff_http_request_duration_ms_bucket{le="250",method="POST",path="/flags/:flagKey/publish",status="201"} 2
ff_http_request_duration_ms_bucket{le="500",method="POST",path="/flags/:flagKey/publish",status="201"} 2
ff_http_request_duration_ms_bucket{le="1000",method="POST",path="/flags/:flagKey/publish",status="201"} 2
ff_http_request_duration_ms_bucket{le="2500",method="POST",path="/flags/:flagKey/publish",status="201"} 2
ff_http_request_duration_ms_bucket{le="+Inf",method="POST",path="/flags/:flagKey/publish",status="201"} 2
ff_http_request_duration_ms_sum{method="POST",path="/flags/:flagKey/publish",status="201"} 1.977899999999977
ff_http_request_duration_ms_count{method="POST",path="/flags/:flagKey/publish",status="201"} 2
ff_http_request_duration_ms_bucket{le="5",method="POST",path="/api/flags/new-homepage/publish",status="201"} 1
ff_http_request_duration_ms_bucket{le="10",method="POST",path="/api/flags/new-homepage/publish",status="201"} 1
ff_http_request_duration_ms_bucket{le="25",method="POST",path="/api/flags/new-homepage/publish",status="201"} 1
ff_http_request_duration_ms_bucket{le="50",method="POST",path="/api/flags/new-homepage/publish",status="201"} 1
ff_http_request_duration_ms_bucket{le="100",method="POST",path="/api/flags/new-homepage/publish",status="201"} 1
ff_http_request_duration_ms_bucket{le="250",method="POST",path="/api/flags/new-homepage/publish",status="201"} 1
ff_http_request_duration_ms_bucket{le="500",method="POST",path="/api/flags/new-homepage/publish",status="201"} 1
ff_http_request_duration_ms_bucket{le="1000",method="POST",path="/api/flags/new-homepage/publish",status="201"} 1
ff_http_request_duration_ms_bucket{le="2500",method="POST",path="/api/flags/new-homepage/publish",status="201"} 1
ff_http_request_duration_ms_bucket{le="+Inf",method="POST",path="/api/flags/new-homepage/publish",status="201"} 1
ff_http_request_duration_ms_sum{method="POST",path="/api/flags/new-homepage/publish",status="201"} 0.3713000000000193
ff_http_request_duration_ms_count{method="POST",path="/api/flags/new-homepage/publish",status="201"} 1
ff_http_request_duration_ms_bucket{le="5",method="POST",path="/evaluate",status="200"} 202
ff_http_request_duration_ms_bucket{le="10",method="POST",path="/evaluate",status="200"} 202
ff_http_request_duration_ms_bucket{le="25",method="POST",path="/evaluate",status="200"} 202
ff_http_request_duration_ms_bucket{le="50",method="POST",path="/evaluate",status="200"} 202
ff_http_request_duration_ms_bucket{le="100",method="POST",path="/evaluate",status="200"} 202
ff_http_request_duration_ms_bucket{le="250",method="POST",path="/evaluate",status="200"} 202
ff_http_request_duration_ms_bucket{le="500",method="POST",path="/evaluate",status="200"} 202
ff_http_request_duration_ms_bucket{le="1000",method="POST",path="/evaluate",status="200"} 202
ff_http_request_duration_ms_bucket{le="2500",method="POST",path="/evaluate",status="200"} 202
ff_http_request_duration_ms_bucket{le="+Inf",method="POST",path="/evaluate",status="200"} 202
ff_http_request_duration_ms_sum{method="POST",path="/evaluate",status="200"} 56.54499999999905
ff_http_request_duration_ms_count{method="POST",path="/evaluate",status="200"} 202
ff_http_request_duration_ms_bucket{le="5",method="POST",path="/flags/:flagKey/rollback",status="200"} 1
ff_http_request_duration_ms_bucket{le="10",method="POST",path="/flags/:flagKey/rollback",status="200"} 1
ff_http_request_duration_ms_bucket{le="25",method="POST",path="/flags/:flagKey/rollback",status="200"} 1
ff_http_request_duration_ms_bucket{le="50",method="POST",path="/flags/:flagKey/rollback",status="200"} 1
ff_http_request_duration_ms_bucket{le="100",method="POST",path="/flags/:flagKey/rollback",status="200"} 1
ff_http_request_duration_ms_bucket{le="250",method="POST",path="/flags/:flagKey/rollback",status="200"} 1
ff_http_request_duration_ms_bucket{le="500",method="POST",path="/flags/:flagKey/rollback",status="200"} 1
ff_http_request_duration_ms_bucket{le="1000",method="POST",path="/flags/:flagKey/rollback",status="200"} 1
ff_http_request_duration_ms_bucket{le="2500",method="POST",path="/flags/:flagKey/rollback",status="200"} 1
ff_http_request_duration_ms_bucket{le="+Inf",method="POST",path="/flags/:flagKey/rollback",status="200"} 1
ff_http_request_duration_ms_sum{method="POST",path="/flags/:flagKey/rollback",status="200"} 0.5919999999999845
ff_http_request_duration_ms_count{method="POST",path="/flags/:flagKey/rollback",status="200"} 1
ff_http_request_duration_ms_bucket{le="5",method="POST",path="/flags/:flagKey/publish",status="404"} 1
ff_http_request_duration_ms_bucket{le="10",method="POST",path="/flags/:flagKey/publish",status="404"} 1
ff_http_request_duration_ms_bucket{le="25",method="POST",path="/flags/:flagKey/publish",status="404"} 1
ff_http_request_duration_ms_bucket{le="50",method="POST",path="/flags/:flagKey/publish",status="404"} 1
ff_http_request_duration_ms_bucket{le="100",method="POST",path="/flags/:flagKey/publish",status="404"} 1
ff_http_request_duration_ms_bucket{le="250",method="POST",path="/flags/:flagKey/publish",status="404"} 1
ff_http_request_duration_ms_bucket{le="500",method="POST",path="/flags/:flagKey/publish",status="404"} 1
ff_http_request_duration_ms_bucket{le="1000",method="POST",path="/flags/:flagKey/publish",status="404"} 1
ff_http_request_duration_ms_bucket{le="2500",method="POST",path="/flags/:flagKey/publish",status="404"} 1
ff_http_request_duration_ms_bucket{le="+Inf",method="POST",path="/flags/:flagKey/publish",status="404"} 1
ff_http_request_duration_ms_sum{method="POST",path="/flags/:flagKey/publish",status="404"} 0.2927000000000817
ff_http_request_duration_ms_count{method="POST",path="/flags/:flagKey/publish",status="404"} 1
ff_http_request_duration_ms_bucket{le="5",method="GET",path="/api/metrics",status="200"} 1
ff_http_request_duration_ms_bucket{le="10",method="GET",path="/api/metrics",status="200"} 1
ff_http_request_duration_ms_bucket{le="25",method="GET",path="/api/metrics",status="200"} 1
ff_http_request_duration_ms_bucket{le="50",method="GET",path="/api/metrics",status="200"} 1
ff_http_request_duration_ms_bucket{le="100",method="GET",path="/api/metrics",status="200"} 1
ff_http_request_duration_ms_bucket{le="250",method="GET",path="/api/metrics",status="200"} 1
ff_http_request_duration_ms_bucket{le="500",method="GET",path="/api/metrics",status="200"} 1
ff_http_request_duration_ms_bucket{le="1000",method="GET",path="/api/metrics",status="200"} 1
ff_http_request_duration_ms_bucket{le="2500",method="GET",path="/api/metrics",status="200"} 1
ff_http_request_duration_ms_bucket{le="+Inf",method="GET",path="/api/metrics",status="200"} 1
ff_http_request_duration_ms_sum{method="GET",path="/api/metrics",status="200"} 3.0976000000000568
ff_http_request_duration_ms_count{method="GET",path="/api/metrics",status="200"} 1
ff_http_request_duration_ms_bucket{le="5",method="GET",path="/audit",status="200"} 1
ff_http_request_duration_ms_bucket{le="10",method="GET",path="/audit",status="200"} 1
ff_http_request_duration_ms_bucket{le="25",method="GET",path="/audit",status="200"} 1
ff_http_request_duration_ms_bucket{le="50",method="GET",path="/audit",status="200"} 1
ff_http_request_duration_ms_bucket{le="100",method="GET",path="/audit",status="200"} 1
ff_http_request_duration_ms_bucket{le="250",method="GET",path="/audit",status="200"} 1
ff_http_request_duration_ms_bucket{le="500",method="GET",path="/audit",status="200"} 1
ff_http_request_duration_ms_bucket{le="1000",method="GET",path="/audit",status="200"} 1
ff_http_request_duration_ms_bucket{le="2500",method="GET",path="/audit",status="200"} 1
ff_http_request_duration_ms_bucket{le="+Inf",method="GET",path="/audit",status="200"} 1
ff_http_request_duration_ms_sum{method="GET",path="/audit",status="200"} 0.471300000000042
ff_http_request_duration_ms_count{method="GET",path="/audit",status="200"} 1

# HELP ff_flag_published_total Total published flag versions
# TYPE ff_flag_published_total counter
ff_flag_published_total{tenant_id="tenant-demo",flag_key="new-homepage"} 2
ff_flag_published_total{tenant_id="tenant-demo",flag_key="rollout-sample"} 1

# HELP ff_publish_propagation_delay_ms Simulated publish-to-consume delay in ms
# TYPE ff_publish_propagation_delay_ms gauge
ff_publish_propagation_delay_ms{tenant_id="tenant-demo",flag_key="new-homepage"} 0
ff_publish_propagation_delay_ms{tenant_id="tenant-demo",flag_key="rollout-sample"} 0

# HELP ff_sdk_config_requests_total Total SDK configuration requests
# TYPE ff_sdk_config_requests_total counter

```

## Control Plane Logs (tail)

```
[stdout] 
> @ff/control-plane@0.1.0 start
> tsx src/index.ts\n[stdout] feature-flag control-plane listening on :8080
```
