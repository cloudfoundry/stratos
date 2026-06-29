import { describe, it, expect } from 'vitest';
import { harvestElements, lintRouting } from '../../scripts/harvest-login';

const HTML = `
<div stb-snapshot-id="auth.login.page">
  <img stb-snapshot-id="auth.login.logo" />
  <input stb-snapshot-id="auth.login.username" />
</div>`;

describe('harvestElements', () => {
  it('extracts every snapshot-id with tag + 1-based line', () => {
    const els = harvestElements(HTML);
    expect(els).toEqual([
      { snapshotId: 'auth.login.page', tag: 'div', line: 2 },
      { snapshotId: 'auth.login.logo', tag: 'img', line: 3 },
      { snapshotId: 'auth.login.username', tag: 'input', line: 4 },
    ]);
  });

  it('captures stba-role, stba-roledescription and stba-description when present', () => {
    const html = `
<div stb-snapshot-id="shared.confirm-dialog" stba-role="dialog" stba-roledescription="dialog" stba-description="the confirm dialog">
  <span stb-snapshot-id="shared.confirm-dialog.title" stba-role="heading"></span>
</div>`;
    const els = harvestElements(html);
    expect(els[0]).toEqual({
      snapshotId: 'shared.confirm-dialog', tag: 'div', line: 2,
      role: 'dialog', roledescription: 'dialog', description: 'the confirm dialog',
    });
    expect(els[1]).toEqual({ snapshotId: 'shared.confirm-dialog.title', tag: 'span', line: 3, role: 'heading' });
  });
});

describe('lintRouting', () => {
  it('flags phantoms (routing w/o element) and orphans (element w/o routing)', () => {
    const els = harvestElements(HTML);
    const routing = {
      elements: {
        'auth.login.page': { config: 'backgroundColor' },
        'auth.login.logo': { config: 'logos.main' },
        'auth.login.customMessage': { config: 'customMessage' }, // phantom
      },
    };
    const report = lintRouting(els, routing);
    expect(report.phantoms).toEqual(['auth.login.customMessage']);
    expect(report.orphans).toEqual(['auth.login.username']);
  });
});
