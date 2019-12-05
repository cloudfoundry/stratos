class ArrayHelper {
  public flatten<T = any>(arr): T[] {
    return arr.reduce((flat, toFlatten) => {
      return flat.concat(Array.isArray(toFlatten) ? this.flatten(toFlatten) : toFlatten);
    }, []);
  }
}

export const arrayHelper = new ArrayHelper();
