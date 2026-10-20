import { describe, it, expect } from 'vitest';

import { StLastOperation, StServiceInstance } from '../../../services/endpoint-data/stratos-types';
import {
  lastOperationColor,
  lastOperationColumn,
  lastOperationLabel,
  lastOperationReason,
} from './service-instance-columns';

const withOp = (lastOperation?: StLastOperation): StServiceInstance =>
  ({ guid: 'si-1', cnsiGuid: 'cf-1', name: 'db', type: 'managed', tags: [], lastOperation } as StServiceInstance);

describe('lastOperationLabel', () => {
  it('names the operation type with its state', () => {
    expect(lastOperationLabel(withOp({ type: 'create', state: 'in progress' }))).toBe('Create in progress');
    expect(lastOperationLabel(withOp({ type: 'update', state: 'failed' }))).toBe('Update failed');
    expect(lastOperationLabel(withOp({ type: 'delete', state: 'succeeded' }))).toBe('Delete succeeded');
  });

  // CF reports a queued operation as "initial" before it starts.
  it('shows a queued operation as in progress', () => {
    expect(lastOperationLabel(withOp({ type: 'create', state: 'initial' }))).toBe('Create in progress');
  });

  it('shows the bare state when the type is missing', () => {
    expect(lastOperationLabel(withOp({ state: 'succeeded' }))).toBe('succeeded');
  });

  it('shows the type alone when the state is missing', () => {
    expect(lastOperationLabel(withOp({ type: 'create' }))).toBe('Create');
  });

  // The backend omits lastOperation when CF sends none.
  it('is empty when there is no last operation', () => {
    expect(lastOperationLabel(withOp(undefined))).toBe('');
    expect(lastOperationLabel(withOp({}))).toBe('');
  });
});

describe('lastOperationColor', () => {
  it('colours each state', () => {
    expect(lastOperationColor(withOp({ type: 'create', state: 'succeeded' }))).toBe('success');
    expect(lastOperationColor(withOp({ type: 'create', state: 'in progress' }))).toBe('warning');
    expect(lastOperationColor(withOp({ type: 'create', state: 'failed' }))).toBe('danger');
    expect(lastOperationColor(withOp({ type: 'create', state: 'other' }))).toBe('neutral');
  });

  it('colours a queued operation as in progress', () => {
    expect(lastOperationColor(withOp({ type: 'create', state: 'initial' }))).toBe('warning');
  });

  it('is neutral when there is no last operation', () => {
    expect(lastOperationColor(withOp(undefined))).toBe('neutral');
  });
});

describe('lastOperationReason', () => {
  it('gives the description of a failed operation, without markup', () => {
    const si = withOp({ type: 'create', state: 'failed', description: '<p>Quota <b>exceeded</b></p>' });
    expect(lastOperationReason(si)).toBe('Quota exceeded');
  });

  it('is empty unless the operation failed', () => {
    expect(lastOperationReason(withOp({ type: 'create', state: 'succeeded', description: 'done' }))).toBe('');
    expect(lastOperationReason(withOp({ type: 'create', state: 'in progress', description: 'working' }))).toBe('');
  });

  it('is empty when a failure has no description', () => {
    expect(lastOperationReason(withOp({ type: 'create', state: 'failed' }))).toBe('');
    expect(lastOperationReason(withOp(undefined))).toBe('');
  });
});

describe('lastOperationColumn', () => {
  const col = lastOperationColumn();

  it('is the Last Operation pill', () => {
    expect(col.header).toBe('Last Operation');
    expect(col.key).toBe('lastOp');
    expect(col.kind).toBe('pill');
    expect(col.widthHint).toBe('10rem');
  });

  it('renders, sorts and colours by the operation', () => {
    const si = withOp({ type: 'update', state: 'in progress' });
    expect(col.render(si)).toBe('Update in progress');
    expect((col.sortField as (r: StServiceInstance) => unknown)(si)).toBe('Update in progress');
    expect(col.pillColor!(si)).toBe('warning');
  });

  it('adds the reason for a failure to the hover text', () => {
    const si = withOp({ type: 'update', state: 'failed', description: 'Broker <i>timed out</i>' });
    expect(col.tooltip!(si)).toBe('Update failed — Broker timed out');
  });

  it('hovers with the label alone when there is no reason', () => {
    expect(col.tooltip!(withOp({ type: 'update', state: 'succeeded', description: 'ok' }))).toBe('Update succeeded');
  });
});
