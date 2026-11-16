import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

// Abbreviations that labels in the console use, with their expansions.
const EXPANSIONS: Readonly<Record<string, string>> = {
  AKS: 'Azure Kubernetes Service',
  CF: 'Cloud Foundry',
  EKS: 'Elastic Kubernetes Service',
  GUID: 'globally unique identifier',
  SSH: 'Secure Shell',
  URL: 'web address',
};

// A label's text with each known abbreviation in <abbr title>, so the
// expansion is on the page (WCAG 3.1.4). Other text is shown as it is.
@Component({
  selector: 'app-abbr-text',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@for (part of parts(); track $index) {@if (part.title) {<abbr [title]="part.title">{{ part.text }}</abbr>} @else {{{ part.text }}}}`,
})
export class AbbrTextComponent {
  readonly text = input<string | number | null | undefined>('');

  protected readonly parts = computed(() =>
    String(this.text() ?? '').split(/\b([A-Z]{2,4})\b/).filter(Boolean)
      .map(text => ({ text, title: EXPANSIONS[text] })));
}
