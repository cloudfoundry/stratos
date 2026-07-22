import { listSavedPresets, loadBuiltInPreset, loadSavedPreset, savePreset } from '@/state/presets';

export interface PresetMenuOptions { onPresetChange?: () => void; }

export function mountPresetMenu(host: HTMLElement, opts: PresetMenuOptions = {}): void {
  host.classList.add('stb-preset-menu');
  render();

  function render() {
    const saved = listSavedPresets();
    host.innerHTML = `
      <label>Preset:
        <select id="stb-preset-select">
          <option value="builtin:stratos-default">Stratos default</option>
          ${saved.map((p) => `<option value="saved:${escapeHtml(p.id)}">${escapeHtml(p.name)}</option>`).join('')}
        </select>
      </label>
      <button id="stb-save-as">Save as…</button>
    `;

    host.querySelector<HTMLSelectElement>('#stb-preset-select')!.addEventListener('change', async (e) => {
      if (!confirm('Replace current edits with the selected preset?')) {
        render();
        return;
      }
      const value = (e.target as HTMLSelectElement).value;
      const [kind, id] = value.split(':') as ['builtin' | 'saved', string];
      if (kind === 'builtin') await loadBuiltInPreset(id);
      else loadSavedPreset(id);
      opts.onPresetChange?.();
    });

    host.querySelector('#stb-save-as')!.addEventListener('click', () => {
      const name = prompt('Preset name:');
      if (!name) return;
      const id = name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
      savePreset({ id, name, description: '' });
      render();
    });
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}
