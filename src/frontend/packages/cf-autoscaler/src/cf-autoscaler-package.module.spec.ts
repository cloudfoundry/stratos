import { describe, it, expect } from 'vitest';

import { getTabsFromExtensions, StratosTabType } from '../../core/src/core/extension/extension-service';
import { CfAutoscalerPackageModule } from './cf-autoscaler-package.module';

describe('CfAutoscalerPackageModule', () => {
  // The app imports only this module from the package, so it must load the
  // tab component for its decorator to register the Autoscale tab
  it('registers the Autoscale application tab', () => {
    expect(CfAutoscalerPackageModule).toBeDefined();
    expect(getTabsFromExtensions(StratosTabType.Application).map(t => t.link)).toContain('autoscale');
  });
});
