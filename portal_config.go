package main

type portalConfig struct {
	HTTPClientTimeoutInSecs     int64    `configName:"HTTP_CLIENT_TIMEOUT_IN_SECS"`
	HTTPConnectionTimeoutInSecs int64    `configName:"HTTP_CONNECTION_TIMEOUT_IN_SECS"`
	SkipTLSVerification         bool     `configName:"SKIP_TLS_VERIFICATION"`
	TLSAddress                  string   `configName:"CONSOLE_PROXY_TLS_ADDRESS"`
	TLSCert                     string   `configName:"CONSOLE_PROXY_CERT"`
	TLSCertKey                  string   `configName:"CONSOLE_PROXY_CERT_KEY"`
	ConsoleClient               string   `configName:"CONSOLE_CLIENT"`
	ConsoleClientSecret         string   `configName:"CONSOLE_CLIENT_SECRET"`
	HCEClient                   string   `configName:"HCE_CLIENT"`
	HSMClient                   string   `configName:"HSM_CLIENT"`
	HCFClient                   string   `configName:"HCF_CLIENT"`
	HCFClientSecret             string   `configName:"HCF_CLIENT_SECRET"`
	UAAEndpoint                 string   `configName:"UAA_ENDPOINT"`
	AllowedOrigins              []string `configName:"ALLOWED_ORIGINS"`
	SessionStoreSecret          string   `configName:"SESSION_STORE_SECRET"`
	HCPFlightRecorderHost       string   `configName:"HCP_FLIGHTRECORDER_HOST"`
	HCPFlightRecorderPort       string   `configName:"HCP_FLIGHTRECORDER_PORT"`
	EncryptionKeyVolume         string   `configName:"ENCRYPTION_KEY_VOLUME"`
	EncryptionKeyFilename       string   `configName:"ENCRYPTION_KEY_FILENAME"`
	EncryptionKey               string   `configName:"ENCRYPTION_KEY"`
	EncryptionKeyInBytes        []byte
	ConsoleVersion              string
	IsCloudFoundry              bool
}
