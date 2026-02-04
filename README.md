# @opperai/setup

Interactive CLI to get started with Opper.

```bash
npx @opperai/setup
```

## What it can set up

**Opper Skills** — Install or update AI agent skills for Claude Code, Codex, and more

**AI Code Editors**
- **OpenCode** — Configure Opper models in OpenCode
- **Continue.dev** — Configure Opper models in Continue
- **Other editors** — Opens guides for Cursor, Cline, Windsurf, and more

**Opper CLI** — Terminal tool for functions, indexes, and usage tracking

**SDKs & Docs**
- **Opper Docs** — General docs about Opper
- **Python SDK** — [opper-python](https://github.com/opper-ai/opper-python)
- **Node SDK** — [opper-node](https://github.com/opper-ai/opper-node)
- **Python Agent SDK** — [opperai-agent-sdk](https://github.com/opper-ai/opperai-agent-sdk)
- **Node Agent SDK** — [opperai-agent-sdk-node](https://github.com/opper-ai/opperai-agent-sdk-node)
- **API reference** — REST API and endpoint reference

## How it works

1. Auto-detects your API key (optional unless a step requires it)
2. Pick what you want to set up
3. Each action runs immediately, then asks if you want to set up anything else
4. Sub-menus (editors, SDKs) have a back option to return to the main menu

## Requirements

- Node.js 18+
- An Opper API key from [platform.opper.ai](https://platform.opper.ai)
