import { SignalListColumn, SignalListPillColor } from '@stratosui/core';
import { ErrorPiece, htmlToPieces, piecesToText } from '@stratosui/store';

import { StLastOperation, StServiceInstance } from '../../../services/endpoint-data/stratos-types';

// The backend omits lastOperation when CF sends none, whatever the
// StServiceInstance type says, so every reader here allows it to be missing.
type WithLastOperation = { lastOperation?: StLastOperation };

// CF reports a queued operation as "initial" before it starts; to the user
// it is already in progress.
const shownState = (si: WithLastOperation): string => {
  const state = si.lastOperation?.state ?? '';
  return state.toLowerCase() === 'initial' ? 'in progress' : state;
};

const lastOperationState = (si: WithLastOperation): string =>
  shownState(si).toLowerCase();

// "Create in progress", "Update failed": the state alone does not say which
// operation is running or went wrong.
export function lastOperationLabel(si: WithLastOperation): string {
  const type = si.lastOperation?.type ?? '';
  const state = shownState(si);
  return [type.charAt(0).toUpperCase() + type.slice(1), state].filter(Boolean).join(' ');
}

export function lastOperationColor(si: WithLastOperation): SignalListPillColor {
  const state = lastOperationState(si);
  if (state === 'succeeded') return 'success';
  if (state === 'in progress') return 'warning';
  if (state === 'failed') return 'danger';
  return 'neutral';
}

// The broker's reason for a failure, as styled pieces. Its description can
// carry HTML (a whole error page keeps its heading), and on other states it
// is progress chatter rather than something to act on.
export function lastOperationReasonPieces(si: WithLastOperation): ErrorPiece[] {
  if (lastOperationState(si) !== 'failed') return [];
  return htmlToPieces(si.lastOperation?.description ?? '');
}

// The broker's reason for a failure, as text.
export function lastOperationReason(si: WithLastOperation): string {
  return piecesToText(lastOperationReasonPieces(si));
}

// The Last Operation pill shared by every service-instance list. A failure's
// reason goes in the hover text so the row stays one line.
export function lastOperationColumn(): SignalListColumn<StServiceInstance> {
  return {
    header: 'Last Operation', key: 'lastOp', sortField: lastOperationLabel,
    kind: 'pill',
    pillColor: lastOperationColor,
    render: lastOperationLabel,
    tooltip: (si: StServiceInstance) => {
      const reason = lastOperationReason(si);
      return reason ? `${lastOperationLabel(si)} — ${reason}` : lastOperationLabel(si);
    },
    widthHint: '10rem',
  };
}
