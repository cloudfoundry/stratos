import { mountEditorPane } from '@/ui/editor-pane';
import { mountTokenSidebar } from '@/ui/token-sidebar';
import { mountSceneTabs } from '@/ui/scene-tabs';
import { createPreviewPane } from '@/ui/preview-pane';
import { openColorPicker } from '@/ui/color-picker';
import { setRootValue, setDarkValue, effectiveValue } from '@/state/tokens';
import { previewDark } from '@/state/scene';

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
    <div class="stb-main" style="display:flex;flex:1;overflow:hidden">
      <div class="stb-left" style="display:flex">
        <div class="stb-sidebar-host" style="width:280px;overflow:auto"></div>
        <div class="stb-editor-host" style="flex:1"></div>
      </div>
      <div class="stb-preview-host"></div>
    </div>
    <div class="stb-statusbar-host"></div>
  `;

  setColumnStyles(
    app.querySelector('.stb-left') as HTMLElement,
    app.querySelector('.stb-preview-host') as HTMLElement,
  );

  await mountSceneTabs(app.querySelector('.stb-scene-tabs-host') as HTMLElement);

  const sidebarHost = app.querySelector('.stb-sidebar-host') as HTMLElement;
  mountTokenSidebar(sidebarHost, {
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
  });

  mountEditorPane(app.querySelector('.stb-editor-host') as HTMLElement);

  const preview = createPreviewPane();
  preview.mount(app.querySelector('.stb-preview-host') as HTMLElement);
}

main();
