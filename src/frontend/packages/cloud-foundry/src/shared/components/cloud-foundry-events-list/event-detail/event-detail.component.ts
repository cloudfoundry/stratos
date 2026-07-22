import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { MAT_DIALOG_DATA, TailwindDialogRef } from '@stratosui/core';

// Details dialog for a CF audit event (#5389). Opened from the clickable event
// Type in the events list; shows the event's `data` metadata as formatted JSON,
// titled with the event type. The audit-event `data` blob arrives as a JSON
// string on StAuditEvent.data (backend toStAuditEvent marshals the v3 Data).

/** Parse the audit-event `data` JSON string into an object. Never throws. */
export function parseEventData(data: string | null | undefined): Record<string, unknown> {
  if (!data) return {};
  try {
    const parsed = JSON.parse(data);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    // Non-object payloads (array / scalar) still deserve a viewer; wrap them.
    return { value: parsed };
  } catch {
    return {};
  }
}

/** True when an event carries metadata worth a details popup (data !== {}). */
export function hasEventMetadata(data: string | null | undefined): boolean {
  return Object.keys(parseEventData(data)).length > 0;
}

@Component({
  selector: 'app-event-detail',
  templateUrl: './event-detail.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class EventDetailComponent {
  private readonly dialogRef = inject<TailwindDialogRef<EventDetailComponent>>(TailwindDialogRef);
  readonly data = inject<{ type: string; metadata: Record<string, unknown> }>(MAT_DIALOG_DATA);

  close(): void {
    this.dialogRef.close();
  }
}
