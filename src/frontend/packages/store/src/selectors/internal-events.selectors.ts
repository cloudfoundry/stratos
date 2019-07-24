import { compose, createSelector } from '@ngrx/store';

import { CFAppState } from '../../../cloud-foundry/src/cf-app-state';
import { InternalEventSeverity, InternalEventsState } from '../types/internal-events.types';


// TODO: Confirm - should this be CFAppState? RC CI search for references
export const internalEventStateSelector = (state: CFAppState) => state.internalEvents;

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



