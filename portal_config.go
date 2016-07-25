package main

type portalConfig struct {
	HTTPClientTimeoutInSecs int64    `ucp:"HTTP_CLIENT_TIMEOUT_IN_SECS"`
	SkipTLSVerification     bool     `ucp:"SKIP_TLS_VERIFICATION"`
	TLSAddress              string   `ucp:"CONSOLE_PROXY_TLS_ADDRESS"`
	TLSCert                 string   `ucp:"CONSOLE_PROXY_CERT"`
	TLSCertKey              string   `ucp:"CONSOLE_PROXY_CERT_KEY"`
	ConsoleClient           string   `ucp:"CONSOLE_CLIENT"`
	ConsoleClientSecret     string   `ucp:"CONSOLE_CLIENT_SECRET"`
	HCEClient               string   `ucp:"HCE_CLIENT"`
	HCFClient               string   `ucp:"HCF_CLIENT"`
	HCFClientSecret         string   `ucp:"HCF_CLIENT_SECRET"`
	HCPIdentityScheme       string   `ucp:"HCP_IDENTITY_SCHEME"`
	HCPIdentityHost         string   `ucp:"HCP_IDENTITY_HOST"`
	HCPIdentityPort         string   `ucp:"HCP_IDENTITY_PORT"`
	AllowedOrigins          []string `ucp:"ALLOWED_ORIGINS"`
	SessionStoreSecret      string   `ucp:"SESSION_STORE_SECRET"`
	GitHubOauthClientID     string   `ucp:"GITHUB_OAUTH_CLIENT_ID"`
	GitHubOAuthClientSecret string   `ucp:"GITHUB_OAUTH_CLIENT_SECRET"`
	GitHubOAuthState        string   `ucp:"GITHUB_OAUTH_STATE"`
	EncryptionKeyVolume     string   `ucp:"ENCRYPTION_KEY_VOLUME"`
	EncryptionKey           string   `ucp:"ENCRYPTION_KEY"`
	EncryptionKeyInBytes    []byte
}
