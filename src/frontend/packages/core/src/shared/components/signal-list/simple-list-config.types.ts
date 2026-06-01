/**
 * Opaque list-config registry value type. Retained (legacy name) for the
 * Kubernetes UI/list `ConfigHolder` registries (`kubernetes-ui-service`,
 * `kubernetes-list-service`), which store list configs by name and read them
 * back as `<any>`. The legacy `Omit<IListConfig<T>, 'getDataSource'>` shape it
 * once aliased is gone with the list framework; consumers only use it as an
 * opaque, `any`-typed holder.
 */
export type ISimpleListConfig<T = any> = Record<string, any>;
