export function getIcon(kind: string) {
  const rkind = kind || 'Pod';
  if (iconMappings[rkind]) {
    return iconMappings[rkind];
  } else {
    return iconMappings.default;
  }
}
  
const iconMappings = {
  Namespace: {
    name: 'namespace',
    font: 'stratos-icons'
  },
  Container: {
    name: 'container',
    font: 'stratos-icons'
  },
  ClusterRole: {
    name: 'cluster_role',
    font: 'stratos-icons'
  },
  ClusterRoleBinding: {
    name: 'cluster_role_binding',
    font: 'stratos-icons'
  },
  Deployment: {
    name: 'deployment',
    font: 'stratos-icons'
  },
  ReplicaSet: {
    name: 'replica_set',
    font: 'stratos-icons'
  },
  Pod: {
    name: 'pod',
    font: 'stratos-icons'
  },
  Service: {
    name: 'service',
    font: 'stratos-icons'
  },
  Role: {
    name: 'assignment_ind',
    font: 'Material Icons',
    fontSet: 'material-icons'
  },
  RoleBinding: {
    name: 'role_binding',
    font: 'stratos-icons'
  },
  StatefulSet: {
    name: 'stateful_set',
    font: 'stratos-icons'
  },
  Ingress: {
    name: 'ingress',
    font: 'stratos-icons'
  },
  ConfigMap: {
    name: 'config_map',
    font: 'stratos-icons'
  },
  Secret: {
    name: 'config_map',
    font: 'stratos-icons'
  },
  ServiceAccount: {
    name: 'lock',
    font: 'Material Icons',
    fontSet: 'material-icons'
  },
  default: {
    name: 'collocation',
    font: 'stratos-icons'
  }
};