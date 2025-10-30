/**
 * Monaco Editor Loader
 *
 * Loads Monaco Editor globally using the AMD loader.
 * This replaces the ngx-monaco-editor loader with direct monaco-editor support.
 */

export function loadMonacoEditor(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if Monaco is already loaded
    if ((window as any).monaco) {
      resolve();
      return;
    }

    // Configure Monaco paths
    (window as any).MonacoEnvironment = {
      getWorkerUrl: function (moduleId: string, label: string) {
        if (label === 'json') {
          return '/core/assets/monaco/vs/language/json/json.worker.js';
        }
        if (label === 'css' || label === 'scss' || label === 'less') {
          return '/core/assets/monaco/vs/language/css/css.worker.js';
        }
        if (label === 'html' || label === 'handlebars' || label === 'razor') {
          return '/core/assets/monaco/vs/language/html/html.worker.js';
        }
        if (label === 'typescript' || label === 'javascript') {
          return '/core/assets/monaco/vs/language/typescript/ts.worker.js';
        }
        if (label === 'yaml') {
          return '/core/assets/monaco/vs/language/yaml/yaml.worker.js';
        }
        return '/core/assets/monaco/vs/editor/editor.worker.js';
      }
    };

    // Load Monaco via AMD loader
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = '/core/assets/monaco/vs/loader.js';
    script.onload = () => {
      const req = (window as any).require;
      req.config({ paths: { vs: '/core/assets/monaco/vs' } });

      // Load Monaco editor
      req(['vs/editor/editor.main'], () => {
        resolve();
      });
    };
    script.onerror = () => {
      reject(new Error('Failed to load Monaco Editor'));
    };

    document.head.appendChild(script);
  });
}
