/*
 * Re-export Cloud Foundry test helpers for use in tests
 * This allows importing via @test-framework/entity-relations-spec-helper
 */
export {
  EntityRelationSpecHelper,
  entityRelationMissingSpacesUrl,
  entityRelationMissingQuotaGuid,
  entityRelationMissingQuotaUrl
} from '@stratosui/cloud-foundry';
