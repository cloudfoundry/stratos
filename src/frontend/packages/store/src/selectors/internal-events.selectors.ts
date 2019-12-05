import { compose, createSelector } from '@ngrx/store';

import { InternalEventSeverity, InternalEventsState } from '../types/internal-events.types';
import { InternalAppState } from '../app-state';

export const internalEventStateSelector = (state: InternalAppState) => state.internalEvents;

export const internalEventTypeSelector = (type: string) => compose(
  (state: InternalEventsState) => state.types[type] || {},
  internalEventStateSelector
);

export const internalEventSubjectSelector = (type: string, subjectId: string) => compose(
  state => state[subjectId] || [],
  internalEventTypeSelector(type)
);

export const internalEventServeritySelector = (type: string, subjectId: string, serverity: InternalEventSeverity) => createSelector(
  internalEventSubjectSelector(type, subjectId),
  state => state.filter(event => event.severity === serverity),
);

export const internalEventCodeSelector = (type: string, subjectId: string, codes: (string | number)[]) => createSelector(
  internalEventSubjectSelector(type, subjectId),
  state => state.filter(event => codes.includes(event.eventCode)),
);

export const internalEventTimeStampSelector = (type: string, subjectId: string, thresholdTimestamp: number) => createSelector(
  internalEventSubjectSelector(type, subjectId),
  state => state.filter(event => event.timestamp > thresholdTimestamp),
);



