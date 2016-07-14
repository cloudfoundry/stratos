package main

type portalConfig struct {
	HTTPClientTimeoutInSecs int64    `ucp:"HTTP_CLIENT_TIMEOUT_IN_SECS"`
	SkipTLSVerification     bool     `ucp:"SKIP_TLS_VERIFICATION"`
	TLSAddress              string   `ucp:"TLS_ADDRESS"`
	TLSCert                 string   `ucp:"CERT"`
	TLSCertKey              string   `ucp:"CERT_KEY"`
	ConsoleClient           string   `ucp:"CONSOLE_CLIENT"`
	ConsoleClientSecret     string   `ucp:"CONSOLE_CLIENT_SECRET"`
	HCEClient               string   `ucp:"HCE_CLIENT"`
	HCFClient               string   `ucp:"HCF_CLIENT"`
	HCFClientSecret         string   `ucp:"HCF_CLIENT_SECRET"`
	UAAEndpoint             string   `ucp:"UAA_ENDPOINT"`
	AllowedOrigins          []string `ucp:"ALLOWED_ORIGINS"`
	SessionStoreSecret      string   `ucp:"SESSION_STORE_SECRET"`
	GitHubOauthClientID     string   `ucp:"GITHUB_OAUTH_CLIENT_ID"`
	GitHubOAuthClientSecret string   `ucp:"GITHUB_OAUTH_CLIENT_SECRET"`
	GitHubOAuthState        string   `ucp:"GITHUB_OAUTH_STATE"`
	EncryptionKey           string   `ucp:"ENCRYPTION_KEY"`
	EncryptionKeyInBytes    []byte
}
