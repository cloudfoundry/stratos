package interfaces

// LocalUser - Used for local user auth and management
type LocalUser struct {
	UserGUID     string `json:"user_guid"`
	PasswordHash []byte `json:"password_hash"`
	Username     string `json:"username"`
	Email        string `json:"email"`
	Scope        string `json:"scope"`
}
