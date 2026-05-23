import { effect } from '@preact/signals-core';
import { activeSceneId } from '@/state/scene';

interface SceneInfo { id: string; name: string; archetype: string; }
interface Manifest { version: string; stratosCommit: string; capturedAt: string; scenes: SceneInfo[]; }

export async function mountSceneTabs(host: HTMLElement): Promise<void> {
  host.classList.add('stb-scene-tabs');
  host.setAttribute('role', 'tablist');

  const res = await fetch('/snapshots/v1/manifest.json');
  const manifest = (await res.json()) as Manifest;

  host.innerHTML = '';
  for (const scene of manifest.scenes) {
    const tab = document.createElement('button');
    tab.setAttribute('role', 'tab');
    tab.className = 'stb-scene-tab';
    tab.dataset.sceneId = scene.id;
    tab.textContent = scene.name;
    tab.addEventListener('click', () => { activeSceneId.value = scene.id; });
    host.appendChild(tab);
  }

  effect(() => {
    const id = activeSceneId.value;
    host.querySelectorAll<HTMLElement>('.stb-scene-tab').forEach((tab) => {
      const active = tab.dataset.sceneId === id;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', String(active));
    });
  });
}
