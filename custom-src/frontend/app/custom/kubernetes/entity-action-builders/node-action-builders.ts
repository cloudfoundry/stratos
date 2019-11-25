import { OrchestratedActionBuilders } from '../../../core/entity-catalogue/action-orchestrator/action-orchestrator';
import { GetKubernetesNodes } from '../store/kubernetes.actions';

export interface NodeActionBuilders extends OrchestratedActionBuilders {
  getMultiple: () => GetKubernetesNodes;
};

export const nodeActionBuilders: OrchestratedActionBuilders = {
  getMultiple: (kubeGuid: string) => new GetKubernetesNodes(kubeGuid)
};


