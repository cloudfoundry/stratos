import { Component, provideZonelessChangeDetection, Signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, RouterOutlet } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { activeTabKey } from './active-tab-key';

@Component({ selector: 'app-tab', template: 'tab', standalone: true })
class TabComponent { }

// Stands in for a tabbed page: the tabs are its child routes.
@Component({ selector: 'app-shell', template: '<router-outlet></router-outlet>', standalone: true, imports: [RouterOutlet] })
class ShellComponent {
  readonly tab: Signal<string | null> = activeTabKey();
}

describe('activeTabKey (#6126)', () => {
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([
          {
            path: 'applications/:cfGuid/:appGuid', component: ShellComponent, children: [
              { path: 'summary', component: TabComponent },
              { path: 'variables', component: TabComponent },
              { path: 'revisions', component: TabComponent },
              { path: 'revisions/:revisionGuid', component: TabComponent },
            ],
          },
        ]),
      ],
    });
    harness = await RouterTestingHarness.create();
  });

  const shell = () => harness.fixture.debugElement.query(By.directive(ShellComponent)).componentInstance as ShellComponent;

  it('names the tab the page opened on', async () => {
    await harness.navigateByUrl('/applications/cf1/app1/variables');
    expect(shell().tab()).toBe('variables');
  });

  it('follows the tab as the user moves between tabs', async () => {
    await harness.navigateByUrl('/applications/cf1/app1/summary');
    const page = shell();
    expect(page.tab()).toBe('summary');
    await harness.navigateByUrl('/applications/cf1/app1/variables');
    expect(page.tab()).toBe('variables');
  });

  it('keys a nested tab route by its first segment', async () => {
    await harness.navigateByUrl('/applications/cf1/app1/revisions/rev1');
    expect(shell().tab()).toBe('revisions');
  });
});
