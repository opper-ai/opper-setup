import { execSync } from "node:child_process";
import { log, spinner } from "@clack/prompts";

export async function installCli() {
  log.info("Opper CLI");

  if (process.platform !== "darwin") {
    log.warn("The Opper CLI is currently available via Homebrew on macOS.");
    log.info("For other platforms, download from:");
    log.info("  https://github.com/opper-ai/oppercli/releases/latest");
    return;
  }

  const s = spinner();
  s.start("Installing via Homebrew...");
  execSync("brew tap opper-ai/oppercli git@github.com:opper-ai/oppercli && brew install opper", {
    stdio: "inherit",
  });
  s.stop("Opper CLI installed.");
  log.info("Run `opper config add default <your-api-key>` to configure.");
}
