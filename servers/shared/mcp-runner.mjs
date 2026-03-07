#!/usr/bin/env node
import { spawn } from 'node:child_process';

const rawCommand = process.argv.slice(2).join(' ').trim();

if (!rawCommand) {
  console.error(
    '[mcp-runner] Missing command to execute. Pass it as arguments, for example: "node mcp-runner.mjs \"npx some-package\"".'
  );
  process.exit(1);
}

const isWindows = process.platform === 'win32';

const shell = isWindows ? 'powershell.exe' : process.env.SHELL || '/bin/bash';

const nvmSnippet = isWindows
  ? 'if (Get-Command nvm -ErrorAction SilentlyContinue) { nvm use | Out-Null }'
  : 'if [ -s "$HOME/.nvm/nvm.sh" ]; then source "$HOME/.nvm/nvm.sh"; fi; if command -v nvm >/dev/null 2>&1; then nvm use >/dev/null; fi';

const finalCommand = `${nvmSnippet}; ${rawCommand}`;

const shellArgs = isWindows
  ? ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', finalCommand]
  : ['-lc', finalCommand];

const child = spawn(shell, shellArgs, { stdio: 'inherit', env: process.env });

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
