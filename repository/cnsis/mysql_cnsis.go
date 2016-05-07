package cnsis

import (
	"fmt"
	"net/url"
	"database/sql"
	_ "github.com/go-sql-driver/mysql"

 	"portal-proxy/mysql"
  "portal-proxy/repository"
)

const (
	listCnsis	= `SELECT guid, name, cnsi_type, api_endpoint, auth_endpoint, token_endpoint
							 FROM cnsis`
  findCnsi	= `SELECT guid, name, cnsi_type, api_endpoint, auth_endpoint, token_endpoint
  						 FROM cnsis
               WHERE guid=?`
	saveCnsi  = `INSERT INTO cnsis (guid, name, cnsi_type, api_endpoint, auth_endpoint, token_endpoint)
							 VALUES (?, ?, ?, ?, ?, ?)`
)

// MysqlCnsiRepository is a MySQL-backed cnsi repository
type MysqlCnsiRepository struct {
	Repository

	db *sql.DB
}


func NewMysqlCnsiRepository(configParams mysql.MysqlConnectionParameters) (Repository, error) {
	db, err := mysql.GetConnection(configParams)
	if err != nil {
		return nil, &repository.DatabaseError{InnerError: err}
	}

	return &MysqlCnsiRepository{db: db}, nil
}


func (p *MysqlCnsiRepository) List() ([]*CnsiRecord, error) {

	rows, err := p.db.Query(listCnsis)
	if err != nil {
		panic(err.Error())
		return []*CnsiRecord{}, &repository.DatabaseError{InnerError: err}
	}
	defer rows.Close()

  cnsi_list := make([]*CnsiRecord, 0)
  for rows.Next() {
      cnsi := new(CnsiRecord)
      err := rows.Scan(&cnsi.Guid, &cnsi.Name, &cnsi.CNSIType, &cnsi.APIEndpoint, &cnsi.AuthorizationEndpoint, &cnsi.TokenEndpoint)
      if err != nil {
          return nil, &repository.DatabaseError{InnerError: err}
      }
      cnsi_list = append(cnsi_list, cnsi)
  }
  if err = rows.Err(); err != nil {
			panic(err.Error())
      return nil, &repository.DatabaseError{InnerError: err}
  }

	return cnsi_list, nil
}


func (p *MysqlCnsiRepository) Find(guid string) (CnsiRecord, error) {

	fmt.Println("----- ENTERING Find")

  cnsi := new(CnsiRecord)

	stmt, err := p.db.Prepare(findCnsi)
	if err != nil {
	    panic(err.Error())
	}

	var (
		p_cnsi_type string 		// CnsiType
		p_url string 					// *url.URL
	)
	err = stmt.QueryRow(guid).Scan(&cnsi.Guid,
																 &cnsi.Name,
																 &p_cnsi_type,
																 &p_url,
																 &cnsi.AuthorizationEndpoint,
																 &cnsi.TokenEndpoint)
	if err != nil {
		panic(err.Error())
		return CnsiRecord{}, &repository.DatabaseError{InnerError: err}
	}

	// TODO: CJ - discover a way to do this automagically
	// These two fields need to be converted manually
	cnsi.CNSIType = getCnsiType(p_cnsi_type)
	cnsi.APIEndpoint, err = url.Parse(p_url)

	return *cnsi, nil
}


// TODO: CJ - discover a better way to convert to the custom type
func getCnsiType(str string) CnsiType {
	var x CnsiType
	switch {
	case str == "hcf":
    return CnsiHCF
	case str == "hce":
		return CnsiHCE
	default:
		return x
  }
}


func (p *MysqlCnsiRepository) Save(guid string, cnsi CnsiRecord) error {

  stmt, es := p.db.Prepare(saveCnsi)
  if es != nil {
		return &repository.DatabaseError{InnerError: es}
  }

  _, err := stmt.Exec(guid, cnsi.Name, fmt.Sprintf("%s", cnsi.CNSIType),
											fmt.Sprintf("%s", cnsi.APIEndpoint),
											cnsi.AuthorizationEndpoint, cnsi.TokenEndpoint)
	if err != nil {
		return &repository.DatabaseError{InnerError: err}
	}

	return nil
}
