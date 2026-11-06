import { describe, it, expect } from 'vitest';

import { CsiStateService } from './csi-state.service';

describe('CsiStateService', () => {
  it('setAll carries the serviceInstanceGuid when provided (edit mode)', () => {
    const svc = new CsiStateService();
    svc.setAll('my-si', 'space-1', ['tag'], '', false, 'si-guid-123');
    expect(svc.serviceInstanceGuid()).toBe('si-guid-123');
  });

  it('setAll without a guid clears serviceInstanceGuid (the #5412 foot-gun)', () => {
    // This is why the managed edit setup must pass si.guid THROUGH setAll:
    // calling setServiceInstanceGuid() first and then setAll() with no guid
    // arg clobbered it back to null, sending PATCH /service_instances/{cnsi}/null.
    const svc = new CsiStateService();
    svc.setServiceInstanceGuid('si-guid-123');
    svc.setAll('my-si', 'space-1', [], '');
    expect(svc.serviceInstanceGuid() ?? null).toBeNull();
  });

  it('the fixed managed-edit call sequence preserves the serviceInstanceGuid (#5412)', () => {
    // Mirrors applyManagedEditModeState: setServiceGuid → setAll(..., si.guid)
    // → setServicePlan. The instance guid must survive to the edit-mode PATCH.
    const svc = new CsiStateService();
    svc.setServiceGuid('svc-1');
    svc.setAll('my-si', 'space-1', ['tag'], '', false, 'si-guid-123');
    svc.setServicePlan('plan-1');
    expect(svc.serviceInstanceGuid()).toBe('si-guid-123');
  });
});
