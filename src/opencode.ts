import { readFileSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";
import { confirm, isCancel, cancel, log, spinner } from "@clack/prompts";

const __dirname = dirname(fileURLToPath(import.meta.url));

function handleCancel(value: unknown) {
  if (isCancel(value)) {
    cancel("Setup cancelled.");
    process.exit(0);
  }
}

export async function setupOpenCode(location: "global" | "local") {
  log.info("OpenCode Setup");

  const templatePath = join(__dirname, "..", "data", "opencode.json");
  const config = readFileSync(templatePath, "utf-8");

  const configDir =
    location === "global" ? join(homedir(), ".config", "opencode") : process.cwd();
  const configPath = join(configDir, "opencode.json");

  if (existsSync(configPath)) {
    try {
      const existing = JSON.parse(readFileSync(configPath, "utf-8"));
      if (existing?.provider?.opper) {
        const overwrite = await confirm({
          message: "OpenCode config already has an Opper provider. Overwrite?",
          initialValue: false,
        });
        handleCancel(overwrite);
        if (!overwrite) {
          log.info("Skipping OpenCode setup.");
          return;
        }
      }
    } catch {
      // If we can't parse the existing file, proceed with overwrite
    }
  }

  const s = spinner();
  s.start("Writing OpenCode config...");
  mkdirSync(configDir, { recursive: true });
  writeFileSync(configPath, config, "utf-8");
  s.stop(`Config written to ${configPath}`);

  if (!process.env.OPPER_API_KEY) {
    log.warn("OPPER_API_KEY is not set. Add it to your shell profile:");
    log.info("  export OPPER_API_KEY=<your-api-key>");
    log.info("Get your API key at https://platform.opper.ai");
  } else {
    log.success("OPPER_API_KEY is set.");
  }

  const parsed = JSON.parse(config);
  log.info(`Default model: ${parsed.model}`);
}
