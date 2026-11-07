import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { CoreModule } from '../../../../../core/src/core/core.module';
import { MDAppModule } from '../../../../../core/src/core/md.module';
import { CodeBlockComponent } from '../../../../../core/src/shared/components/code-block/code-block.component';
import {
  CopyToClipboardComponent,
} from '../../../../../core/src/shared/components/copy-to-clipboard/copy-to-clipboard.component';
import { APPLICATION_CLI_COMMANDS } from './cli-commands';
import { CliInfoComponent } from './cli-info.component';

describe('CliInfoComponent', () => {
  let component: CliInfoComponent;
  let fixture: ComponentFixture<CliInfoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
      imports: [
        CoreModule,
        MDAppModule,
        CliInfoComponent,
        CodeBlockComponent,
        CopyToClipboardComponent,
    ]
    })
      .compileComponents();
  });

  const context = {
    appName: 'app',
    spaceName: 'space',
    orgName: 'org',
    apiEndpoint: 'https://api.example.org',
    username: 'user',
    skipSslValidation: false,
    ssoAllowed: false,
  };

  async function render(overrides: Partial<typeof context> = {}, sections?: typeof APPLICATION_CLI_COMMANDS): Promise<string> {
    fixture = TestBed.createComponent(CliInfoComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('context', { ...context, ...overrides });
    if (sections) {
      fixture.componentRef.setInput('sections', sections);
    }
    await fixture.whenStable();
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }

  it('should create', async () => {
    await render();
    expect(component).toBeTruthy();
  });

  it('sets the api endpoint without flags when the certificate is validated', async () => {
    const text = await render();
    expect(text).toContain('cf api https://api.example.org');
    expect(text).not.toContain('--skip-ssl-validation');
  });

  it('adds --skip-ssl-validation when the endpoint skips certificate validation', async () => {
    const text = await render({ skipSslValidation: true });
    expect(text).toContain('cf api https://api.example.org --skip-ssl-validation');
  });

  it('offers cf login --sso only when the endpoint allows single sign-on', async () => {
    expect(await render()).not.toContain('cf login --sso');
    expect(await render({ ssoAllowed: true })).toContain('cf login --sso');
  });

  it('shows the login prompts the way the current CLI prints them', async () => {
    const text = await render();
    // Each prompt starts its own line, flush with the first line of the sample.
    expect(text).toContain('\nEmail: user\nPassword: [password]\n');
    expect(text).not.toContain('Email>');
  });

  // #6126: the level's commands come from the shared per-tab lists, grouped by tab.
  it('renders the given command sections grouped under their tab names', async () => {
    const text = await render({}, APPLICATION_CLI_COMMANDS);
    const headings = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('h4')).map(h => h.textContent?.trim());
    expect(headings).toEqual(['Getting Started', 'Summary', 'Log Stream', 'Revisions', 'Routes', 'Variables', 'Services', 'Events']);
    expect(text).toContain('To show the application environment variables:');
    expect(text).toContain('cf env "app"');
    expect(text).toContain('cf scale "app" -m [N]M');
  });

  // The download link read "see here", which says nothing out of context
  // (WCAG 2.4.4): the step itself is the link text.
  it('names the CLI download link by its purpose', async () => {
    const text = await render();
    const link = (fixture.nativeElement as HTMLElement).querySelector('a[href^="https://github.com/cloudfoundry/cli"]');
    expect(link?.textContent?.trim()).toBe('Download and install the Cloud Foundry CLI');
    expect(text).not.toContain('see here');
  });

  it('renders only Getting Started when no sections are given', async () => {
    await render();
    const headings = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('h4')).map(h => h.textContent?.trim());
    expect(headings).toEqual(['Getting Started']);
  });
});
