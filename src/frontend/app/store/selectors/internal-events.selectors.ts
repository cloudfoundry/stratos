import { compose, createSelector } from '@ngrx/store';

import { InternalEventServerity, InternalEventsState, InternalEventSubjectState } from '../types/internal-events.types';
import { AppState } from './../app-state';

export const internalEventStateSelector = (state: AppState) => state.internalEvents;

export const internalEventTypeSelector = (type: string) => compose(
    (state: InternalEventsState) => state.types[type] || {},
    internalEventStateSelector
);

export const internalEventSubjectSelector = (type: string, subjectId: string) => compose(
    state => state[subjectId] || [],
    internalEventTypeSelector(type)
);

export const internalEventSubjectsSelector = (type: string, subjectIds: string[]) => compose(
    state => {
        const events = {} as InternalEventSubjectState;
        subjectIds.forEach(id => {
            if (state[id]) {
                events[id] = state[id];
            }
        });
        return events;
    },
    internalEventTypeSelector(type)
);

export const internalEventServeritySelector = (type: string, subjectId: string, serverity: InternalEventServerity) => createSelector(
    internalEventSubjectSelector(type, subjectId),
    state => state.filter(event => event.serverity === serverity),
);

export const internalEventCodeSelector = (type: string, subjectId: string, codes: (string | number)[]) => createSelector(
    internalEventSubjectSelector(type, subjectId),
    state => state.filter(event => codes.includes(event.eventCode)),
);

export const internalEventTimeStampSelector = (type: string, subjectId: string, thresholdTimestamp: number) => createSelector(
    internalEventSubjectSelector(type, subjectId),
    state => state.filter(event => event.timestamp > thresholdTimestamp),
);



