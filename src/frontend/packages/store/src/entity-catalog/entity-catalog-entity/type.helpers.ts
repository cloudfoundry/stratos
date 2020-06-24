/**
 * Remove keys such as typed indexes  (i.e. [key: string])
 * For magic see
 *  - https://github.com/Microsoft/TypeScript/issues/25987#issuecomment-441224690
 *  - https://github.com/Microsoft/TypeScript/issues/12215#issuecomment-414808995
 */
export type KnownKeys<T> = {
  [K in keyof T]: string extends K ? never : number extends K ? never : K
} extends { [_ in keyof T]: infer U } ? ({} extends U ? never : U) : never;

export type NonOptionalKeys<T extends object> = Exclude<{
  [K in keyof T]: T extends Record<K, T[K]>
  ? K
  : never
}[keyof T], undefined>

export type OptionalKeys<T extends object> = Exclude<{
  [K in keyof T]: T extends Record<K, T[K]>
  ? K
  : never
}[keyof T], undefined>

export type NeverKeys<T extends object> = Exclude<{
  [K in keyof T]: T[K] extends never
  ? K
  : never
}[keyof T], undefined>

/**
 * Pick all properties who's function has the specified return type U
 */
export type FilteredByReturnType<T extends { [key: string]: (...args: any[]) => any }, U> = {
  [P in keyof T]: ReturnType<T[P]> extends U ? T[P] : never
};

/**
 * Pick all properties who's function do not have the specified return type U
 */
export type FilteredByNotReturnType<T extends { [key: string]: (...args: any[]) => any }, U> = {
  [P in keyof T]: ReturnType<T[P]> extends U ? never : T[P]
};

// Note - Adding }[keyof T] to [P in keyof T] types should filter out properties of type `never`, however this fails with generics!
export type FilteredByValueType<T extends { [key: string]: (...args: any[]) => any }, U> = {
  [P in keyof T]: T[P] extends U ? never : T[P]
};
