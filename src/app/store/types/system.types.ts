export interface SystemInfo {
    version: {
        proxy_version: string,
        database_version: number
    };
    user: SystemInfoUser;
    endpoints: {
        cf: {
            [key: string]: SystemInfoEndpoint
        }
    };
}

export interface SystemInfoEndpoint {
    guid: string;
    name: string;
    version: string;
    user: SystemInfoUser;
    type: string;
}

export interface SystemInfoUser {
    guid: string;
    name: string;
    admin: boolean;
}
