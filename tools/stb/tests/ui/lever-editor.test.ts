import { describe, it, expect } from 'vitest';
import { contentValue, assetValue } from '@/ui/lever-editor';

describe('lever-editor value helpers', () => {
  it('contentValue / assetValue shape the union', () => {
    expect(contentValue('Hi')).toEqual({ kind: 'content', text: 'Hi' });
    expect(assetValue('logo.png')).toEqual({ kind: 'asset', ref: 'logo.png' });
  });
});
