import { existsSync } from "node:fs";
import { resolve } from "node:path";
import dotenv from "dotenv";

export function loadEnvFiles(cwd = process.cwd()) {
  const loaded: string[] = [];
  for (const filename of [".env.local", ".env"]) {
    const path = resolve(cwd, filename);
    if (!existsSync(path)) continue;
    dotenv.config({ path, override: false, quiet: true });
    loaded.push(filename);
  }
  return loaded;
}
