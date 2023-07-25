import { PROJECT_NAME } from "./CONSTANTS";
import { reopenCache, setUseCacheStorage, start } from "./components/index";
import { setLogEnabled } from "./utils/log";

export default async function startHexa(props: {
  log?: boolean;
  useCacheStorage?: boolean;
  resetCache?: boolean;
}) {
  if (props.resetCache) await resetCache();
  if (props.useCacheStorage) setUseCacheStorage(props.useCacheStorage);
  if (props.log) setLogEnabled(true);
  await start();
}

export async function resetCache() {
  await caches.delete(`${PROJECT_NAME}.html`);
  await reopenCache();
}
