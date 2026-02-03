import { confirm, password } from "@inquirer/prompts";
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

function maskKey(key: string): string {
  if (key.length <= 8) return "****";
  return key.slice(0, 3) + "..." + key.slice(-4);
}

export async function setupApiKey() {
  if (process.env.OPPER_API_KEY) {
    console.log(`OPPER_API_KEY is already set (${maskKey(process.env.OPPER_API_KEY)}).\n`);
    return;
  }

  console.log("OPPER_API_KEY is not set.\n");

  const wantsKey = await confirm({
    message: "Would you like to set up your Opper API key now?",
    default: true,
  });

  if (!wantsKey) {
    console.log();
    return;
  }

  const openSite = await confirm({
    message: "Open the Opper API keys page in your browser?",
    default: true,
  });

  if (openSite) {
    openBrowser("https://platform.opper.ai/settings/api-keys");
    console.log("\nOpening browser...\n");
  }

  const key = await password({
    message: "Paste your API key (input is hidden):",
    mask: "*",
    validate: (value) => (value.trim().length > 0 ? true : "API key cannot be empty"),
  });

  const trimmedKey = key.trim();
  const masked = maskKey(trimmedKey);

  // Set for the rest of this setup session
  process.env.OPPER_API_KEY = trimmedKey;

  console.log(`\nAPI key set for this setup session (${masked}).`);

  const shell = process.env.SHELL || "";
  const rcFile = shell.includes("zsh")
    ? "~/.zshrc"
    : shell.includes("bash")
      ? "~/.bashrc"
      : "your shell profile";

  console.log(`To make it permanent, add this to ${rcFile}:\n`);
  console.log(`  export OPPER_API_KEY=<your-key>\n`);
}
