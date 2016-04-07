package main

import "time"

type portalConfig struct {
	HTTPClientTimeout   time.Duration `toml:"http_client_timeout"`
	SkipTLSVerification bool          `toml:"skip_tls_verification"`
	TLSAddress          string        `toml:"tls_address"`
	TLSCertFile         string        `toml:"tls_cert_file"`
	TLSCertKey          string        `toml:"tls_cert_key"`
	UAAClient           string        `toml:"uaa_client"`
	UAAClientSecret     string        `toml:"uaa_client_secret"`
	UAAEndpoint         string        `toml:"uaa_endpoint"`
	CookieStoreSecret   string        `toml:"cookie_store_secret"`
	Dev                 bool          `toml:"dev"`
	DevConfig           devConfig     `toml:"dev_config"`
}

type devConfig struct {
	SkipTLSVerification bool `toml:"skip_tls_verification"`
}
