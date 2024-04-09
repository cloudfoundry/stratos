package api

// StoreFactory is used to obtain interfaces for accessing the store
type StoreFactory interface {
	EndpointStore() (EndpointRepository, error)
	TokenStore() (TokenRepository, error)
}
