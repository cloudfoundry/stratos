class ArrayHelper {
  public flatten<T = any>(arr: any[]): T[] {
    return arr.reduce((flat: T[], toFlatten: any) => {
      return flat.concat(Array.isArray(toFlatten) ? this.flatten(toFlatten) : toFlatten);
    }, []);
  }
}

export const arrayHelper = new ArrayHelper();
