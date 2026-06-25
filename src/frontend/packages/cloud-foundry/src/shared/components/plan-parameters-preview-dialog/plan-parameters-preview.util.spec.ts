import { extractCreateParameters, previewSchema } from './plan-parameters-preview.util';
import type { StServicePlan } from '../../../services/endpoint-data/stratos-types';

describe('plan-parameters-preview.util', () => {
  describe('extractCreateParameters', () => {
    it('returns the create.parameters schema when present', () => {
      const schema = { properties: { region: { type: 'string' } } };
      const plan = { schemas: { serviceInstance: { create: { parameters: schema } } } } as unknown as StServicePlan;
      expect(extractCreateParameters(plan)).toBe(schema);
    });

    it('returns null for a summary-tier plan with no schemas', () => {
      expect(extractCreateParameters({ guid: 'p1' } as unknown as StServicePlan)).toBeNull();
      expect(extractCreateParameters(null)).toBeNull();
      expect(extractCreateParameters(undefined)).toBeNull();
    });
  });

  describe('previewSchema', () => {
    it('drops the $schema plumbing key', () => {
      const out = previewSchema({ $schema: 'http://json-schema.org/draft-04/schema#', properties: { a: {} } });
      expect(out).toEqual({ properties: { a: {} } });
    });

    it('returns null for an empty or schema-only object (nothing to show)', () => {
      expect(previewSchema({})).toBeNull();
      expect(previewSchema({ $schema: 'x' })).toBeNull();
      expect(previewSchema(null)).toBeNull();
    });

    it('keeps a meaningful schema intact', () => {
      const raw = { type: 'object', properties: { region: { type: 'string' } }, required: ['region'] };
      expect(previewSchema(raw)).toEqual(raw);
    });
  });
});
