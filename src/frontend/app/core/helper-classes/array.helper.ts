class ArrayHelper {
  public flatten(arr) {
    return arr.reduce((flat, toFlatten) => {
      return flat.concat(Array.isArray(toFlatten) ? this.flatten(toFlatten) : toFlatten);
    }, []);
  }
}

export const arrayHelper = new ArrayHelper();
