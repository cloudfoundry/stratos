package interfaces

// EndpointRepository is an application of the repository pattern for storing CNSI Records
type EndpointRepository interface {
	List(encryptionKey []byte) ([]*CNSIRecord, error)
	ListByUser(userGUID string) ([]*ConnectedEndpoint, error)
	Find(guid string, encryptionKey []byte) (CNSIRecord, error)
	FindByAPIEndpoint(endpoint string, encryptionKey []byte) (CNSIRecord, error)
	Delete(guid string) error
	Save(guid string, cnsiRecord CNSIRecord, encryptionKey []byte) error
	Update(endpoint CNSIRecord, encryptionKey []byte) error
	UpdateMetadata(guid string, metadata string) error
	SaveOrUpdate(endpoint CNSIRecord, encryptionKey []byte) error
}

type Endpoint interface {
	Init()
}
