import { createServer } from "node:http";
import { createApp } from "./app.js";
import { loadConfig } from "./config.js";
import { InMemoryFeatureFlagStore } from "./store/memoryStore.js";

const config = loadConfig();
const store = new InMemoryFeatureFlagStore();
const app = createApp({ config, store });

const server = createServer(app);
server.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`feature-flag control-plane listening on :${config.port}`);
});
