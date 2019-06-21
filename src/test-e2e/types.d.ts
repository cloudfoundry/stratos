// Add typings for overloads that take a skip function

declare function describe(description: string, skipWhen: () => boolean, specDefinitions: () => void): any;
declare function fdescribe(description: string, skipWhen: () => boolean, specDefinitions: () => void): any;
declare function xdescribe(description: string, skipWhen: () => boolean, specDefinitions: () => void): any;
