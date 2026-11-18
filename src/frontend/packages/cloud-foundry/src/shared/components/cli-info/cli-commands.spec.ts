import { describe, expect, it } from 'vitest';

import { CFAppCLIInfoContext } from './cli-info.component';
import {
  APPLICATION_CLI_COMMANDS,
  CLOUD_FOUNDRY_CLI_COMMANDS,
  CliTabCommands,
  commandsForTab,
  ORGANIZATION_CLI_COMMANDS,
  SPACE_CLI_COMMANDS,
} from './cli-commands';

const context: CFAppCLIInfoContext = {
  appName: 'my app',
  spaceName: 'my space',
  orgName: 'my org',
  apiEndpoint: 'https://api.example.com',
  username: 'me',
  skipSslValidation: false,
  ssoAllowed: false,
};

const syntaxes = (list: CliTabCommands[], tab: string | null, ctx = context) =>
  commandsForTab(list, tab).map(c => c.syntax(ctx));

describe('CLI command lists (#6126)', () => {
  it('gives the Variables tab its env commands with the application name quoted', () => {
    expect(syntaxes(APPLICATION_CLI_COMMANDS, 'variables')).toEqual([
      'cf env "my app"',
      'cf set-env "my app" [name] [value]',
      'cf unset-env "my app" [name]',
    ]);
  });

  it('quotes a name a shell would otherwise expand so the copied command pastes as one argument', () => {
    const ctx = (appName: string) => ({ ...context, appName });
    const app = (appName: string) => syntaxes(APPLICATION_CLI_COMMANDS, 'variables', ctx(appName))[0];
    expect(app('my app')).toBe('cf env "my app"');
    expect(app('a$HOME')).toBe("cf env 'a$HOME'");
    expect(app('a`id`b')).toBe("cf env 'a`id`b'");
    expect(app('say "hi"')).toBe("cf env 'say \"hi\"'");
    expect(app("it's $x")).toBe("cf env 'it'\\''s $x'");
    expect(app('back\\slash')).toBe("cf env 'back\\slash'");
  });

  it('falls back to the placeholders when a name is not known yet', () => {
    const noNames = { ...context, appName: undefined, orgName: '', spaceName: '' };
    expect(syntaxes(APPLICATION_CLI_COMMANDS, 'summary', noNames)[0]).toBe('cf app "[app name]"');
    expect(syntaxes(SPACE_CLI_COMMANDS, 'users', noNames)[0]).toBe('cf space-users "[organization name]" "[space name]"');
  });

  it('gives cf space-users the organization and the space', () => {
    expect(syntaxes(SPACE_CLI_COMMANDS, 'users')[0]).toBe('cf space-users "my org" "my space"');
  });

  it('scales memory with -m alone', () => {
    expect(syntaxes(APPLICATION_CLI_COMMANDS, 'summary')).toContain('cf scale "my app" -m [N]M');
  });

  it('returns no commands for a tab with no CLI equivalent, and for no tab', () => {
    expect(commandsForTab(APPLICATION_CLI_COMMANDS, 'metrics')).toEqual([]);
    expect(commandsForTab(CLOUD_FOUNDRY_CLI_COMMANDS, 'cells')).toEqual([]);
    expect(commandsForTab(ORGANIZATION_CLI_COMMANDS, null)).toEqual([]);
  });

  it('lists each tab once and every command as a cf command', () => {
    for (const list of [APPLICATION_CLI_COMMANDS, SPACE_CLI_COMMANDS, ORGANIZATION_CLI_COMMANDS, CLOUD_FOUNDRY_CLI_COMMANDS]) {
      const tabs = list.map(t => t.tab);
      expect(new Set(tabs).size).toBe(tabs.length);
      for (const section of list) {
        expect(section.commands.length).toBeGreaterThan(0);
        for (const command of section.commands) {
          expect(command.syntax(context)).toMatch(/^cf [a-z-]+/);
          expect(command.name).toBeTruthy();
          expect(command.msg).toMatch(/:$/);
        }
      }
    }
  });

  it('keeps the Cloud Foundry level to commands that do not depend on a targeted org or space', () => {
    expect(CLOUD_FOUNDRY_CLI_COMMANDS.map(t => t.tab)).not.toContain('applications');
    expect(CLOUD_FOUNDRY_CLI_COMMANDS.map(t => t.tab)).not.toContain('services');
    expect(syntaxes(CLOUD_FOUNDRY_CLI_COMMANDS, 'routes')).toEqual(['cf routes --org-level']);
  });
});
