class ObjectHelper {
    public getPath(object: any, path: string[]): any {
        try {
            return path.reduce((o, i) => o[i], object);
        } catch (err) {
            return null;
        }
    }
    public getPathFromString(object: any, path: string, separator?: string): any {
        return this.getPath(object, path.split(separator || '.'));
    }
}

export const objectHelper = new ObjectHelper();
