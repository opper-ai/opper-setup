import { readFileSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";
import { confirm, isCancel, cancel, log, spinner } from "@clack/prompts";
import { parse, stringify } from "yaml";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OPPER_API_BASE = "https://api.opper.ai/v2/openai";

function handleCancel(value: unknown) {
  if (isCancel(value)) {
    cancel("Setup cancelled.");
    process.exit(0);
  }
}

export async function setupContinue(location: "global" | "local") {
  log.info("Continue.dev Setup");

  const templatePath = join(__dirname, "..", "data", "continue.yaml");
  const template = parse(readFileSync(templatePath, "utf-8")) as {
    models: Array<Record<string, unknown>>;
  };

  const configDir =
    location === "global" ? join(homedir(), ".continue") : join(process.cwd(), ".continue");
  const configPath = join(configDir, "config.yaml");

  let config: Record<string, unknown> = {};

  if (existsSync(configPath)) {
    try {
      config = parse(readFileSync(configPath, "utf-8")) || {};
    } catch {
      // If we can't parse, start fresh
    }

    const models = Array.isArray(config.models) ? config.models : [];
    const hasOpper = models.some(
      (m: Record<string, unknown>) => m.apiBase === OPPER_API_BASE,
    );

    if (hasOpper) {
      const overwrite = await confirm({
        message: "Continue config already has Opper models. Overwrite them?",
        initialValue: false,
      });
      handleCancel(overwrite);
      if (!overwrite) {
        log.info("Skipping Continue.dev setup.");
        return;
      }
      config.models = models.filter(
        (m: Record<string, unknown>) => m.apiBase !== OPPER_API_BASE,
      );
    }
  }

  const apiKey = process.env.OPPER_API_KEY;
  if (!apiKey) {
    log.warn("OPPER_API_KEY is not set. Cannot write Continue config without it.");
    log.info("  export OPPER_API_KEY=<your-api-key>");
    log.info("Get your API key at https://platform.opper.ai");
    return;
  }

  const models = template.models.map((m) => ({
    ...m,
    apiKey,
  }));

  if (!Array.isArray(config.models)) {
    config.models = [];
  }
  (config.models as unknown[]).push(...models);

  const s = spinner();
  s.start("Writing Continue config...");
  mkdirSync(configDir, { recursive: true });
  writeFileSync(configPath, stringify(config), "utf-8");
  s.stop(`Wrote ${template.models.length} Opper models to ${configPath}`);

  log.success("API key written to config.");
}
