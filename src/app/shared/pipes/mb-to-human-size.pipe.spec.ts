import { MbToHumanSizePipe } from './mb-to-human-size.pipe';

describe('MbToHumanSizePipe', () => {
  it('create an instance', () => {
    const pipe = new MbToHumanSizePipe();
    expect(pipe).toBeTruthy();
  });
});
