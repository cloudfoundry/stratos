package custom_errors

import (
	"fmt"

	"github.com/cloudfoundry/stratos/src/jetstream/custom_errors/constants"
)

type GooseDBNoDatabaseVersionsFoundError struct{}

func (e GooseDBNoDatabaseVersionsFoundError) Error() string {
	return constants.ERR_GOOSE_DB_NO_DATABASE_VERSIONS_FOUND
}

type GooseDBNoSuchTableError struct{}

func (e GooseDBNoSuchTableError) Error() string {
	return constants.ERR_GOOSE_DB_NO_SUCH_TABLE
}

func ErrGettingCurrentVersion(err error) error {
	return fmt.Errorf(constants.ERR_GOOSE_DB_FAILED_GETTING_CURRENT_DATABASE_VERSION, err)
}

var ErrNoDatabaseVersionsFound = GooseDBNoDatabaseVersionsFoundError{}
var ErrNoSuchTable = GooseDBNoSuchTableError{}
