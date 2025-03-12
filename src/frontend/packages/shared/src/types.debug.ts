// Pure Debug Typoes for vscode inspection
//
// Use Case:
// Inspecting exact properties and types of `TypeToInspect`
// type inspectMyType = Expand<TypeToInspect>
//
// For nested/complex types
// type inspectMyType = ExpandRecursively<TypeToInspect>

export type Expand<T> = T extends (...args: infer A) => infer R
  ? (...args: Expand<A>) => Expand<R>
  : T extends infer O
  ? { [K in keyof O]: O[K] }
  : never;

export type ExpandRecursively<T> = T extends (...args: infer A) => infer R
  ? (...args: ExpandRecursively<A>) => ExpandRecursively<R>
  : T extends object
  ? T extends infer O
    ? { [K in keyof O]: ExpandRecursively<O[K]> }
    : never
  : T;
