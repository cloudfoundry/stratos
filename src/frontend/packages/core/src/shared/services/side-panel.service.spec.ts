import { Injector, provideZonelessChangeDetection, ViewContainerRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { SidePanelService } from './side-panel.service';

describe('SidePanelService', () => {
  let service: SidePanelService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    });
    service = TestBed.inject(SidePanelService);
    service.setContainer({ length: 0, clear: () => {} } as unknown as ViewContainerRef);
  });

  afterEach(() => document.body.classList.remove(SidePanelService.OPEN_CLASS));

  // Full-screen dialogs key off this class to stop short of the panel, so the
  // panel no longer covers their right-hand controls (close, Connect).
  it('marks the body while the panel is open', () => {
    service.open();
    expect(document.body.classList.contains(SidePanelService.OPEN_CLASS)).toBe(true);

    service.hide();
    expect(document.body.classList.contains(SidePanelService.OPEN_CLASS)).toBe(false);
  });

  // The panel host sits above the routes, so a component that needs
  // route-level providers (a Kubernetes resource preview) is created with
  // the caller's injector.
  it('creates the component with the injector it is given', () => {
    const created: { component: unknown; options: unknown }[] = [];
    service.unsetContainer();
    service.setContainer({
      length: 0,
      createComponent: (component: unknown, options: unknown) => {
        created.push({ component, options });
        return { instance: { setProps: () => {} } };
      },
    } as unknown as ViewContainerRef);
    const injector = Injector.create({ providers: [] });
    class Preview {}

    service.show(Preview, { title: 'x' }, injector);

    expect(created).toEqual([{ component: Preview, options: { injector } }]);
  });

  it('clears the mark when the panel is cleared', () => {
    service.open();
    service.clear();
    expect(document.body.classList.contains(SidePanelService.OPEN_CLASS)).toBe(false);
  });
});
