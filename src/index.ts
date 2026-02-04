#!/usr/bin/env node

import {
  intro,
  outro,
  select,
  confirm,
  isCancel,
  cancel,
  log,
} from "@clack/prompts";
import { exec } from "node:child_process";
import { setupOpenCode } from "./opencode.js";
import { setupContinue } from "./continue.js";
import { setupSkills } from "./skills.js";
import { maybeSetApiKey, maskKey } from "./apikey.js";
import { installCli } from "./install.js";

// Opper brand colors (truecolor ANSI)
const color = {
  purple: (s: string) => `\x1b[38;2;60;60;175m${s}\x1b[0m`,    // Savoy Purple #3C3CAF
  water: (s: string) => `\x1b[38;2;140;240;220m${s}\x1b[0m`,    // Water Leaf #8CF0DC
  navy: (s: string) => `\x1b[38;2;27;46;64m${s}\x1b[0m`,        // Blue Whale #1B2E40
  dim: (s: string) => `\x1b[2m${s}\x1b[0m`,
  bold: (s: string) => `\x1b[1m${s}\x1b[0m`,
};

type TopOption = "skills" | "editors" | "cli" | "sdks";
type EditorOption = "opencode" | "continue" | "other-editors" | "back";
type SdkOption = "opper-docs" | "python-sdk" | "node-sdk" | "python-agents" | "node-agents" | "api-docs" | "back";

const topOptions: Array<{ label: string; value: TopOption; hint: string }> = [
  { label: "Opper Skills", value: "skills", hint: "Install AI agent skills for Claude Code, Codex, and more" },
  { label: "AI code editors", value: "editors", hint: "Configure Opper models in your editor" },
  { label: "Opper CLI", value: "cli", hint: "Terminal tool for functions, indexes, and usage tracking" },
  { label: "SDKs & Docs", value: "sdks", hint: "Python SDK, Node SDK, Agent SDKs, and API reference" },
];

const editorOptions: Array<{ label: string; value: EditorOption; hint: string }> = [
  { label: "OpenCode", value: "opencode", hint: "Configure Opper models in OpenCode" },
  { label: "Continue.dev", value: "continue", hint: "Configure Opper models in Continue.dev" },
  { label: "Other editors", value: "other-editors", hint: "Guides for Cursor, Cline, Windsurf, and more" },
  { label: color.dim("← Back"), value: "back", hint: "Return to main menu" },
];

const sdkEntries: Array<{ label: string; value: SdkOption; hint: string; url: string }> = [
  { label: "Opper Docs", value: "opper-docs", hint: "General docs about Opper", url: "https://docs.opper.ai" },
  { label: "Python SDK", value: "python-sdk", hint: "Core Python SDK for Opper", url: "https://github.com/opper-ai/opper-python" },
  { label: "Node SDK", value: "node-sdk", hint: "Core Node/TypeScript SDK for Opper", url: "https://github.com/opper-ai/opper-node" },
  { label: "Python Agent SDK", value: "python-agents", hint: "Build AI agents with Python", url: "https://github.com/opper-ai/opperai-agent-sdk" },
  { label: "Node Agent SDK", value: "node-agents", hint: "Build AI agents with TypeScript", url: "https://github.com/opper-ai/opperai-agent-sdk-node" },
  { label: "API reference", value: "api-docs", hint: "REST API and endpoint reference", url: "https://docs.opper.ai/api" },
];

const sdkOptions: Array<{ label: string; value: SdkOption; hint: string }> = [
  ...sdkEntries,
  { label: color.dim("← Back"), value: "back", hint: "Return to main menu" },
];

function openBrowser(url: string) {
  const cmd =
    process.platform === "darwin"
      ? `open "${url}"`
      : process.platform === "win32"
        ? `start "${url}"`
        : `xdg-open "${url}"`;
  exec(cmd);
}

function unwrap<T>(value: T | symbol): T {
  if (isCancel(value)) {
    cancel("Setup cancelled.");
    process.exit(0);
  }
  return value as T;
}

async function chooseConfigLocation(): Promise<"global" | "local"> {
  return unwrap<"global" | "local">(
    await select({
      message: "Where should the config be written?",
      options: [
        { label: "Global", value: "global", hint: "Applies to all projects" },
        { label: "Local", value: "local", hint: "Current directory only" },
      ],
    }),
  );
}

async function handleEditors(completed: Set<string>): Promise<boolean> {
  const available = editorOptions.filter(
    (o) => o.value === "back" || !completed.has(o.value),
  );

  const nonBackOptions = available.filter((o) => o.value !== "back");
  if (nonBackOptions.length === 0) {
    log.success("All editor integrations are set up!");
    return false;
  }

  const editor = unwrap<EditorOption>(
    await select({
      message: "Which editor?",
      options: available,
    }),
  );

  if (editor === "back") return false;

  switch (editor) {
    case "opencode": {
      const location = await chooseConfigLocation();
      await setupOpenCode(location);
      break;
    }
    case "continue": {
      const apiKey = await maybeSetApiKey({ required: true, reason: "Continue" });
      if (apiKey) {
        const location = await chooseConfigLocation();
        await setupContinue(location);
      } else {
        log.warn("Skipping Continue setup (API key required).");
      }
      break;
    }
    case "other-editors": {
      const url = "https://docs.opper.ai/building/ai-editors";
      openBrowser(url);
      log.info(`Opened ${url} in your browser.`);
      break;
    }
  }

  completed.add(editor);
  return true;
}

async function handleSdks(): Promise<boolean> {
  const sdk = unwrap<SdkOption>(
    await select({
      message: "Which SDK or docs?",
      options: sdkOptions,
    }),
  );

  if (sdk === "back") return false;

  const chosen = sdkEntries.find((o) => o.value === sdk)!;
  openBrowser(chosen.url);
  log.info(`Opened ${chosen.url} in your browser.`);
  return true;
}

async function main() {
  intro(color.purple("Opper Setup"));

  // Auto-detect API key
  if (process.env.OPPER_API_KEY) {
    log.success(`API key detected (${maskKey(process.env.OPPER_API_KEY)}).`);
  } else {
    log.warn("No API key detected. Some setups require one.");
    await maybeSetApiKey({ required: false });
  }

  const completed = new Set<string>();

  // Main loop: select → execute → ask again
  while (true) {
    const available = topOptions.filter((o) => !completed.has(o.value));

    if (available.length === 0) {
      log.success("Everything is set up!");
      break;
    }

    const choice = unwrap<TopOption>(
      await select({
        message: completed.size === 0
          ? "What would you like to set up?"
          : "What else would you like to set up?",
        options: available,
      }),
    );

    switch (choice) {
      case "skills":
        await setupSkills();
        log.info(`Skills docs: ${color.dim("https://github.com/opper-ai/opper-skills")}`);
        completed.add("skills");
        break;

      case "editors": {
        const acted = await handleEditors(completed);
        if (!acted) continue; // back was selected, show top menu again
        break;
      }

      case "cli":
        await installCli();
        completed.add("cli");
        break;

      case "sdks": {
        const acted = await handleSdks();
        if (!acted) continue; // back was selected, show top menu again
        break;
      }
    }

    const again = unwrap<boolean>(
      await confirm({
        message: "Set up anything else?",
        initialValue: false,
      }),
    );

    if (!again) break;
  }

  outro(color.purple("You're all set!") + " Run " + color.dim("npx @opperai/setup") + " anytime to update.");
}

main().catch((error) => {
  if (error instanceof Error && error.name === "ExitPromptError") {
    cancel("Setup cancelled.");
    process.exit(0);
  }
  log.error(`Setup failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
