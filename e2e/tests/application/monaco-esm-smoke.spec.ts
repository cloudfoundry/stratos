import { test, expect } from '../../fixtures/test-base';
import { ApplicationPageSummary } from '../../pages/application/application.page';
import { ListTableComponent } from '../../components/list.component';

/**
 * Runtime smoke for the ESM-bundled Monaco editor (#5561): the editor and
 * its language workers now arrive as hashed lazy chunks through the Angular
 * build instead of the copied AMD vs/ asset tree. This proves, against the
 * running app:
 *  - the dynamic import boots the editor in a real dialog,
 *  - typing round-trips through the editor (worker path alive),
 *  - the yaml worker (monaco-yaml) produces schema/syntax diagnostics.
 */
test.describe('Monaco ESM smoke', () => {
  test('variable edit dialog boots the bundled editor; yaml worker validates', async ({ withTestApp }) => {
    const { page, testApp, cfApi } = withTestApp;

    // Seed a variable so the list has an editable row.
    await cfApi.updateAppEnvironment(testApp.app.guid, { E2E_MONACO_VAR: 'before' });

    const appSummary = new ApplicationPageSummary(page, testApp.cfGuid, testApp.app.guid);
    await appSummary.navigateTo();
    await appSummary.goToVariablesTab();

    const list = new ListTableComponent(page, page.locator('app-variables-tab app-signal-list'));
    const row = await list.findRowByCellContent('E2E_MONACO_VAR');
    const menu = await list.openRowActionMenuByRow(row);
    await menu.getItem('Edit').click();

    // The editor chunk loads lazily on first use — a rendered editor proves
    // the ESM dynamic import replaced the AMD loader.
    const editor = page.locator('app-monaco-editor .monaco-editor');
    await expect(editor).toBeVisible({ timeout: 15000 });

    // Round-trip a keystroke through the editor surface.
    await editor.click();
    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.type('esm-live');
    await expect(editor).toContainText('esm-live');

    // Exercise the yaml worker without a k8s surface: an invalid yaml model
    // must produce diagnostics markers from monaco-yaml.
    const markerCount = await page.evaluate(async () => {
      const monaco = (window as { monaco?: any }).monaco;
      const model = monaco.editor.createModel('foo: [unclosed', 'yaml');
      // Poll this model's own markers — onDidChangeMarkers fires for ANY
      // model (the dialog editor is still open), so waiting on the event
      // races unrelated marker traffic and reads 0 intermittently.
      const deadline = Date.now() + 10000;
      let markers = [];
      while (Date.now() < deadline) {
        markers = monaco.editor.getModelMarkers({ resource: model.uri });
        if (markers.length > 0) { break; }
        await new Promise((r) => setTimeout(r, 250));
      }
      model.dispose();
      return markers.length;
    });
    expect(markerCount).toBeGreaterThan(0);
  });
});
