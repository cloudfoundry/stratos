import type { Reporter, File, Task } from 'vitest';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { globSync } from 'glob';

interface TestResults {
  suites: Record<string, SuiteResult>;
  totalTests: number;
  totalPassed: number;
  totalFailed: number;
  totalSkipped: number;
  exitCode: number;
}

interface SuiteResult {
  name: string;
  tests: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  timestamp: string;
}

class StratosReporter implements Reporter {
  private results: TestResults = {
    suites: {},
    totalTests: 0,
    totalPassed: 0,
    totalFailed: 0,
    totalSkipped: 0,
    exitCode: 0,
  };

  onInit() {
    // Ensure coverage directory exists
    if (!existsSync('coverage')) {
      mkdirSync('coverage', { recursive: true });
    }
  }

  async onFinished(files?: File[], errors?: unknown[]) {
    // Accumulate results from this run
    files?.forEach(file => {
      const suiteName = this.extractSuiteName(file.projectName || 'default');

      if (!this.results.suites[suiteName]) {
        this.results.suites[suiteName] = {
          name: suiteName,
          tests: 0,
          passed: 0,
          failed: 0,
          skipped: 0,
          duration: 0,
          timestamp: new Date().toISOString(),
        };
      }

      const suite = this.results.suites[suiteName];

      this.collectTaskResults(file.tasks, suite);
    });

    // Check for focused tests
    const focusedTests = this.detectFocusedTests();
    if (focusedTests.length > 0) {
      console.warn('\n⚠️  WARNING: Focused tests detected:');
      focusedTests.forEach(test => console.warn(`  - ${test}`));
      this.results.exitCode = 1;
    }

    // Write per-suite reports
    Object.values(this.results.suites).forEach(suite => {
      const report = this.generateSuiteReport(suite);
      writeFileSync(
        join('coverage', `stratos-unittest-${suite.name}.txt`),
        report
      );
    });

    // Write JSON tracking
    writeFileSync(
      join('coverage', 'stratos-unittests.json'),
      JSON.stringify(this.results, null, 2)
    );

    // Write summary
    const summary = this.generateSummary();
    writeFileSync(
      join('coverage', 'stratos-unittests.txt'),
      summary
    );

    // Write exit code
    writeFileSync(
      join('coverage', 'stratos-exitcode.txt'),
      String(this.results.exitCode)
    );
  }

  private collectTaskResults(tasks: Task[], suite: SuiteResult): void {
    tasks.forEach(task => {
      if (task.type === 'test') {
        suite.tests++;
        this.results.totalTests++;

        if (task.result?.state === 'pass') {
          suite.passed++;
          this.results.totalPassed++;
        } else if (task.result?.state === 'fail') {
          suite.failed++;
          this.results.totalFailed++;
          this.results.exitCode = 1;
        } else if (task.result?.state === 'skip') {
          suite.skipped++;
          this.results.totalSkipped++;
        }

        suite.duration += task.result?.duration || 0;
      }

      // Recursively process nested tasks (suites)
      if (task.tasks && task.tasks.length > 0) {
        this.collectTaskResults(task.tasks, suite);
      }
    });
  }

  private extractSuiteName(projectName: string): string {
    return projectName.replace('@stratos/', '');
  }

  private generateSuiteReport(suite: SuiteResult): string {
    return `
Stratos Test Report - ${suite.name}
=====================================
Timestamp: ${suite.timestamp}
Duration: ${(suite.duration / 1000).toFixed(2)}s

Results:
  Tests:   ${suite.tests}
  Passed:  ${suite.passed}
  Failed:  ${suite.failed}
  Skipped: ${suite.skipped}

Status: ${suite.failed === 0 ? 'PASSED ✓' : 'FAILED ✗'}
`.trim();
  }

  private generateSummary(): string {
    const passed = this.results.totalFailed === 0;

    return `
Stratos Test Summary - All Suites
==================================
Total Tests:   ${this.results.totalTests}
Total Passed:  ${this.results.totalPassed}
Total Failed:  ${this.results.totalFailed}
Total Skipped: ${this.results.totalSkipped}

Suites: ${Object.keys(this.results.suites).length}
${Object.values(this.results.suites).map(s =>
  `  - ${s.name}: ${s.passed}/${s.tests} passed`
).join('\n')}

Overall Status: ${passed ? 'PASSED ✓' : 'FAILED ✗'}
Exit Code: ${this.results.exitCode}
`.trim();
  }

  private detectFocusedTests(): string[] {
    // Scan spec files for focused tests
    const focused: string[] = [];

    try {
      const specFiles = globSync('src/frontend/packages/**/src/**/*.spec.ts');

      specFiles.forEach((file: string) => {
        try {
          const content = readFileSync(file, 'utf-8');
          if (content.match(/\b(fdescribe|fit|test\.only|describe\.only)\(/)) {
            focused.push(file);
          }
        } catch {
          // Ignore read errors
        }
      });
    } catch {
      // If glob fails, skip focused test detection
    }

    return focused;
  }
}

export default StratosReporter;
