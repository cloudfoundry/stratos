import { CustomModule } from './custom.module';

describe('CustomModule', () => {
  let customModule: CustomModule;

  beforeEach(() => {
    customModule = new CustomModule();
  });

  it('should create an instance', () => {
    expect(customModule).toBeTruthy();
  });
});
