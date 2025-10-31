/**
 * Example tests demonstrating selector usage in zoneless mode
 *
 * These tests show how to:
 * 1. Configure TestBed for zoneless change detection
 * 2. Test selectors with MockStore
 * 3. Test signal-based selector consumption
 * 4. Verify selector memoization behavior
 */

import { Component, Signal, computed } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideExperimentalZonelessChangeDetection } from '@angular/core';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { InternalAppState } from '../app-state';
import { EndpointModel } from '../types/endpoint.types';
import { selectAsSignal } from '../helpers/signal-selectors';
import {
  endpointEntitiesSelector,
  endpointsEntityRequestDataSelector,
  connectedEndpointsSelector
} from './endpoint.selectors';

describe('Selectors in Zoneless Mode', () => {
  let store: MockStore;
  let fixture: ComponentFixture<any>;

  const mockEndpoint: EndpointModel = {
    guid: 'endpoint-1',
    name: 'Test Endpoint',
    cnsi_type: 'cf',
    api_endpoint: {
      Host: 'api.test.com',
      Scheme: 'https'
    },
    connectionStatus: 'connected',
    user: null,
    metadata: {},
    sub_type: '',
    endpoint_metadata: {}
  };

  const initialState: Partial<InternalAppState> = {
    requestData: {
      endpoint: {
        'endpoint-1': mockEndpoint
      }
    }
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        // CRITICAL: Enable zoneless change detection
        provideExperimentalZonelessChangeDetection(),
        provideMockStore({ initialState })
      ]
    });

    store = TestBed.inject(MockStore);
  });

  describe('Direct Selector Usage', () => {
    it('should select endpoint entities from state', () => {
      const result = store.selectSnapshot(endpointEntitiesSelector);
      expect(result).toBeDefined();
      expect(result['endpoint-1']).toEqual(mockEndpoint);
    });

    it('should select specific endpoint by guid', () => {
      const selector = endpointsEntityRequestDataSelector('endpoint-1');
      const result = store.selectSnapshot(selector);
      expect(result).toEqual(mockEndpoint);
    });

    it('should filter connected endpoints', () => {
      const selector = connectedEndpointsSelector();
      const result = store.selectSnapshot(selector);
      expect(result['endpoint-1']).toEqual(mockEndpoint);
    });
  });

  describe('Signal-Based Selector Consumption', () => {
    @Component({
      selector: 'test-component',
      template: `
        <div>
          @if (endpoint(); as ep) {
            <span class="endpoint-name">{{ ep.name }}</span>
          }
        </div>
      `,
      standalone: true
    })
    class TestComponent {
      // Convert selector to signal for zoneless mode
      endpoint: Signal<EndpointModel | undefined> = selectAsSignal(
        endpointsEntityRequestDataSelector('endpoint-1')
      );
    }

    beforeEach(() => {
      fixture = TestBed.createComponent(TestComponent);
    });

    it('should render endpoint data from signal', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.endpoint-name')?.textContent).toBe('Test Endpoint');
    });

    it('should update when state changes', () => {
      fixture.detectChanges();
      const component = fixture.componentInstance;

      // Verify initial value
      expect(component.endpoint()?.name).toBe('Test Endpoint');

      // Update state
      const updatedEndpoint = {
        ...mockEndpoint,
        name: 'Updated Endpoint'
      };
      store.setState({
        ...initialState,
        requestData: {
          endpoint: {
            'endpoint-1': updatedEndpoint
          }
        }
      });

      // In zoneless mode, signals automatically detect changes
      fixture.detectChanges();
      expect(component.endpoint()?.name).toBe('Updated Endpoint');
    });
  });

  describe('Selector Memoization', () => {
    it('should memoize selector results', () => {
      const selector = endpointsEntityRequestDataSelector('endpoint-1');

      // Call selector multiple times with same state
      const result1 = store.selectSnapshot(selector);
      const result2 = store.selectSnapshot(selector);
      const result3 = store.selectSnapshot(selector);

      // Should return same reference (memoized)
      expect(result1).toBe(result2);
      expect(result2).toBe(result3);
    });

    it('should recompute when state changes', () => {
      const selector = endpointsEntityRequestDataSelector('endpoint-1');
      const result1 = store.selectSnapshot(selector);

      // Update state
      const updatedEndpoint = { ...mockEndpoint, name: 'Changed' };
      store.setState({
        ...initialState,
        requestData: {
          endpoint: {
            'endpoint-1': updatedEndpoint
          }
        }
      });

      const result2 = store.selectSnapshot(selector);

      // Should be different reference (recomputed)
      expect(result1).not.toBe(result2);
      expect(result2.name).toBe('Changed');
    });
  });

  describe('Complex Selector Chains', () => {
    it('should handle composed selectors', () => {
      // Composed selectors using `compose` should work correctly
      const selector = connectedEndpointsSelector();
      const result = store.selectSnapshot(selector);

      expect(Object.keys(result)).toContain('endpoint-1');
      expect(result['endpoint-1'].connectionStatus).toBe('connected');
    });

    it('should filter correctly in compose chains', () => {
      // Add disconnected endpoint
      const disconnectedEndpoint: EndpointModel = {
        ...mockEndpoint,
        guid: 'endpoint-2',
        name: 'Disconnected',
        connectionStatus: 'disconnected'
      };

      store.setState({
        ...initialState,
        requestData: {
          endpoint: {
            'endpoint-1': mockEndpoint,
            'endpoint-2': disconnectedEndpoint
          }
        }
      });

      const selector = connectedEndpointsSelector();
      const result = store.selectSnapshot(selector);

      // Should only include connected endpoint
      expect(Object.keys(result)).toHaveLength(1);
      expect(result['endpoint-1']).toBeDefined();
      expect(result['endpoint-2']).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing state gracefully', () => {
      store.setState({ requestData: {} });
      const selector = endpointsEntityRequestDataSelector('nonexistent');
      const result = store.selectSnapshot(selector);
      expect(result).toBeUndefined();
    });

    it('should handle empty endpoint list', () => {
      store.setState({
        ...initialState,
        requestData: { endpoint: {} }
      });
      const selector = connectedEndpointsSelector();
      const result = store.selectSnapshot(selector);
      expect(result).toEqual({});
    });
  });
});

/**
 * Additional examples for testing with signals in different scenarios
 */
describe('Advanced Signal Selector Patterns', () => {
  let store: MockStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideExperimentalZonelessChangeDetection(),
        provideMockStore({ initialState: {} })
      ]
    });
    store = TestBed.inject(MockStore);
  });

  describe('Multiple Signals', () => {
    @Component({
      selector: 'test-multi-signal',
      template: `
        <div>
          <span class="count">{{ endpoints() | json }}</span>
          <span class="connected">{{ connected() | json }}</span>
        </div>
      `,
      standalone: true
    })
    class MultiSignalComponent {
      endpoints = selectAsSignal(endpointEntitiesSelector);
      connected = selectAsSignal(connectedEndpointsSelector());
    }

    it('should handle multiple independent signals', () => {
      const fixture = TestBed.createComponent(MultiSignalComponent);
      fixture.detectChanges();

      const component = fixture.componentInstance;
      expect(component.endpoints()).toBeDefined();
      expect(component.connected()).toBeDefined();
    });
  });

  describe('Computed Signals from Selectors', () => {
    it('should create computed signals based on selector signals', () => {
      @Component({
        selector: 'test-computed',
        template: '',
        standalone: true
      })
      class ComputedSignalComponent {
        endpoints = selectAsSignal(endpointEntitiesSelector);

        // Computed signal derived from selector signal
        endpointCount = computed(() => {
          const endpoints = this.endpoints();
          return endpoints ? Object.keys(endpoints).length : 0;
        });
      }

      const fixture = TestBed.createComponent(ComputedSignalComponent);
      const component = fixture.componentInstance;

      expect(component.endpointCount()).toBe(0);
    });
  });
});

// Export helper for testing signal selectors
export function testSignalSelector<T>(
  selector: (state: any) => T,
  initialState: any
): Signal<T | undefined> {
  TestBed.configureTestingModule({
    providers: [
      provideExperimentalZonelessChangeDetection(),
      provideMockStore({ initialState })
    ]
  });

  return selectAsSignal(selector);
}
