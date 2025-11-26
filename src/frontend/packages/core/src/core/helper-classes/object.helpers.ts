class ObjectHelper {
    public getPath(object: unknown, path: string[]): unknown {
        try {
            return path.reduce((o: Record<string, unknown>, i) => o[i] as Record<string, unknown>, object as Record<string, unknown>);
        } catch (_err) {
            return null;
        }
    }
    public getPathFromString(object: unknown, path: string, separator?: string): unknown {
        return this.getPath(object, path.split(separator || '.'));
    }
}

export const objectHelper = new ObjectHelper();
