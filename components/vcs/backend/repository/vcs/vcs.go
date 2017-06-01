package vcs

const (
	VCS_GITHUB = "github"
	VCS_BITBUCKET = "bitbucket"
)

type VcsRecord struct {
	Guid              string `json:"guid"`
	Label             string `json:"label"`
	VcsType           string `json:"vcs_type"`
	BrowseUrl         string `json:"browse_url"`
	ApiUrl            string `json:"api_url"`
	SkipSslValidation bool   `json:"skip_ssl_validation"`
}

// Repository is an application of the repository pattern for storing CNSI Records
type Repository interface {
	List() ([]*VcsRecord, error)
	ListByUser(userGUID string) ([]*VcsRecord, error)
	Find(guid string) (*VcsRecord, error)
	FindMatching(vcs VcsRecord) (*VcsRecord, error)
	Delete(guid string) error
	Save(vcs VcsRecord) error
}
