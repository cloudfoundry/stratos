package interfaces

type APIKey struct {
	GUID     string `json:"guid"`
	Secret   string `json:"secret"`
	UserGUID string `json:"user_guid"`
	Comment  string `json:"comment"`
}
