import { mountEditorPane } from '@/ui/editor-pane';
import { mountTokenSidebar } from '@/ui/token-sidebar';
import { mountElementTree } from '@/ui/element-tree';
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
import { openLeverEditor } from '@/ui/lever-editor';
import { applyEdit, buildVisibilityCompanion } from '@/ui/element-edit';
import { effect } from '@preact/signals-core';
import { loadBuiltInPreset } from '@/state/presets';
import { restoreSession, startAutoSave } from '@/state/persistence';

interface ColorFormatState { value: 'hex' | 'rgb' | 'oklch'; }
const colorFormat: ColorFormatState = { value: 'hex' };

function setColumnStyles(left: HTMLElement, right: HTMLElement): void {
  left.style.display = 'flex';
  left.style.flexDirection = 'row';
  left.style.flex = '0 0 50%';
  left.style.minWidth = '500px';
  right.style.flex = '1';
  right.style.position = 'relative';
}

async function main() {
  const app = document.getElementById('app')!;
  app.innerHTML = `
    <div class="stb-scene-tabs-host"></div>
    <div class="stb-actions-host" style="padding:0.5rem;border-bottom:1px solid #ddd"></div>
    <div class="stb-statusbar-host"></div>
    <div class="stb-main" style="display:flex;flex:1;min-height:0;overflow:hidden">
      <div class="stb-left" style="display:flex;min-height:0">
        <div class="stb-sidebar-host" style="width:280px;overflow:auto"></div>
        <div class="stb-editor-host" style="flex:1"></div>
      </div>
      <div class="stb-preview-host"></div>
    </div>
  `;

  setColumnStyles(
    app.querySelector('.stb-left') as HTMLElement,
    app.querySelector('.stb-preview-host') as HTMLElement,
  );

  const restored = restoreSession();
  if (!restored) await loadBuiltInPreset('stratos-default');
  startAutoSave();

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

  // The sidebar flips between the meaningful element tree and the raw token list.
  sidebarHost.innerHTML = `
    <div class="stb-view-toggle">
      <button class="stb-view-btn active" data-view="tree">Tree</button>
      <button class="stb-view-btn" data-view="tokens">Tokens</button>
    </div>
    <div class="stb-view stb-view-tree"></div>
    <div class="stb-view stb-view-tokens" hidden></div>
  `;
  const treeView = sidebarHost.querySelector('.stb-view-tree') as HTMLElement;
  const tokensView = sidebarHost.querySelector('.stb-view-tokens') as HTMLElement;
  sidebarHost.querySelectorAll<HTMLButtonElement>('.stb-view-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view;
      sidebarHost.querySelectorAll('.stb-view-btn').forEach((b) => b.classList.toggle('active', b === btn));
      treeView.hidden = view !== 'tree';
      tokensView.hidden = view !== 'tokens';
    });
  });

  // keep routing in sync with the active scene so applyEdit can re-project
  let routing: import('@/projection/projector').RoutingMap = { elements: {} };
  effect(() => {
    const scene = activeSceneId.value;
    fetch(`/snapshots/v1/${scene}/routing.json`).then((r) => r.json()).then((j) => { routing = j; });
  });

  function selectElement(snapshotId: string): void {
    const node = nodeFor(snapshotId);
    if (!node) return;
    // anchor the editor to the element's tree row (not below the preview)
    const row = treeView.querySelector<HTMLElement>(`.stb-tree-row[data-snapshot-id="${snapshotId}"]`);
    const anchor = row ?? (app.querySelector('.stb-preview-host') as HTMLElement);
    const companion = buildVisibilityCompanion(snapshotId, node.visibility);
    openLeverEditor({
      anchor,
      snapshotId,
      value: node.value,
      onChange: (next) => applyEdit(snapshotId, next, routing),
      ...companion,
    });
  }

  const preview = createPreviewPane({
    onElementSelected: (_selector, tokens, snapshotId) => {
      if (tokens.length) { wiring.scrollSidebarToToken(sidebarHost, tokens[0]!); wiring.flashSidebarRows(sidebarHost, tokens); }
      if (snapshotId) selectElement(snapshotId);
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
