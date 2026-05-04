import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import type { StServiceBinding } from '../../../services/endpoint-data/stratos-types';

// Signal-native picker for the delete-app "Service Instances" step. Takes a
// list of service credential bindings attached to the app and lets the user
// opt into unbinding any subset alongside the app delete.
//
// Replaces the legacy `app-delete-app-instances` component which was driven
// by ngrx pagination monitors that stopped populating under the signal-native
// migration. Each row renders the service instance name (from the two-step
// backend join) plus a small type badge — managed vs user-provided — so the
// user knows which unbinds are async (managed) vs sync (user-provided).
@Component({
  selector: 'app-service-bindings-picker',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (!bindings() || bindings().length === 0) {
      <p class="text-content-muted py-3">No service instances are currently bound to this application.</p>
    } @else {
      <div class="flex flex-col gap-2 py-2">
        @if (bindings().length > 1) {
          <div class="flex items-center gap-3 text-sm">
            <button
              data-test="bindings-select-all"
              type="button"
              (click)="selectAll()"
              class="text-accent hover:underline">Select all</button>
            <span class="text-content-muted">|</span>
            <button
              data-test="bindings-select-none"
              type="button"
              (click)="selectNone()"
              class="text-accent hover:underline">Clear</button>
            <span class="ml-auto text-content-muted">{{ selectedCount() }} of {{ bindings().length }} selected</span>
          </div>
        }
        <ul class="divide-y divide-content-border border border-content-border rounded">
          @for (binding of bindings(); track binding.guid) {
            <li class="flex items-center gap-3 px-3 py-2">
              <input
                data-test="binding-checkbox"
                type="checkbox"
                [attr.data-guid]="binding.guid"
                [checked]="isSelected(binding.guid)"
                (change)="toggle(binding.guid)" />
              <span class="flex-1 text-content-text truncate" [attr.title]="binding.serviceInstanceName">
                {{ binding.serviceInstanceName }}
              </span>
              @if (binding.serviceInstanceType) {
                <span data-test="binding-type"
                      class="text-xs px-2 py-0.5 rounded bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                  {{ binding.serviceInstanceType }}
                </span>
              }
            </li>
          }
        </ul>
      </div>
    }
  `,
})
export class AppServiceBindingsPickerComponent {
  readonly bindings = input.required<StServiceBinding[]>();
  readonly selectedChange = output<StServiceBinding[]>();

  private readonly selectedGuids = signal<Set<string>>(new Set());

  protected readonly selectedCount = computed(() => this.selectedGuids().size);

  isSelected(guid: string): boolean {
    return this.selectedGuids().has(guid);
  }

  toggle(guid: string): void {
    const next = new Set(this.selectedGuids());
    if (next.has(guid)) {
      next.delete(guid);
    } else {
      next.add(guid);
    }
    this.selectedGuids.set(next);
    this.emit();
  }

  selectAll(): void {
    const all = new Set(this.bindings().map(b => b.guid));
    this.selectedGuids.set(all);
    this.emit();
  }

  selectNone(): void {
    this.selectedGuids.set(new Set());
    this.emit();
  }

  private emit(): void {
    const list = this.bindings();
    const sel = this.selectedGuids();
    this.selectedChange.emit(list.filter(b => sel.has(b.guid)));
  }
}
