#!/usr/bin/env node

import { checkbox, select, Separator } from "@inquirer/prompts";
import { exec } from "node:child_process";
import { setupOpenCode } from "./opencode.js";
import { setupContinue } from "./continue.js";
import { setupSkills } from "./skills.js";
import { setupApiKey } from "./apikey.js";
import { installCli } from "./install.js";

async function main() {
  console.log();

  await setupApiKey();

  const selections = await checkbox({
    message: "What would you like to set up? (space to select/deselect, enter to confirm)",
    pageSize: 15,
    choices: [
      new Separator(" "),
      new Separator("── AI Code Editors ──"),
      {
        name: "Skills — Add Opper skills to your AI code editor",
        value: "skills" as const,
        checked: true,
      },
      {
        name: "OpenCode — Use Opper models in OpenCode",
        value: "opencode" as const,
      },
      {
        name: "Continue — Use Opper models in Continue.dev",
        value: "continue" as const,
      },
      {
        name: "Other editors — Open setup guide for Cursor, Cline, and more",
        value: "other-editors" as const,
      },
      new Separator(" "),
      new Separator("── Tools ──"),
      {
        name: "Opper CLI — Call functions, manage indexes, and track usage from the terminal",
        value: "cli" as const,
      },
    ],
  });

  if (selections.length === 0) {
    console.log("Nothing selected. Exiting.");
    return;
  }

  // Ask for config location if OpenCode or Continue is selected
  let configLocation: "global" | "local" = "global";
  if (selections.includes("opencode") || selections.includes("continue")) {
    configLocation = await select({
      message: "Where should the config be written?",
      choices: [
        {
          name: "Global — applies to all projects",
          value: "global" as const,
        },
        {
          name: "Local — current directory only",
          value: "local" as const,
        },
      ],
    });
  }

  if (selections.includes("skills")) {
    await setupSkills();
  }

  if (selections.includes("opencode")) {
    await setupOpenCode(configLocation);
  }

  if (selections.includes("continue")) {
    await setupContinue(configLocation);
  }

  if (selections.includes("cli")) {
    await installCli();
  }

  if (selections.includes("other-editors")) {
    const url = "https://docs.opper.ai/building/ai-editors";
    const cmd =
      process.platform === "darwin"
        ? `open "${url}"`
        : process.platform === "win32"
          ? `start "${url}"`
          : `xdg-open "${url}"`;
    exec(cmd);
    console.log(`\nOpened ${url} in your browser.`);
  }

  console.log("\nDone!");
}

main().catch((error) => {
  if (error instanceof Error && error.name === "ExitPromptError") {
    console.log("\nSetup cancelled.");
    process.exit(0);
  }
  console.error("\nSetup failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
