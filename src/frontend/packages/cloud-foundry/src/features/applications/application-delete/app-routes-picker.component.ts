import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import type { StRoute } from '../../../services/endpoint-data/stratos-types';

// Signal-native picker for the delete-app "Routes" step. Takes a list of
// routes currently bound to the app, renders them as a checkbox list, and
// emits the user's selection.
//
// Replaces the legacy `app-delete-app-routes` component which was driven by
// ngrx pagination monitors that stopped populating under the signal-native
// migration. Keeps UI affordances minimal: URL text + a checkbox per row.
// Select-all / select-none buttons kept small — only surfaced when 2+ rows.
@Component({
  selector: 'app-routes-picker',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (!routes() || routes().length === 0) {
      <p class="text-content-muted py-3">No routes are currently mapped to this application.</p>
    } @else {
      <div class="flex flex-col gap-2 py-2">
        @if (routes().length > 1) {
          <div class="flex items-center gap-3 text-sm">
            <button
              data-test="routes-select-all"
              type="button"
              (click)="selectAll()"
              class="text-accent hover:underline">Select all</button>
            <span class="text-content-muted">|</span>
            <button
              data-test="routes-select-none"
              type="button"
              (click)="selectNone()"
              class="text-accent hover:underline">Clear</button>
            <span class="ml-auto text-content-muted">{{ selectedCount() }} of {{ routes().length }} selected</span>
          </div>
        }
        <ul class="divide-y divide-content-border border border-content-border rounded">
          @for (route of routes(); track route.guid) {
            <li class="flex items-center gap-3 px-3 py-2">
              <input
                data-test="route-checkbox"
                type="checkbox"
                [attr.data-guid]="route.guid"
                [checked]="isSelected(route.guid)"
                (change)="toggle(route.guid)" />
              <span class="flex-1 text-content-text truncate" [attr.title]="route.url">{{ route.url }}</span>
            </li>
          }
        </ul>
      </div>
    }
  `,
})
export class AppRoutesPickerComponent {
  readonly routes = input.required<StRoute[]>();
  readonly selectedChange = output<StRoute[]>();

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
    const all = new Set(this.routes().map(r => r.guid));
    this.selectedGuids.set(all);
    this.emit();
  }

  selectNone(): void {
    this.selectedGuids.set(new Set());
    this.emit();
  }

  private emit(): void {
    const rs = this.routes();
    const sel = this.selectedGuids();
    this.selectedChange.emit(rs.filter(r => sel.has(r.guid)));
  }
}
