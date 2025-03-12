package api

// UAAResponse - Response returned by Cloud Foundry UAA Service
type UAAResponse struct {
	AccessToken  string `json:"access_token"`
	TokenType    string `json:"token_type"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int    `json:"expires_in"`
	Scope        string `json:"scope"`
	JTI          string `json:"jti"`
	IDToken      string `json:"id_token"`
}

// UAAErrorResponse is the error response returned by Cloud Foundry UAA Service
type UAAErrorResponse struct {
	Error            string `json:"error"`
	ErrorDescription string `json:"error_description"`
}
