
export function getPath(object: { [key: string]: any }, path: string[]) {
    try {
        return path.reduce((o, i) => o[i], object);
    } catch (err) {
        return null;
    }
}
