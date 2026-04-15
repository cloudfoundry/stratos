import { test, expect } from '../../fixtures/test-base';

/**
 * Dashboard Content Scroll Shadow Tests
 *
 * Validates the scroll shadow overlay on the dashboard-base content
 * container. Non-list pages (About, Diagnostics) use this container
 * for scrolling. macOS hides scrollbars by default, so the shadow
 * provides a visual indicator that more content exists below the fold.
 *
 * Run against adepttech:
 *   E2E_BASE_URL=https://console.run.adepttech.ca \
 *   E2E_PROFILE=adepttech npx playwright test dashboard-scroll-shadow
 */

/** Selector for the #content scroll container in dashboard-base */
const CONTENT_SELECTOR = 'app-dashboard-base .dashboard-main > div:last-child > div[class*="overflow-y-auto"]';

/** Selector for the shadow overlay (sibling of #content, inside relative wrapper) */
const SHADOW_SELECTOR = 'app-dashboard-base .dashboard-main > div:last-child > div[class*="bg-gradient-to-t"]';

/** Selector for the relative wrapper around content + shadow */
const WRAPPER_SELECTOR = 'app-dashboard-base .dashboard-main > div:last-child';

const SELECTORS = { content: CONTENT_SELECTOR, shadow: SHADOW_SELECTOR, wrapper: WRAPPER_SELECTOR };

test.describe('Dashboard Content Scroll Shadow', () => {

  /**
   * Dismiss any error banner that may appear after login/navigation
   */
  async function dismissErrorBanner(page: any) {
    const closeButton = page.locator('button[aria-label="Close"]').first();
    if (await closeButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await closeButton.click().catch(() => {});
    }
  }

  test.describe('Shadow Overlay DOM Structure', () => {

    test('shadow overlay exists with correct CSS properties', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      await page.goto('/about');
      await page.waitForLoadState('networkidle');
      await dismissErrorBanner(page);

      // 1. Check the relative wrapper exists
      const wrapper = await page.evaluate((sel: string) => {
        const el = document.querySelector(sel);
        if (!el) return { exists: false };
        const cs = window.getComputedStyle(el);
        return {
          exists: true,
          position: cs.position,
          overflow: cs.overflow,
        };
      }, WRAPPER_SELECTOR);

      expect(wrapper.exists, 'Relative wrapper should exist').toBe(true);
      expect(wrapper.position, 'Wrapper should be relative for shadow positioning').toBe('relative');

      // 2. Check the content scroll container
      const content = await page.evaluate((sel: string) => {
        const el = document.querySelector(sel);
        if (!el) return { exists: false };
        const cs = window.getComputedStyle(el);
        return {
          exists: true,
          overflowY: cs.overflowY,
          scrollHeight: (el as HTMLElement).scrollHeight,
          clientHeight: (el as HTMLElement).clientHeight,
          hasOverflow: (el as HTMLElement).scrollHeight > (el as HTMLElement).clientHeight,
        };
      }, CONTENT_SELECTOR);

      expect(content.exists, 'Content scroll container should exist').toBe(true);
      expect(content.overflowY, 'Content should have overflow-y: auto').toBe('auto');
      console.log(`\n>>> CONTENT SCROLL: scrollHeight=${content.scrollHeight}, clientHeight=${content.clientHeight}, hasOverflow=${content.hasOverflow}`);

      // 3. Check shadow overlay div
      const shadow = await page.evaluate((sel: string) => {
        const el = document.querySelector(sel);
        if (!el) return { exists: false };
        const cs = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return {
          exists: true,
          position: cs.position,
          pointerEvents: cs.pointerEvents,
          zIndex: cs.zIndex,
          backgroundImage: cs.backgroundImage,
          opacity: cs.opacity,
          height: rect.height,
          width: rect.width,
          bottom: rect.bottom,
        };
      }, SHADOW_SELECTOR);

      expect(shadow.exists, 'Shadow overlay should exist').toBe(true);
      expect(shadow.position, 'Shadow should be absolute').toBe('absolute');
      expect(shadow.pointerEvents, 'Shadow should have pointer-events: none').toBe('none');
      expect(Number(shadow.zIndex), 'Shadow z-index should be >= 50').toBeGreaterThanOrEqual(50);
      expect(shadow.backgroundImage, 'Shadow should have a gradient background').toContain('gradient');
      expect(shadow.height, 'Shadow should have height > 0').toBeGreaterThan(0);
      expect(shadow.width, 'Shadow should have width > 0').toBeGreaterThan(0);
    });

    test('shadow overlay uses correct Tailwind gradient classes', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      await page.goto('/about');
      await page.waitForLoadState('networkidle');
      await dismissErrorBanner(page);

      const html = await page.evaluate((sel: string) => {
        const el = document.querySelector(sel);
        if (!el) return 'NOT FOUND';
        return el.className;
      }, SHADOW_SELECTOR);

      expect(html).not.toBe('NOT FOUND');
      expect(html).toContain('bg-gradient-to-t');
      expect(html).toContain('pointer-events-none');
      expect(html).toContain('transition-opacity');
    });
  });

  test.describe('Shadow Visibility Behavior', () => {

    test('shadow is visible when content overflows on About page', async ({ authenticatedPage }) => {
      const page = authenticatedPage;

      // Use a small viewport to ensure About page content overflows
      await page.setViewportSize({ width: 1280, height: 400 });
      await page.goto('/about');
      await page.waitForLoadState('networkidle');
      await dismissErrorBanner(page);
      await page.waitForTimeout(500);

      const state = await page.evaluate((sels: { content: string; shadow: string }) => {
        const content = document.querySelector(sels.content) as HTMLElement;
        const shadow = document.querySelector(sels.shadow) as HTMLElement;
        if (!content || !shadow) return { found: false };
        const cs = window.getComputedStyle(shadow);
        return {
          found: true,
          scrollHeight: content.scrollHeight,
          clientHeight: content.clientHeight,
          hasOverflow: content.scrollHeight > content.clientHeight,
          shadowOpacity: cs.opacity,
          shadowHasOpacity0Class: shadow.classList.contains('opacity-0'),
        };
      }, { content: CONTENT_SELECTOR, shadow: SHADOW_SELECTOR });

      console.log('\n>>> OVERFLOW STATE:', JSON.stringify(state));
      expect(state.found, 'Content and shadow elements should exist').toBe(true);

      if (state.hasOverflow) {
        expect(state.shadowHasOpacity0Class,
          'Shadow should NOT have opacity-0 class when content overflows'
        ).toBe(false);
        expect(Number(state.shadowOpacity),
          'Shadow opacity should be > 0 when content overflows'
        ).toBeGreaterThan(0);
      }
    });

    test('shadow disappears when scrolled to bottom', async ({ authenticatedPage }) => {
      const page = authenticatedPage;

      await page.setViewportSize({ width: 1280, height: 400 });
      await page.goto('/about');
      await page.waitForLoadState('networkidle');
      await dismissErrorBanner(page);
      await page.waitForTimeout(500);

      // Scroll to bottom
      await page.evaluate((sel: string) => {
        const el = document.querySelector(sel) as HTMLElement;
        if (el) el.scrollTop = el.scrollHeight;
      }, CONTENT_SELECTOR);
      await page.waitForTimeout(300);

      const state = await page.evaluate((sels: { content: string; shadow: string }) => {
        const content = document.querySelector(sels.content) as HTMLElement;
        const shadow = document.querySelector(sels.shadow) as HTMLElement;
        if (!content || !shadow) return { found: false };
        return {
          found: true,
          scrollTop: content.scrollTop,
          scrollHeight: content.scrollHeight,
          clientHeight: content.clientHeight,
          atBottom: content.scrollTop + content.clientHeight >= content.scrollHeight - 4,
          shadowHasOpacity0Class: shadow.classList.contains('opacity-0'),
        };
      }, { content: CONTENT_SELECTOR, shadow: SHADOW_SELECTOR });

      console.log('\n>>> SCROLL-TO-BOTTOM STATE:', JSON.stringify(state));
      expect(state.found, 'Elements should exist').toBe(true);

      if (state.atBottom) {
        expect(state.shadowHasOpacity0Class,
          'Shadow should have opacity-0 class when scrolled to bottom'
        ).toBe(true);
      }
    });

    test('shadow not visible when content fits without scrolling', async ({ authenticatedPage }) => {
      const page = authenticatedPage;

      // Use a very tall viewport so content fits
      await page.setViewportSize({ width: 1280, height: 2000 });
      await page.goto('/about');
      await page.waitForLoadState('networkidle');
      await dismissErrorBanner(page);
      await page.waitForTimeout(500);

      const state = await page.evaluate((sels: { content: string; shadow: string }) => {
        const content = document.querySelector(sels.content) as HTMLElement;
        const shadow = document.querySelector(sels.shadow) as HTMLElement;
        if (!content || !shadow) return { found: false };
        return {
          found: true,
          scrollHeight: content.scrollHeight,
          clientHeight: content.clientHeight,
          hasOverflow: content.scrollHeight > content.clientHeight,
          shadowHasOpacity0Class: shadow.classList.contains('opacity-0'),
        };
      }, { content: CONTENT_SELECTOR, shadow: SHADOW_SELECTOR });

      console.log('\n>>> NO-OVERFLOW STATE:', JSON.stringify(state));
      expect(state.found, 'Elements should exist').toBe(true);

      if (!state.hasOverflow) {
        expect(state.shadowHasOpacity0Class,
          'Shadow should have opacity-0 class when content fits'
        ).toBe(true);
      }
    });
  });

  test.describe('Shadow Across Pages', () => {

    test('shadow updates after navigating between pages', async ({ authenticatedPage }) => {
      const page = authenticatedPage;

      await page.setViewportSize({ width: 1280, height: 400 });

      // Navigate to About
      await page.goto('/about');
      await page.waitForLoadState('networkidle');
      await dismissErrorBanner(page);
      await page.waitForTimeout(500);

      const aboutState = await page.evaluate((sels: { content: string; shadow: string }) => {
        const content = document.querySelector(sels.content) as HTMLElement;
        const shadow = document.querySelector(sels.shadow) as HTMLElement;
        if (!content || !shadow) return { found: false };
        return {
          found: true,
          hasOverflow: content.scrollHeight > content.clientHeight,
          shadowHasOpacity0Class: shadow.classList.contains('opacity-0'),
        };
      }, { content: CONTENT_SELECTOR, shadow: SHADOW_SELECTOR });

      console.log('\n>>> ABOUT STATE:', JSON.stringify(aboutState));
      expect(aboutState.found, 'Elements should exist on About page').toBe(true);

      // Navigate to Diagnostics via direct URL
      await page.goto('/about/diagnostics');
      await page.waitForLoadState('networkidle');
      await dismissErrorBanner(page);
      await page.waitForTimeout(500);

      const diagState = await page.evaluate((sels: { content: string; shadow: string }) => {
        const content = document.querySelector(sels.content) as HTMLElement;
        const shadow = document.querySelector(sels.shadow) as HTMLElement;
        if (!content || !shadow) return { found: false };
        return {
          found: true,
          hasOverflow: content.scrollHeight > content.clientHeight,
          shadowHasOpacity0Class: shadow.classList.contains('opacity-0'),
        };
      }, { content: CONTENT_SELECTOR, shadow: SHADOW_SELECTOR });

      console.log('\n>>> DIAGNOSTICS STATE:', JSON.stringify(diagState));
      expect(diagState.found, 'Elements should exist on Diagnostics page').toBe(true);

      // Shadow visibility should match overflow state on each page
      // Allow extra time for async content to load and shadow to update
      if (diagState.hasOverflow && diagState.shadowHasOpacity0Class) {
        // Content may have loaded after initial check; re-trigger by scrolling slightly
        await page.evaluate((sel: string) => {
          const el = document.querySelector(sel) as HTMLElement;
          if (el) { el.scrollTop = 1; el.scrollTop = 0; }
        }, CONTENT_SELECTOR);
        await page.waitForTimeout(300);

        const retryState = await page.evaluate((sels: { content: string; shadow: string }) => {
          const content = document.querySelector(sels.content) as HTMLElement;
          const shadow = document.querySelector(sels.shadow) as HTMLElement;
          if (!content || !shadow) return { found: false };
          return {
            found: true,
            hasOverflow: content.scrollHeight > content.clientHeight,
            shadowHasOpacity0Class: shadow.classList.contains('opacity-0'),
          };
        }, { content: CONTENT_SELECTOR, shadow: SHADOW_SELECTOR });

        console.log('\n>>> DIAGNOSTICS RETRY STATE:', JSON.stringify(retryState));
        if (retryState.found && retryState.hasOverflow) {
          expect(retryState.shadowHasOpacity0Class, 'Shadow should be visible when diagnostics overflows').toBe(false);
        }
      } else if (diagState.hasOverflow) {
        expect(diagState.shadowHasOpacity0Class, 'Shadow should be visible when diagnostics overflows').toBe(false);
      } else {
        expect(diagState.shadowHasOpacity0Class, 'Shadow should be hidden when diagnostics fits').toBe(true);
      }
    });

    test('list pages should NOT have double shadow', async ({ authenticatedPage }) => {
      const page = authenticatedPage;

      // Navigate to Applications (a list page)
      const appsNav = page.locator('a').filter({ hasText: /Applications/i }).first();
      const visible = await appsNav.isVisible({ timeout: 10000 }).catch(() => false);
      if (!visible) {
        test.skip('Applications page not reachable');
        return;
      }
      await appsNav.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // The dashboard shadow should exist but the list component has its own
      // Check that the dashboard shadow is hidden (opacity-0) because list pages
      // typically fill their container without overflow at the dashboard level
      const state = await page.evaluate((sel: string) => {
        const dashboardShadow = document.querySelector(sel) as HTMLElement;
        const listShadow = document.querySelector('.list-component__body div[class*="bg-gradient-to-t"]') as HTMLElement;

        return {
          dashboardShadowExists: !!dashboardShadow,
          dashboardShadowOpacity0: dashboardShadow?.classList.contains('opacity-0') ?? null,
          listShadowExists: !!listShadow,
        };
      }, SHADOW_SELECTOR);

      console.log('\n>>> LIST PAGE SHADOW STATE:', JSON.stringify(state));
      expect(state.dashboardShadowExists, 'Dashboard shadow element should exist').toBe(true);
      // List pages manage their own scroll container, so the dashboard content
      // div should not overflow — dashboard shadow should be hidden
      if (state.listShadowExists) {
        expect(state.dashboardShadowOpacity0,
          'Dashboard shadow should be hidden on list pages (list has its own shadow)'
        ).toBe(true);
      }
    });
  });

  test.describe('Shadow Positioning', () => {

    test('shadow bottom aligns with content container bottom', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      await page.goto('/about');
      await page.waitForLoadState('networkidle');
      await dismissErrorBanner(page);

      const positioning = await page.evaluate((sels: { content: string; shadow: string; wrapper: string }) => {
        const content = document.querySelector(sels.content) as HTMLElement;
        const shadow = document.querySelector(sels.shadow) as HTMLElement;
        const wrapper = document.querySelector(sels.wrapper) as HTMLElement;
        if (!content || !shadow || !wrapper) return { found: false };
        const contentRect = content.getBoundingClientRect();
        const shadowRect = shadow.getBoundingClientRect();
        const wrapperRect = wrapper.getBoundingClientRect();
        return {
          found: true,
          contentBottom: contentRect.bottom,
          shadowBottom: shadowRect.bottom,
          wrapperBottom: wrapperRect.bottom,
        };
      }, SELECTORS);

      expect(positioning.found, 'All elements should exist').toBe(true);
      if (positioning.found) {
        console.log(`\n>>> POSITIONING: content bottom=${positioning.contentBottom}, shadow bottom=${positioning.shadowBottom}, wrapper bottom=${positioning.wrapperBottom}`);
        expect(Math.abs(positioning.shadowBottom - positioning.contentBottom),
          `Shadow bottom (${positioning.shadowBottom}) should align with content bottom (${positioning.contentBottom})`
        ).toBeLessThan(5);
      }
    });
  });
});
