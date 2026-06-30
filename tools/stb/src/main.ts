import { mountEditorPane } from '@/ui/editor-pane';
import { mountTokenSidebar } from '@/ui/token-sidebar';
import { mountElementTree } from '@/ui/element-tree';
import { mountElementColumns } from '@/ui/element-columns';
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
import { nodeFor, loadBrandingModel, setNodeScopedBlock } from '@/state/branding';
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
      <button class="stb-view-btn" data-view="tree">Tree</button>
      <button class="stb-view-btn active" data-view="columns">Columns</button>
      <button class="stb-view-btn" data-view="tokens">Tokens</button>
    </div>
    <div class="stb-view stb-view-tree" data-view="tree" hidden></div>
    <div class="stb-view stb-view-columns" data-view="columns"></div>
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

  // The editor opens as one consistent popover centred in the left-of-preview
  // gutter, independent of which view selected the node (design §2.4a (A)).
  const previewHost = app.querySelector('.stb-preview-host') as HTMLElement;

  function selectElement(snapshotId: string): void {
    const node = nodeFor(snapshotId);
    if (!node) return;
    const companion = buildVisibilityCompanion(snapshotId, node.visibility);
    openLeverEditor({
      previewHost,
      snapshotId,
      value: node.value,
      onChange: (next) => applyEdit(snapshotId, next, routing),
      scopedBlock: node.scopedBlock,
      onScopedBlockChange: (css) => setNodeScopedBlock(snapshotId, css),
      ...companion,
    });
  }

  // Cross-scene select from a global navigator (columns or tree): switch the
  // previewed scene and await its model so the editor opens against the right
  // scene on the first click, not the previous scene's stale model.
  async function selectFromNav(snapshotId: string, scene: string): Promise<void> {
    if (scene !== activeSceneId.value) { activeSceneId.value = scene; }
    await loadBrandingModel(scene);
    selectElement(snapshotId);
  }

  // forward-declared so onElementSelected can drive the columns (bidirectional select)
  let columnsApi: import('@/ui/element-columns').ElementColumnsApi | null = null;

  const preview = createPreviewPane({
    onElementSelected: (_selector, tokens, snapshotId) => {
      if (tokens.length) { wiring.scrollSidebarToToken(sidebarHost, tokens[0]!); wiring.flashSidebarRows(sidebarHost, tokens); }
      // jump the columns so the selection is reflected there (bidirectional), then edit
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

  // hover only highlights when the node belongs to the scene on screen
  const navHover = (id: string | null, scene: string | null) => {
    if (id && scene === activeSceneId.value) preview.highlightElement(id);
    else preview.highlightElement(null);
  };

  mountElementTree(treeView, {
    onHover: navHover,
    onSelect: (id, scene) => { void selectFromNav(id, scene); },
  });

  columnsApi = mountElementColumns(columnsView, {
    onHover: navHover,
    onSelect: (id, scene) => { void selectFromNav(id, scene); },
  });

  mountTokenSidebar(tokensView, {
    onSwatchClick: (token) => {
      const dark = previewDark.value;
      const current = effectiveValue(token.name, dark);
      openColorPicker({
        previewHost,
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
