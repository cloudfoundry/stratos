import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { RouterTestingModule } from '@angular/router/testing';
import { createBasicStoreModule } from '@stratosui/store/testing';

import { CoreTestingModule } from "@test-framework/core-test.modules";
import { CustomizationService, MDAppModule } from '@stratosui/core';
import { StratosBrandingService } from '../../../../../theme/stratos-branding.service';
import { SideNavComponent } from './side-nav.component';
import { AuthSignalService } from '../../../core/signals/auth-signal.service';


describe('SideNavComponent', () => {
  let component: SideNavComponent;
  let fixture: ComponentFixture<SideNavComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      
      imports: [
        RouterTestingModule,
        MDAppModule,
        CoreTestingModule,
        createBasicStoreModule(),
        SideNavComponent,
      ],
      providers: [
        
        CustomizationService,
        provideZonelessChangeDetection(),
      ]
    
    });
      TestBed.compileComponents();
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(SideNavComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  // Pages also have a named page-tab nav; each landmark needs its own name.
  it('names its navigation landmark', () => {
    const nav = (fixture.nativeElement as HTMLElement).querySelector('nav')!;
    expect(nav.getAttribute('aria-label')).toBe('Main');
  });

  // An icon's ligature text ("home") is not part of a name.
  const nameText = (el: Element): string => {
    const copy = el.cloneNode(true) as Element;
    copy.querySelectorAll('[aria-hidden="true"], .hidden').forEach(e => e.remove());
    return copy.textContent!.replace(/\s+/g, ' ').trim();
  };

  it('names its items without their icon text', async () => {
    fixture.componentRef.setInput('tabs', [{ link: '/home', label: 'Home', matIcon: 'home' }]);
    fixture.componentRef.setInput('iconMode', false);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;

    expect(nameText(el.querySelector('a.nav-item')!)).toBe('Home');
    expect(el.querySelector('.nav-toggle')!.getAttribute('aria-label')).toBe('Collapse sidebar');
    // The logo's name is the text beside it, said once.
    expect(el.querySelector('.nav-logo-img')!.getAttribute('alt')).toBe('');

    fixture.componentRef.setInput('iconMode', true);
    await fixture.whenStable();
    expect(el.querySelector('.nav-logo-img')!.getAttribute('alt')).not.toBe('');
  });

  it('shows icons only until told otherwise, and says when the mode changes', async () => {
    const changedMode = vi.fn();
    component.changedMode.subscribe(changedMode);
    const logoText = () => (fixture.nativeElement as HTMLElement).querySelector('.nav-logo-text')!;
    expect(logoText().classList.contains('hidden')).toBe(true);
    expect(changedMode).not.toHaveBeenCalled();

    fixture.componentRef.setInput('iconMode', false);
    await fixture.whenStable();
    expect(logoText().classList.contains('hidden')).toBe(false);
    expect(changedMode).toHaveBeenCalledTimes(1);

    fixture.componentRef.setInput('iconMode', true);
    await fixture.whenStable();
    expect(logoText().classList.contains('hidden')).toBe(true);
    expect(changedMode).toHaveBeenCalledTimes(2);
  });

  // HIDE_NAV_LOGOUT is delivered in the session config; the side nav reads it
  // to drop its own Sign Out button while the header menu keeps logout.
  describe('hideNavLogout', () => {
    const build = async (config: Record<string, unknown> | undefined) => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [RouterTestingModule, MDAppModule, CoreTestingModule, createBasicStoreModule(), SideNavComponent],
        providers: [
          CustomizationService,
          provideZonelessChangeDetection(),
          { provide: AuthSignalService, useValue: { sessionData: signal(config ? { config } : null), logout: () => undefined } },
        ]
      });
      const f = TestBed.createComponent(SideNavComponent);
      await f.whenStable();
      return f.componentInstance;
    };

    it('is false when the flag is unset', async () => {
      expect((await build({ enableTechPreview: false })).hideNavLogout()).toBe(false);
    });

    it('is false when there is no session yet', async () => {
      expect((await build(undefined)).hideNavLogout()).toBe(false);
    });

    it('is true when HIDE_NAV_LOGOUT is on', async () => {
      expect((await build({ hideNavLogout: true })).hideNavLogout()).toBe(true);
    });
  });

  it('hides the "Show all menu items" debug checkbox by default', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('#nav-show-all')).toBeNull();
  });

  it('shows the checkbox when the deployment config enables the debug toggle', async () => {
    const branding = TestBed.inject(StratosBrandingService);
    vi.spyOn(branding, 'getShowAllMenuItemsToggle').mockReturnValue(true);
    const enabled = TestBed.createComponent(SideNavComponent);
    await enabled.whenStable();
    expect((enabled.nativeElement as HTMLElement).querySelector('#nav-show-all')).toBeTruthy();
  });

  it('ignores a stale saved preference while the debug toggle is disabled', async () => {
    // With the checkbox hidden there is no way to switch it off — hidden nav
    // items must not leak through a leftover localStorage value.
    localStorage.setItem('stratos-show-all-menu-items', 'true');
    try {
      const f = TestBed.createComponent(SideNavComponent);
      await f.whenStable();
      expect(f.componentInstance.revealHiddenItems).toBe(false);
    } finally {
      localStorage.removeItem('stratos-show-all-menu-items');
    }
  });
});
