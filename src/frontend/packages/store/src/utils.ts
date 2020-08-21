// We don't want to bring in the utils package from nodejs
// We only use this one function:

export function isNullOrUndefined(obj: any): boolean {
  return typeof obj === 'undefined' || obj === null;
}
