import { signal } from '@angular/core';
import { describe, expect, it } from 'vitest';

import { StratosError } from '../../services/endpoint-data/kube-types';
import { errorsForEndpoint, kubeListErrorState } from './kube-list-errors';

const err = (detail: string, affected: string[]): StratosError =>
  ({ scope: 'envelope', code: 'FETCH_ERROR', title: 't', detail, affected });

describe('kubeListErrorState', () => {
  it('has no failed-load state while there are no errors', () => {
    const state = kubeListErrorState('kube-a', signal<StratosError[]>([]).asReadonly());
    expect(state.errorsByCnsi().size).toBe(0);
    expect(state.errorDetail()).toBeUndefined();
  });

  it('names the endpoint and gives the newest failure\'s reason', () => {
    const errors = signal<StratosError[]>([err('first', ['kube-a'])]);
    const state = kubeListErrorState('kube-a', errors.asReadonly());
    expect([...state.errorsByCnsi().keys()]).toEqual(['kube-a']);
    expect(state.errorDetail()).toBe('first');

    errors.update(curr => [...curr, err('401 Unauthorized', ['kube-a'])]);
    expect(state.errorDetail()).toBe('401 Unauthorized');

    errors.set([]);
    expect(state.errorsByCnsi().size).toBe(0);
    expect(state.errorDetail()).toBeUndefined();
  });
});

describe('errorsForEndpoint', () => {
  it('keeps only the errors recorded against the endpoint', () => {
    const errors = signal<StratosError[]>([err('a', ['kube-a']), err('b', ['kube-b']), err('a2', ['kube-a', 'ns:x'])]);
    expect(errorsForEndpoint('kube-a', errors.asReadonly())().map(e => e.detail)).toEqual(['a', 'a2']);
  });
});
