class ObjectHelper {
    public getPath(object, path: string[]) {
        try {
            return path.reduce((o, i) => o[i], object);
        } catch (err) {
            return null;
        }
    }
    public getPathFromString(object, path: string, separator?: string) {
        return this.getPath(object, path.split(separator || '.'));
    }
}

export const objectHelper = new ObjectHelper();
