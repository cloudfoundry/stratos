import { test, expect } from '../../fixtures/test-base';

/**
 * Scroll Shadow Diagnostic Tests
 *
 * Inspects the actual DOM/CSS state of the signal-list scroll fade
 * overlay to diagnose rendering issues. Reports "expected X but got Y"
 * style diagnostics for computed styles, dimensions, and visibility.
 *
 * Targets the signal-list DOM (post W36 list-component retirement):
 *   <app-signal-list>
 *     <div class="flex flex-col h-full min-h-0 ...">  // POSITIONING_CONTEXT
 *       <div data-test="scroll-body" class="relative flex-1 overflow-auto">…</div>
 *       <div data-test="scroll-fade" ...class="bg-gradient-to-t ..."></div>  // SHADOW
 *     </div>
 *   </app-signal-list>
 *
 * Run against adepttech:
 *   E2E_BASE_URL=https://console.run.adepttech.ca \
 *   E2E_PROFILE=adepttech npx playwright test scroll-shadow
 */

const POSITIONING_CONTEXT = 'app-signal-list > div';
const SCROLL_BODY = 'app-signal-list [data-test="scroll-body"]';
const SHADOW = 'app-signal-list [data-test="scroll-fade"]';

test.describe('Scroll Shadow', () => {

  /** Navigate to Applications page and wait for cards to render */
  async function goToAppsPage(page: any): Promise<boolean> {
    // Use a short viewport height to force list overflow regardless of item count
    await page.setViewportSize({ width: 1280, height: 600 });
    await page.goto('/applications');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    // Wait for the signal-list scroll body to render — deterministic
    // anchor that doesn't depend on whether items loaded or not.
    try {
      await page.locator(SCROLL_BODY).waitFor({ state: 'visible', timeout: 30000 });
    } catch {
      // Data may not have loaded, continue anyway for diagnostics
    }
    await page.waitForTimeout(1000);
    return true;
  }

  /** Dump computed styles for a selector */
  async function dumpStyles(page: any, selector: string, label: string) {
    const info = await page.evaluate((sel: string) => {
      const el = document.querySelector(sel);
      if (!el) return { exists: false };
      const cs = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return {
        exists: true,
        tagName: el.tagName,
        className: el.className,
        rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height, bottom: rect.bottom },
        styles: {
          display: cs.display,
          position: cs.position,
          zIndex: cs.zIndex,
          opacity: cs.opacity,
          overflow: cs.overflow,
          overflowY: cs.overflowY,
          background: cs.background,
          backgroundImage: cs.backgroundImage,
          pointerEvents: cs.pointerEvents,
          height: cs.height,
          width: cs.width,
        },
        scroll: {
          scrollHeight: (el as HTMLElement).scrollHeight,
          clientHeight: (el as HTMLElement).clientHeight,
          scrollTop: (el as HTMLElement).scrollTop,
          hasOverflow: (el as HTMLElement).scrollHeight > (el as HTMLElement).clientHeight,
        },
        childCount: el.children.length,
      };
    }, selector);
    console.log(`\n=== ${label} (${selector}) ===`);
    console.log(JSON.stringify(info, null, 2));
    return info;
  }

  test.describe('DOM Structure Diagnostics', () => {

    test('inspect shadow overlay and scroll container', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      if (!await goToAppsPage(page)) {
        test.skip('Applications page not reachable');
      }

      // 1. Check the signal-list positioning context (outer flex wrapper)
      const context = await dumpStyles(page, POSITIONING_CONTEXT, 'Signal-list positioning context');
      expect(context.exists, 'signal-list positioning context should exist').toBe(true);
      if (context.exists) {
        expect(context.rect.height, 'Context should have height > 0').toBeGreaterThan(0);
      }

      // 2. Check scroll body (the actual scroll container)
      const scrollBody = await dumpStyles(page, SCROLL_BODY, 'Scroll body (scroll container)');
      expect(scrollBody.exists, 'scroll body should exist').toBe(true);
      if (scrollBody.exists) {
        if (scrollBody.rect.height === 0) {
          test.skip('scroll body has height 0 — CSS layout may differ in this environment');
        }
        expect(scrollBody.styles.overflow, 'scroll body should have overflow: auto').toBe('auto');
        console.log(`\n>>> SCROLL STATE: scrollHeight=${scrollBody.scroll.scrollHeight}, clientHeight=${scrollBody.scroll.clientHeight}, hasOverflow=${scrollBody.scroll.hasOverflow}`);
      }

      // 3. Check the shadow overlay div — only rendered when content overflows
      const shadow = await dumpStyles(page, SHADOW, 'Shadow Overlay (scroll-fade)');
      if (scrollBody.scroll?.hasOverflow) {
        expect(shadow.exists, 'Shadow overlay should exist when content overflows').toBe(true);
        if (shadow.exists) {
          expect(shadow.rect.height, 'Shadow should have height > 0').toBeGreaterThan(0);
          expect(shadow.rect.width, 'Shadow should have width > 0').toBeGreaterThan(0);
          expect(shadow.styles.pointerEvents, 'Shadow should have pointer-events: none').toBe('none');
          expect(Number(shadow.styles.zIndex), 'Shadow z-index should be >= 20').toBeGreaterThanOrEqual(20);
          expect(shadow.styles.backgroundImage, 'Shadow should have a gradient background').toContain('gradient');
          console.log(`\n>>> SHADOW POSITION: top=${shadow.rect.top}, bottom=${shadow.rect.bottom}, height=${shadow.rect.height}`);
        }
      } else {
        // No overflow → shadow may or may not be rendered (config-gated); skip the
        // strict assertions, log state for diagnostic value.
        console.log(`\n>>> NO OVERFLOW — shadow render is optional, exists=${shadow.exists}`);
      }

      // 4. Check positioning: shadow bottom should align with scroll body bottom
      if (scrollBody.exists && shadow.exists) {
        const scrollBodyBottom = scrollBody.rect.top + scrollBody.rect.height;
        const shadowBottom = shadow.rect.top + shadow.rect.height;
        console.log(`\n>>> POSITIONING: scroll body bottom=${scrollBodyBottom}, shadow bottom=${shadowBottom}`);
        expect(Math.abs(shadowBottom - scrollBodyBottom),
          `Shadow bottom (${shadowBottom}) should align with scroll body bottom (${scrollBodyBottom})`
        ).toBeLessThan(5);
      }
    });

    test('shadow is visible when content overflows', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      if (!await goToAppsPage(page)) {
        test.skip('Applications page not reachable');
      }

      // Check if scroll body has scrollable content
      const hasOverflow = await page.evaluate((sel: string) => {
        const el = document.querySelector(sel);
        if (!el) return { found: false };
        return {
          found: true,
          scrollHeight: (el as HTMLElement).scrollHeight,
          clientHeight: (el as HTMLElement).clientHeight,
          hasOverflow: (el as HTMLElement).scrollHeight > (el as HTMLElement).clientHeight,
        };
      }, SCROLL_BODY);

      console.log('\n>>> OVERFLOW CHECK:', JSON.stringify(hasOverflow));
      expect(hasOverflow.found, 'scroll body should exist').toBe(true);
      if (!hasOverflow.hasOverflow) {
        test.skip(`Skipped: content does not overflow (scrollHeight=${hasOverflow.scrollHeight} vs clientHeight=${hasOverflow.clientHeight}) — need more items to test shadow`);
      }

      // Shadow should be visible (not hidden by opacity or display)
      const shadowVisible = await page.evaluate((sel: string) => {
        const shadow = document.querySelector(sel);
        if (!shadow) return { shadowFound: false };
        const cs = window.getComputedStyle(shadow);
        return {
          shadowFound: true,
          display: cs.display,
          visibility: cs.visibility,
          opacity: cs.opacity,
          height: cs.height,
          width: cs.width,
        };
      }, SHADOW);

      console.log('\n>>> SHADOW VISIBILITY:', JSON.stringify(shadowVisible));
      expect(shadowVisible.shadowFound, 'Shadow element should exist').toBe(true);
      if (shadowVisible.shadowFound) {
        expect(shadowVisible.display, 'Shadow should not be display:none').not.toBe('none');
        expect(shadowVisible.visibility, 'Shadow should not be hidden').not.toBe('hidden');
        expect(Number(shadowVisible.opacity), 'Shadow opacity should be > 0').toBeGreaterThan(0);
      }
    });

    test('inspect all children of signal-list positioning context', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      if (!await goToAppsPage(page)) {
        test.skip('Applications page not reachable');
      }

      // Enumerate actual DOM children to see what's rendered. The signal-list
      // positioning context normally has: toolbar, [errors banner], scroll body,
      // [scroll fade], pagination bar. The shadow lives at the same flex
      // level as scroll body so it never moves with scrolled content.
      const children = await page.evaluate((sel: string) => {
        const context = document.querySelector(sel);
        if (!context) return { found: false, children: [] };
        return {
          found: true,
          childCount: context.children.length,
          children: Array.from(context.children).map((child, i) => {
            const cs = window.getComputedStyle(child);
            const rect = child.getBoundingClientRect();
            return {
              index: i,
              tagName: child.tagName,
              dataTest: (child as HTMLElement).dataset?.test ?? null,
              className: child.className.substring(0, 120),
              rect: { top: Math.round(rect.top), height: Math.round(rect.height), bottom: Math.round(rect.bottom) },
              position: cs.position,
              display: cs.display,
              overflow: cs.overflow,
              zIndex: cs.zIndex,
              backgroundImage: cs.backgroundImage.substring(0, 80),
            };
          }),
        };
      }, POSITIONING_CONTEXT);

      console.log('\n=== DOM TREE: signal-list positioning context ===');
      console.log(JSON.stringify(children, null, 2));

      expect(children.found, 'signal-list positioning context should exist').toBe(true);
      expect(children.childCount, 'Context should have children').toBeGreaterThan(0);
    });

    test('dump raw HTML of signal-list positioning context', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      if (!await goToAppsPage(page)) {
        test.skip('Applications page not reachable');
      }

      const result = await page.evaluate((sel: string) => {
        const el = document.querySelector(sel);
        if (!el) return { html: 'NOT FOUND', hasOverflow: false };
        // Detect overflow so the gradient assertion below can be conditional —
        // signal-list only renders the scroll-fade when content overflows
        // (`@if (hasOverflow() && totalFilteredResults() > 0)`), so the legacy
        // "gradient always in the HTML" expectation is no longer true.
        const scrollBody = el.querySelector('[data-test="scroll-body"]') as HTMLElement | null;
        const hasOverflow = !!scrollBody && scrollBody.scrollHeight > scrollBody.clientHeight;
        // Get outer HTML but truncate child content to see structure
        const clone = el.cloneNode(true) as HTMLElement;
        // Replace deep content with placeholders so the output stays readable
        clone.querySelectorAll('table, [data-test="scroll-body"] > *').forEach(child => {
          child.innerHTML = '<!-- content -->';
        });
        return { html: clone.outerHTML, hasOverflow };
      }, POSITIONING_CONTEXT);

      console.log('\n=== RAW HTML: signal-list positioning context ===');
      console.log(result.html);
      console.log(`\n>>> HAS OVERFLOW: ${result.hasOverflow}`);
      expect(result.html).not.toBe('NOT FOUND');
      if (result.hasOverflow) {
        expect(result.html).toContain('bg-gradient-to-t');
      }
    });
  });
});
