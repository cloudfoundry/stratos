import { mountEditorPane } from '@/ui/editor-pane';
import { mountTokenSidebar } from '@/ui/token-sidebar';
import { mountElementTree } from '@/ui/element-tree';
import { mountElementColumns } from '@/ui/element-columns';
import { mountSceneTabs } from '@/ui/scene-tabs';
import { createPreviewPane } from '@/ui/preview-pane';
import { openColorPicker } from '@/ui/color-picker';
import { createHighlightWiring } from '@/ui/highlight';
import { mountLightDarkActions } from '@/ui/light-dark-actions';
import { mountPresetMenu } from '@/ui/preset-menu';
import { openExportDialog } from '@/ui/export-dialog';
import { mountStatusBar } from '@/ui/status-bar';
import { mountAssetManager } from '@/ui/asset-manager';
import { setRootValue, setDarkValue, effectiveValue } from '@/state/tokens';
import { previewDark, activeSceneId } from '@/state/scene';
import { nodeFor } from '@/state/branding';
import { loadGlobalModel } from '@/state/global-branding';
import { openLeverEditor } from '@/ui/lever-editor';
import { applyEdit, buildVisibilityCompanion } from '@/ui/element-edit';
import { effect } from '@preact/signals-core';
import { loadBuiltInPreset } from '@/state/presets';
import { restoreSession, startAutoSave } from '@/state/persistence';

interface ColorFormatState { value: 'hex' | 'rgb' | 'oklch'; }
const colorFormat: ColorFormatState = { value: 'hex' };

async function main() {
  const app = document.getElementById('app')!;
  app.innerHTML = `
    <div class="stb-scene-tabs-host"></div>
    <div class="stb-topbar">
      <div class="stb-actions-host"></div>
      <div class="stb-statusbar-host"></div>
    </div>
    <div class="stb-nav-band">
      <div class="stb-sidebar-host"></div>
      <div class="stb-editor-host"></div>
    </div>
    <div class="stb-preview-host"></div>
  `;

  const restored = restoreSession();
  if (!restored) await loadBuiltInPreset('stratos-default');
  startAutoSave();

  // Global navigator aggregate — every scene's branding-model merged into one
  // drilldown (R3). Independent of the active-scene model the preview/editor use.
  void loadGlobalModel();

  await mountSceneTabs(app.querySelector('.stb-scene-tabs-host') as HTMLElement);
  const actionsHost = app.querySelector('.stb-actions-host') as HTMLElement;
  mountLightDarkActions(actionsHost);
  const presetsHost = document.createElement('div');
  presetsHost.className = 'stb-presets-host';
  actionsHost.appendChild(presetsHost);
  mountPresetMenu(presetsHost);

  const exportBtn = document.createElement('button');
  exportBtn.id = 'stb-export-btn';
  exportBtn.textContent = 'Export…';
  exportBtn.addEventListener('click', () => openExportDialog());
  actionsHost.appendChild(exportBtn);

  const assetHost = document.createElement('div');
  assetHost.className = 'stb-asset-host';
  actionsHost.appendChild(assetHost);
  mountAssetManager(assetHost);

  const wiring = createHighlightWiring();
  const sidebarHost = app.querySelector('.stb-sidebar-host') as HTMLElement;

  // The sidebar flips between the meaningful element tree, the Miller-column
  // navigator (R3 prototype), and the raw token list.
  sidebarHost.innerHTML = `
    <div class="stb-view-toggle">
      <button class="stb-view-btn active" data-view="tree">Tree</button>
      <button class="stb-view-btn" data-view="columns">Columns</button>
      <button class="stb-view-btn" data-view="tokens">Tokens</button>
    </div>
    <div class="stb-view stb-view-tree" data-view="tree"></div>
    <div class="stb-view stb-view-columns" data-view="columns" hidden></div>
    <div class="stb-view stb-view-tokens" data-view="tokens" hidden></div>
  `;
  const treeView = sidebarHost.querySelector('.stb-view-tree') as HTMLElement;
  const columnsView = sidebarHost.querySelector('.stb-view-columns') as HTMLElement;
  const tokensView = sidebarHost.querySelector('.stb-view-tokens') as HTMLElement;
  sidebarHost.querySelectorAll<HTMLButtonElement>('.stb-view-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view;
      sidebarHost.querySelectorAll('.stb-view-btn').forEach((b) => b.classList.toggle('active', b === btn));
      sidebarHost.querySelectorAll<HTMLElement>('.stb-view').forEach((v) => { v.hidden = v.dataset.view !== view; });
    });
  });

  // keep routing in sync with the active scene so applyEdit can re-project
  let routing: import('@/projection/projector').RoutingMap = { elements: {} };
  effect(() => {
    const scene = activeSceneId.value;
    // A scene may ship no routing.json (e.g. app-list); guard so the dev-server
    // HTML fallback doesn't throw a JSON parse error and leave stale routing.
    fetch(`/snapshots/v1/${scene}/routing.json`)
      .then(async (r) => {
        const ct = r.headers.get('content-type') ?? '';
        routing = r.ok && ct.includes('json') ? await r.json() : { elements: {} };
      })
      .catch(() => { routing = { elements: {} }; });
  });

  // Anchor the editor to a VISIBLE row in whichever navigator is showing. A
  // hidden view's rows report a 0,0 rect, which would dump the editor in the
  // top-left corner — so skip any zero-size candidate.
  function visibleAnchor(snapshotId: string): HTMLElement {
    const candidates: (HTMLElement | null)[] = [
      [...columnsView.querySelectorAll<HTMLElement>('.stb-col-row.active')].pop() ?? null,
      treeView.querySelector<HTMLElement>(`.stb-tree-row[data-snapshot-id="${snapshotId}"]`),
    ];
    for (const el of candidates) {
      if (el) { const r = el.getBoundingClientRect(); if (r.width || r.height) return el; }
    }
    return app.querySelector('.stb-preview-host') as HTMLElement;
  }

  function selectElement(snapshotId: string): void {
    const node = nodeFor(snapshotId);
    if (!node) return;
    const anchor = visibleAnchor(snapshotId);
    const companion = buildVisibilityCompanion(snapshotId, node.visibility);
    openLeverEditor({
      anchor,
      snapshotId,
      value: node.value,
      onChange: (next) => applyEdit(snapshotId, next, routing),
      ...companion,
    });
  }

  // forward-declared so onElementSelected can drive the columns (bidirectional select)
  let columnsApi: import('@/ui/element-columns').ElementColumnsApi | null = null;

  const preview = createPreviewPane({
    onElementSelected: (_selector, tokens, snapshotId) => {
      if (tokens.length) { wiring.scrollSidebarToToken(sidebarHost, tokens[0]!); wiring.flashSidebarRows(sidebarHost, tokens); }
      // jump the columns FIRST so the active row exists, then anchor the editor to it
      if (snapshotId) { columnsApi?.jumpTo(snapshotId); selectElement(snapshotId); } // render → columns (R1/§2.6)
    },
  });
  preview.mount(app.querySelector('.stb-preview-host') as HTMLElement);

  const leverToggle = document.createElement('label');
  leverToggle.className = 'stb-lever-toggle-action';
  leverToggle.style.marginLeft = '0.5rem';
  const leverCb = document.createElement('input');
  leverCb.type = 'checkbox';
  leverCb.addEventListener('change', () => preview.showLevers(leverCb.checked));
  leverToggle.appendChild(leverCb);
  leverToggle.append(' Show editable regions');
  actionsHost.appendChild(leverToggle);

  mountElementTree(treeView, {
    onHover: (id) => preview.highlightElement(id),
    onSelect: (id) => selectElement(id),
  });

  columnsApi = mountElementColumns(columnsView, {
    // hover only highlights when the node belongs to the scene on screen
    onHover: (id, scene) => { if (id && scene === activeSceneId.value) preview.highlightElement(id); else preview.highlightElement(null); },
    onSelect: (id, scene) => {
      // global navigator: switch the preview to the node's scene, then edit
      if (scene !== activeSceneId.value) { activeSceneId.value = scene; }
      selectElement(id);
    },
  });

  mountTokenSidebar(tokensView, {
    onSwatchClick: (token) => {
      const dark = previewDark.value;
      const current = effectiveValue(token.name, dark);
      const anchor = sidebarHost.querySelector<HTMLElement>(
        `.stb-swatch[data-token="${token.name}"]`,
      );
      if (!anchor) return;
      openColorPicker({
        anchor,
        initial: current,
        format: colorFormat.value,
        onChange: (value) => {
          if (dark) setDarkValue(token.name, value);
          else setRootValue(token.name, value);
        },
      });
    },
    onHover: (tokenName) => preview.highlightToken(tokenName),
  });

  mountEditorPane(app.querySelector('.stb-editor-host') as HTMLElement);

  mountStatusBar(app.querySelector('.stb-statusbar-host') as HTMLElement, {
    onFormatChange: (fmt) => { colorFormat.value = fmt; },
  });
}

main();
