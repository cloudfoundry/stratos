import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { CoreModule } from '../../../../../core/src/core/core.module';
import { MDAppModule } from '../../../../../core/src/core/md.module';
import { CodeBlockComponent } from '../../../../../core/src/shared/components/code-block/code-block.component';
import {
  CopyToClipboardComponent,
} from '../../../../../core/src/shared/components/copy-to-clipboard/copy-to-clipboard.component';
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

  async function render(overrides: Partial<typeof context> = {}): Promise<string> {
    fixture = TestBed.createComponent(CliInfoComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('context', { ...context, ...overrides });
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
});
