import { KnownEntityActionBuilder, EntityRequestActionConfig, OrchestratedActionBuilderConfig, PaginationRequestActionConfig } from '../core/src/core/entity-catalogue/action-orchestrator/action-orchestrator';
import { ExampleApiPost } from './example-api-entity.types';



export interface ExamplePostActionBuilders extends OrchestratedActionBuilderConfig {
  get: EntityRequestActionConfig<KnownEntityActionBuilder<ExampleApiPost>>;
  getMultiple: PaginationRequestActionConfig<KnownEntityActionBuilder<ExampleApiPost[]>>;
}

export const exampleApiPostActionBuilders: ExamplePostActionBuilders = {
  get: new EntityRequestActionConfig<KnownEntityActionBuilder<ExampleApiPost>>(
    id => `https://jsonplaceholder.typicode.com/post/${id}`,
    { externalRequest: true }
  ),
  getMultiple: new PaginationRequestActionConfig<KnownEntityActionBuilder<ExampleApiPost[]>>(
    'allPosts',
    () => `https://jsonplaceholder.typicode.com/posts`,
    { externalRequest: true }
  ),
};
