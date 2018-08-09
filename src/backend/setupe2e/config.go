package setupe2e

type Config struct {
	Endpoint Endpoint      `json:"endpoint" form:"endpoint"`
	Fixture  FixtureConfig `json:"fixture" form:"fixture"`
}

type Endpoint struct {
	URL               string    `json:"url" form:"url"`
	SkipSSLValidation bool      `json:"skip-ssl" form:"skipSsl"`
	AdminUser         User      `json:"admin-user" form:"adminUser"`
	UAA               UAAConfig `json:"uaa" form:"uaa"`
}

type UAAConfig struct {
	URL               string `json:"url" form:"url"`
	SkipSSLValidation bool   `json:"skip-ssl" form:"skipSsl"`
	ZoneID            string `json:"zoneId" form:"zoneId"`
	Client            string `json:"client" form:"client"`
	CFClient          string `json:"cf-client" form:"cfClient"`
	ClientSecret      string `json:"client-secret" form:"clientSecret"`
	CFClientSecret    string `json:"cf-client-secret" form:"cfClientSecret"`
}

type FixtureConfig struct {
	NonAdminUser User          `json:"non-admin-user" form:"nonAdminUser"`
	Organization string        `json:"organization" form:"organization"`
	Space        string        `json:"space" form:"space"`
	Services     ServiceConfig `json:"services" form:"services"`
}

type User struct {
	Username string `json:"username" form:"username"`
	Password string `json:"password" form:"password"`
}

type ServiceConfig struct {
	PublicService             string `json:"public-service" form:"publicService"`
	PrivateService            string `json:"private-service" form:"privateService"`
	PrivateSpaceScopedService string `json:"space-scoped-service" form:"spaceScopedService"`
}
