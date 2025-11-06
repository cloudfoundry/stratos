import { spawn } from 'child_process';
import { BuilderContext } from '@angular-devkit/architect';
import { PrebuildScript } from './schema';
import { ScriptExecution } from './types';
import { ProgressReporter } from './progress-reporter';

export class ScriptRunner {
  constructor(
    private context: BuilderContext,
    private reporter: ProgressReporter
  ) {}

  async execute(script: PrebuildScript): Promise<ScriptExecution> {
    const startTime = Date.now();
    const timeout = script.timeout || 60000;

    return new Promise((resolve, reject) => {
      // Use shell to execute the full command string
      // This avoids the Node.js DEP0190 deprecation warning about passing args with shell: true
      const child = spawn(script.script, {
        cwd: this.context.workspaceRoot,
        shell: true,
        stdio: ['ignore', 'pipe', 'pipe']
      });

      let output = '';
      let error = '';

      child.stdout?.on('data', (data: Buffer) => {
        const text = data.toString();
        output += text;
        this.reporter.scriptOutput(script.name, text);
      });

      child.stderr?.on('data', (data: Buffer) => {
        const text = data.toString();
        error += text;
        this.reporter.scriptError(script.name, text);
      });

      // Timeout handler
      const timer = setTimeout(() => {
        child.kill('SIGTERM');
        reject(new Error(`Script ${script.name} timed out after ${timeout}ms`));
      }, timeout);

      child.on('close', (code) => {
        clearTimeout(timer);

        const execution: ScriptExecution = {
          script,
          output: output || error,
          exitCode: code || 0,
          duration: Date.now() - startTime,
          cached: false
        };

        if (code !== 0) {
          execution.error = new Error(
            `Script exited with code ${code}\n${error}`
          );
        }

        resolve(execution);
      });

      child.on('error', (err) => {
        clearTimeout(timer);
        reject(err);
      });
    });
  }
}
