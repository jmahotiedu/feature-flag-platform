# SLO Dashboard

Provisioned dashboard panels:
- Request rate (`ff_http_requests_total`)
- p95 latency (`ff_http_request_duration_ms`)
- 5xx error ratio
- publish propagation delay (`ff_publish_propagation_delay_ms`)

## Alert starter thresholds

- Error rate > 2% for 10 minutes
- p95 latency > 120ms for 15 minutes
- Publish propagation delay > 30 seconds for 5 minutes
