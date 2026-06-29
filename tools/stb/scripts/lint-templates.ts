import { readFileSync } from 'node:fs';
import { harvestElements } from './harvest-login.ts';

// Drift guard: every stb-snapshot-id carried by a scene's LIVE Stratos
// template(s) must also appear in that scene's captured snapshot
// (public/snapshots/v1/<scene>/index.html). If a live template renames or adds
// an instrumented id and the snapshot isn't updated, a real branding hook has
// drifted out of the model — this catches it. The reverse (snapshot ids with no
// live template, e.g. login's *-label nodes) is fine and not flagged.
//
// Only scenes whose snapshot statically corresponds to live template(s) are
// listed. login is covered by its own routing drift check (lint:harvest), so it
// is not duplicated here. app-list is intentionally absent: its snapshot is a
// mock (three fabricated app-card instances rendered by *ngFor at runtime — no
// static per-instance ids possible) and its live component is not yet
// meaningfully instrumented, so there is nothing clean to lint until
// real-component instrumentation (a separate effort) lands.
const FRONTEND = '../../src/frontend/packages';
const SCENE_TEMPLATES: Record<string, string[]> = {
  shared: [
    `${FRONTEND}/core/src/shared/components/stepper/steppers/steppers.component.html`,
    `${FRONTEND}/core/src/shared/components/dialog-confirm/dialog-confirm.component.html`,
  ],
};

let drift = 0;
for (const [scene, templates] of Object.entries(SCENE_TEMPLATES)) {
  const snapshot = readFileSync(`public/snapshots/v1/${scene}/index.html`, 'utf8');
  for (const tpl of templates) {
    for (const el of harvestElements(readFileSync(tpl, 'utf8'))) {
      const present = snapshot.includes(`stb-snapshot-id="${el.snapshotId}"`);
      if (!present) drift++;
      console.log(`  ${present ? 'ok   ' : 'DRIFT'}  ${scene}\t${el.snapshotId}`);
    }
  }
}
console.log(`\n${drift} drift issue(s) (live template id missing from snapshot).`);
process.exit(drift > 0 ? 1 : 0);
