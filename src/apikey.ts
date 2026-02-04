import { confirm, password, select, isCancel, cancel, log } from "@clack/prompts";
import { exec } from "node:child_process";

function openBrowser(url: string) {
  const cmd =
    process.platform === "darwin"
      ? `open "${url}"`
      : process.platform === "win32"
        ? `start "${url}"`
        : `xdg-open "${url}"`;
  exec(cmd);
}

export function maskKey(key: string): string {
  if (key.length <= 8) return "****";
  return key.slice(0, 3) + "..." + key.slice(-4);
}

function handleCancel(value: unknown) {
  if (isCancel(value)) {
    cancel("Setup cancelled.");
    process.exit(0);
  }
}

function unwrap<T>(value: T | symbol): T {
  handleCancel(value);
  return value as T;
}

async function promptForApiKey(): Promise<string | null> {
  const key = await password({
    message: "Paste your API key (input is hidden):",
    mask: "*",
    validate: (value) => (value && value.trim().length > 0 ? undefined : "API key cannot be empty"),
  });
  handleCancel(key);

  const trimmedKey = (key as string).trim();
  if (!trimmedKey) return null;

  process.env.OPPER_API_KEY = trimmedKey;
  log.success(`API key set for this session (${maskKey(trimmedKey)}).`);

  const shell = process.env.SHELL || "";
  const rcFile = shell.includes("zsh")
    ? "~/.zshrc"
    : shell.includes("bash")
      ? "~/.bashrc"
      : "your shell profile";

  log.info(`To make it permanent, add this to ${rcFile}:`);
  log.info("  export OPPER_API_KEY=<your-key>");

  return trimmedKey;
}

export async function maybeSetApiKey(options: { required: boolean; reason?: string }) {
  if (process.env.OPPER_API_KEY) return process.env.OPPER_API_KEY;

  if (!options.required) {
    const wantsKey = await confirm({
      message: "Would you like to set up your Opper API key now?",
      initialValue: false,
    });
    handleCancel(wantsKey);
    if (!wantsKey) return null;
  } else {
    log.warn(
      `${options.reason ?? "This step"} requires an Opper API key to continue.`,
    );
  }

  const action = unwrap<"paste" | "open" | "skip">(
    await select({
    message: "How would you like to provide your API key?",
    options: [
      { label: "Paste it now", value: "paste" },
      { label: "Open the API keys page", value: "open" },
      { label: "Skip for now", value: "skip" },
    ],
    }),
  );

  if (action === "skip") return null;

  if (action === "open") {
    openBrowser("https://platform.opper.ai/settings/api-keys");
    log.info("Opened the API keys page in your browser.");
  }

  return promptForApiKey();
}
