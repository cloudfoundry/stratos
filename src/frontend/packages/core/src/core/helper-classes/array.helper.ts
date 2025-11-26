class ArrayHelper {
  public flatten<T = unknown>(arr: unknown[]): T[] {
    return arr.reduce<T[]>((flat, toFlatten) => {
      return flat.concat(Array.isArray(toFlatten) ? this.flatten(toFlatten) : (toFlatten as T));
    }, []);
  }
}

export const arrayHelper = new ArrayHelper();
