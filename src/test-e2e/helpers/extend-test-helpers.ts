export function extendE2ETestTime(newTimeout = 140000) {
  let originalTimeout;

  // Might take a bit longer to deploy the app than the global default timeout allows
  beforeEach(() => {
    originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
    jasmine.DEFAULT_TIMEOUT_INTERVAL = newTimeout;
  });

  afterEach(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
  });
}
