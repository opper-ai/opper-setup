import { execSync } from "node:child_process";
import { log } from "@clack/prompts";

function isSkillsInstalled(): boolean {
  try {
    const output = execSync("npx skills list", {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return output.toLowerCase().includes("opper");
  } catch {
    return false;
  }
}

export async function setupSkills() {
  if (isSkillsInstalled()) {
    log.info("Opper skills detected — updating to latest...");
    execSync("npx skills update", { stdio: "inherit" });
    log.success("Skills updated.");
  } else {
    execSync("npx skills add opper-ai/opper-skills", { stdio: "inherit" });
    log.success("Skills installed.");
  }
}
