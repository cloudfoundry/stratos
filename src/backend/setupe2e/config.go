package setupe2e

type Config struct {
	Endpoint Endpoint      `json:"endpoint" form:"endpoint" yaml:"endpoint"`
	Fixture  FixtureConfig `json:"fixture" form:"fixture" yaml:"fixture"`
}

type Endpoint struct {
	URL               string    `json:"url" form:"url" yaml:"url"`
	SkipSSLValidation bool      `json:"skip-ssl" form:"skipSsl" yaml:"skip-ssl"`
	AdminUser         User      `json:"admin-user" form:"adminUser" yaml:"admin-user"`
	UAA               UAAConfig `json:"uaa" form:"uaa" yaml:"uaa"`
}

type UAAConfig struct {
	URL               string `json:"url" form:"url" yaml:"url"`
	SkipSSLValidation bool   `json:"skip-ssl" form:"skipSsl" yaml:"skip-ssl"`
	ZoneID            string `json:"zoneId" form:"zoneId" yaml:"zoneId"`
	Client            string `json:"client" form:"client" yaml:"client"`
	CFClient          string `json:"cf-client" form:"cfClient" yaml:"cf-client"`
	ClientSecret      string `json:"client-secret" form:"clientSecret" yaml:"client-secret"`
	CFClientSecret    string `json:"cf-client-secret" form:"cfClientSecret" yaml:"cf-client-secret"`
}

type FixtureConfig struct {
	NonAdminUser User          `json:"non-admin-user" form:"nonAdminUser" yaml:"non-admin-user"`
	Organization string        `json:"organization" form:"organization" yaml:"organization"`
	Space        string        `json:"space" form:"space" yaml:"space"`
	Services     ServiceConfig `json:"services" form:"services" yaml:"services"`
}

type User struct {
	Username string `json:"username" form:"username" yaml:"username"`
	Password string `json:"password" form:"password" yaml:"password"`
}

type ServiceConfig struct {
	PublicService             string `json:"public-service" form:"publicService" yaml:"public-service"`
	PrivateService            string `json:"private-service" form:"privateService" yaml:"private-service"`
	PrivateSpaceScopedService string `json:"space-scoped-service" form:"spaceScopedService" yaml:"space-scoped-service"`
}
