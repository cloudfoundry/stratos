package datastore

// import (
// 	"io/ioutil"
// 	"os"
// 	"testing"
//
// 	"github.com/stretchr/testify/assert"
// )
//
// func TestBuildConnStrNoSSL(t *testing.T) {
// 	assert := assert.New(t)
//
// 	clearEnvVars()
// 	defer clearEnvVars()
//
// 	pwfile, err := ioutil.TempFile("", "pwfile")
// 	defer os.Remove(pwfile.Name())
// 	assert.NoError(err)
// 	pwfile.WriteString("foobar\n")
// 	pwfile.Close()
//
// 	os.Setenv(m.MYSQLUsername, "user1")
// 	os.Setenv(m.MYSQLPasswordFile, pwfile.Name())
// 	os.Setenv(m.MYSQLAddress, "localhost")
// 	os.Setenv(m.MYSQLPort, "3306")
// 	os.Setenv(m.MYSQLDatabase, "mydb")
//
// 	connParams, err := m.NewMySQLConnectionParametersFromEnvironment()
// 	assert.NoError(err)
//
// 	connStr := m.buildConnectionString(connParams)
//
// 	assert.Equal(`user1:foobar@tcp(localhost:3306)/mydb`, connStr)
// }

// func TestBuildConnStrSSL(t *testing.T) {
// 	assert := assert.New(t)
//
// 	clearEnvVars()
// 	defer clearEnvVars()
//
// 	pwfile, err := ioutil.TempFile("", "pwfile")
// 	defer os.Remove(pwfile.Name())
// 	assert.NoError(err)
// 	pwfile.WriteString("foobar\n")
// 	pwfile.Close()
//
// 	certFile, err := ioutil.TempFile("", "my cert file")
// 	defer os.Remove(certFile.Name())
// 	assert.NoError(err)
// 	certFile.Close()
//
// 	keyFile, err := ioutil.TempFile("", "my key file")
// 	defer os.Remove(keyFile.Name())
// 	assert.NoError(err)
// 	keyFile.Close()
//
// 	rootCertFile, err := ioutil.TempFile("", "my root cert")
// 	defer os.Remove(rootCertFile.Name())
// 	assert.NoError(err)
// 	rootCertFile.Close()
//
// 	os.Setenv(MYSQLUsername, "user1")
// 	os.Setenv(MYSQLPasswordFile, pwfile.Name())
// 	os.Setenv(MYSQLDatabase, "mydb")
// 	os.Setenv(MYSQLAddress, "localhost")
// 	os.Setenv(MYSQLPort, "5432")
// 	os.Setenv(MYSQLSSLMode, "require")
// 	os.Setenv(MYSQLCertificateFile, certFile.Name())
// 	os.Setenv(MYSQLKeyFile, keyFile.Name())
// 	os.Setenv(MYSQLRootCertificateFile, rootCertFile.Name())
//
// 	connParams, err := NewMysqlConnectionParametersFromEnvironment()
// 	assert.NoError(err)
//
// 	connStr := buildConnectionString(connParams)
//
// 	expected := fmt.Sprintf("user='user1' password='foobar' dbname='mydb' host=localhost port=5432 connect_timeout=10 sslmode=require sslcert='%s' sslkey='%s' sslrootcert='%s'", certFile.Name(), keyFile.Name(), rootCertFile.Name())
// 	assert.Equal(expected, connStr)
// }

// func TestBuildConnStrSSLDisabledIgnoresCerts(t *testing.T) {
// 	assert := assert.New(t)
//
// 	clearEnvVars()
// 	defer clearEnvVars()
//
// 	pwfile, err := ioutil.TempFile("", "pwfile")
// 	defer os.Remove(pwfile.Name())
// 	assert.NoError(err)
// 	pwfile.WriteString("foobar\n")
// 	pwfile.Close()
//
// 	certFile, err := ioutil.TempFile("", "my cert file")
// 	defer os.Remove(certFile.Name())
// 	assert.NoError(err)
// 	certFile.Close()
//
// 	keyFile, err := ioutil.TempFile("", "my key file")
// 	defer os.Remove(keyFile.Name())
// 	assert.NoError(err)
// 	keyFile.Close()
//
// 	rootCertFile, err := ioutil.TempFile("", "my root cert")
// 	defer os.Remove(rootCertFile.Name())
// 	assert.NoError(err)
// 	rootCertFile.Close()
//
// 	os.Setenv(MYSQLUsername, "user1")
// 	os.Setenv(MYSQLPasswordFile, pwfile.Name())
// 	os.Setenv(MYSQLDatabase, "mydb")
// 	os.Setenv(MYSQLAddress, "localhost")
// 	os.Setenv(MYSQLPort, "5432")
// 	os.Setenv(MYSQLSSLMode, "disable")
// 	os.Setenv(MYSQLCertificateFile, certFile.Name())
// 	os.Setenv(MYSQLKeyFile, keyFile.Name())
// 	os.Setenv(MYSQLRootCertificateFile, rootCertFile.Name())
//
// 	connParams, err := NewMysqlConnectionParametersFromEnvironment()
// 	assert.NoError(err)
//
// 	connStr := buildConnectionString(connParams)
//
// 	expected := fmt.Sprintf("user='user1' password='foobar' dbname='mydb' host=localhost port=5432 connect_timeout=10 sslmode=disable")
// 	assert.Equal(expected, connStr)
// }

// func TestBadPWFile(t *testing.T) {
// 	assert := assert.New(t)
//
// 	clearEnvVars()
// 	defer clearEnvVars()
//
// 	os.Setenv(m.MYSQLUsername, "user1")
// 	os.Setenv(m.MYSQLPasswordFile, "I do not exist")
// 	os.Setenv(m.MYSQLDatabase, "mydb")
// 	os.Setenv(m.MYSQLAddress, "localhost")
// 	os.Setenv(m.MYSQLPort, "5432")
//
// 	_, err := m.NewMySQLConnectionParametersFromEnvironment()
// 	assert.Error(err)
// 	be, ok := err.(*BadEnvVarError)
// 	assert.True(ok)
// 	assert.Equal(m.MYSQLPasswordFile, be.EnvVar)
// }
//
// func TestMissingUser(t *testing.T) {
// 	assert := assert.New(t)
//
// 	clearEnvVars()
// 	defer clearEnvVars()
//
// 	_, err := m.NewMySQLConnectionParametersFromEnvironment()
// 	assert.Error(err)
// 	me, ok := err.(*MissingEnvVarError)
// 	assert.True(ok)
// 	assert.Equal(MYSQLUsername, me.EnvVar)
// }
//
// func TestMissingPWFile(t *testing.T) {
// 	assert := assert.New(t)
//
// 	clearEnvVars()
// 	defer clearEnvVars()
//
// 	os.Setenv(m.MYSQLUsername, "user1")
// 	os.Setenv(m.MYSQLDatabase, "mydb")
// 	os.Setenv(m.MYSQLAddress, "localhost")
// 	os.Setenv(m.MYSQLPort, "5432")
//
// 	_, err := m.NewMySQLConnectionParametersFromEnvironment()
// 	assert.Error(err)
// 	me, ok := err.(*MissingEnvVarError)
// 	assert.True(ok)
// 	assert.Equal(MYSQLPasswordFile, me.EnvVar)
// }
//
// func TestMissingDatabase(t *testing.T) {
// 	assert := assert.New(t)
//
// 	clearEnvVars()
// 	defer clearEnvVars()
//
// 	pwfile, err := ioutil.TempFile("", "pwfile")
// 	defer os.Remove(pwfile.Name())
// 	assert.NoError(err)
// 	pwfile.WriteString("foobar\n")
// 	pwfile.Close()
//
// 	os.Setenv(m.MYSQLUsername, "user1")
// 	os.Setenv(m.MYSQLPasswordFile, pwfile.Name())
// 	os.Setenv(m.MYSQLAddress, "localhost")
// 	os.Setenv(m.MYSQLPort, "5432")
//
// 	_, err = m.NewMySQLConnectionParametersFromEnvironment()
// 	assert.Error(err)
// 	me, ok := err.(*MissingEnvVarError)
// 	assert.True(ok)
// 	assert.Equal(MYSQLDatabase, me.EnvVar)
// }
//
// func TestMissingHost(t *testing.T) {
// 	assert := assert.New(t)
//
// 	clearEnvVars()
// 	defer clearEnvVars()
//
// 	pwfile, err := ioutil.TempFile("", "pwfile")
// 	defer os.Remove(pwfile.Name())
// 	assert.NoError(err)
// 	pwfile.WriteString("foobar\n")
// 	pwfile.Close()
//
// 	os.Setenv(m.MYSQLUsername, "user1")
// 	os.Setenv(m.MYSQLPasswordFile, pwfile.Name())
// 	os.Setenv(m.MYSQLDatabase, "mydb")
// 	os.Setenv(m.MYSQLPort, "5432")
//
// 	_, err = m.NewMySQLConnectionParametersFromEnvironment()
// 	assert.Error(err)
// 	me, ok := err.(*MissingEnvVarError)
// 	assert.True(ok)
// 	assert.Equal(MYSQLAddress, me.EnvVar)
// }
//
// func TestMissingPort(t *testing.T) {
// 	assert := assert.New(t)
//
// 	clearEnvVars()
// 	defer clearEnvVars()
//
// 	pwfile, err := ioutil.TempFile("", "pwfile")
// 	defer os.Remove(pwfile.Name())
// 	assert.NoError(err)
// 	pwfile.WriteString("foobar\n")
// 	pwfile.Close()
//
// 	os.Setenv(m.MYSQLUsername, "user1")
// 	os.Setenv(m.MYSQLPasswordFile, pwfile.Name())
// 	os.Setenv(m.MYSQLDatabase, "mydb")
// 	os.Setenv(m.MYSQLAddress, "localhost")
//
// 	_, err = m.NewMySQLConnectionParametersFromEnvironment()
// 	assert.Error(err)
// 	me, ok := err.(*MissingEnvVarError)
// 	assert.True(ok)
// 	assert.Equal(MYSQLPort, me.EnvVar)
// }
//
// func TestBadPortBelow1(t *testing.T) {
// 	assert := assert.New(t)
//
// 	clearEnvVars()
// 	defer clearEnvVars()
//
// 	pwfile, err := ioutil.TempFile("", "pwfile")
// 	defer os.Remove(pwfile.Name())
// 	assert.NoError(err)
// 	pwfile.WriteString("foobar\n")
// 	pwfile.Close()
//
// 	os.Setenv(m.MYSQLUsername, "user1")
// 	os.Setenv(m.MYSQLPasswordFile, pwfile.Name())
// 	os.Setenv(m.MYSQLDatabase, "mydb")
// 	os.Setenv(m.MYSQLAddress, "localhost")
// 	os.Setenv(m.MYSQLPort, "-1")
//
// 	_, err = m.NewMySQLConnectionParametersFromEnvironment()
// 	assert.Error(err)
// 	be, ok := err.(*BadEnvVarError)
// 	assert.True(ok)
// 	assert.Equal(MYSQLPort, be.EnvVar)
// }
//
// func TestBadPortAbove65535(t *testing.T) {
// 	assert := assert.New(t)
//
// 	clearEnvVars()
// 	defer clearEnvVars()
//
// 	pwfile, err := ioutil.TempFile("", "pwfile")
// 	defer os.Remove(pwfile.Name())
// 	assert.NoError(err)
// 	pwfile.WriteString("foobar\n")
// 	pwfile.Close()
//
// 	os.Setenv(m.MYSQLUsername, "user1")
// 	os.Setenv(m.MYSQLPasswordFile, pwfile.Name())
// 	os.Setenv(m.MYSQLDatabase, "mydb")
// 	os.Setenv(m.MYSQLAddress, "localhost")
// 	os.Setenv(m.MYSQLPort, "70000")
//
// 	_, err = m.NewMySQLConnectionParametersFromEnvironment()
// 	assert.Error(err)
// 	be, ok := err.(*BadEnvVarError)
// 	assert.True(ok)
// 	assert.Equal(MYSQLPort, be.EnvVar)
// }
//
// func TestBadPortNotInteger(t *testing.T) {
// 	assert := assert.New(t)
//
// 	clearEnvVars()
// 	defer clearEnvVars()
//
// 	pwfile, err := ioutil.TempFile("", "pwfile")
// 	defer os.Remove(pwfile.Name())
// 	assert.NoError(err)
// 	pwfile.WriteString("foobar\n")
// 	pwfile.Close()
//
// 	os.Setenv(m.MYSQLUsername, "user1")
// 	os.Setenv(m.MYSQLPasswordFile, pwfile.Name())
// 	os.Setenv(m.MYSQLDatabase, "mydb")
// 	os.Setenv(m.MYSQLAddress, "localhost")
// 	os.Setenv(m.MYSQLPort, "I am not an integer")
//
// 	_, err = m.NewMySQLConnectionParametersFromEnvironment()
// 	assert.Error(err)
// 	be, ok := err.(*BadEnvVarError)
// 	assert.True(ok)
// 	assert.Equal(MYSQLPort, be.EnvVar)
// }

// func TestBadConnectionTimeoutNotInteger(t *testing.T) {
// 	assert := assert.New(t)
//
// 	clearEnvVars()
// 	defer clearEnvVars()
//
// 	pwfile, err := ioutil.TempFile("", "pwfile")
// 	defer os.Remove(pwfile.Name())
// 	assert.NoError(err)
// 	pwfile.WriteString("foobar\n")
// 	pwfile.Close()
//
// 	os.Setenv(MYSQLUsername, "user1")
// 	os.Setenv(MYSQLPasswordFile, pwfile.Name())
// 	os.Setenv(MYSQLDatabase, "mydb")
// 	os.Setenv(MYSQLAddress, "localhost")
// 	os.Setenv(MYSQLPort, "5432")
// 	os.Setenv(MYSQLConnectionTimeout, "I am not an integer")
//
// 	_, err = NewMysqlConnectionParametersFromEnvironment()
// 	assert.Error(err)
// 	be, ok := err.(*BadEnvVarError)
// 	assert.True(ok)
// 	assert.Equal(MYSQLConnectionTimeout, be.EnvVar)
// }

// func TestBadConnectionTimeoutLessThanZero(t *testing.T) {
// 	assert := assert.New(t)
//
// 	clearEnvVars()
// 	defer clearEnvVars()
//
// 	pwfile, err := ioutil.TempFile("", "pwfile")
// 	defer os.Remove(pwfile.Name())
// 	assert.NoError(err)
// 	pwfile.WriteString("foobar\n")
// 	pwfile.Close()
//
// 	os.Setenv(MYSQLUsername, "user1")
// 	os.Setenv(MYSQLPasswordFile, pwfile.Name())
// 	os.Setenv(MYSQLDatabase, "mydb")
// 	os.Setenv(MYSQLAddress, "localhost")
// 	os.Setenv(MYSQLPort, "5432")
// 	os.Setenv(MYSQLConnectionTimeout, "-1234")
//
// 	_, err = NewMysqlConnectionParametersFromEnvironment()
// 	assert.Error(err)
// 	be, ok := err.(*BadEnvVarError)
// 	assert.True(ok)
// 	assert.Equal(MYSQLConnectionTimeout, be.EnvVar)
// }

// func TestBadSSLMode(t *testing.T) {
// 	assert := assert.New(t)
//
// 	clearEnvVars()
// 	defer clearEnvVars()
//
// 	pwfile, err := ioutil.TempFile("", "pwfile")
// 	defer os.Remove(pwfile.Name())
// 	assert.NoError(err)
// 	pwfile.WriteString("foobar\n")
// 	pwfile.Close()
//
// 	os.Setenv(MYSQLUsername, "user1")
// 	os.Setenv(MYSQLPasswordFile, pwfile.Name())
// 	os.Setenv(MYSQLAddress, "localhost")
// 	os.Setenv(MYSQLPort, "5432")
// 	os.Setenv(MYSQLDatabase, "mydb")
// 	os.Setenv(MYSQLSSLMode, "I'm a bad mode")
//
// 	_, err = NewMysqlConnectionParametersFromEnvironment()
// 	assert.Error(err)
// 	be, ok := err.(*BadEnvVarError)
// 	assert.True(ok)
// 	assert.Equal(MYSQLSSLMode, be.EnvVar)
// }

// func TestBadCertFile(t *testing.T) {
// 	assert := assert.New(t)
//
// 	clearEnvVars()
// 	defer clearEnvVars()
//
// 	pwfile, err := ioutil.TempFile("", "pwfile")
// 	defer os.Remove(pwfile.Name())
// 	assert.NoError(err)
// 	pwfile.WriteString("foobar\n")
// 	pwfile.Close()
//
// 	os.Setenv(MYSQLUsername, "user1")
// 	os.Setenv(MYSQLPasswordFile, pwfile.Name())
// 	os.Setenv(MYSQLDatabase, "mydb")
// 	os.Setenv(MYSQLAddress, "localhost")
// 	os.Setenv(MYSQLPort, "5432")
// 	os.Setenv(MYSQLSSLMode, "require")
// 	os.Setenv(MYSQLCertificateFile, "I don't exist")
//
// 	_, err = NewMysqlConnectionParametersFromEnvironment()
// 	assert.Error(err)
// 	be, ok := err.(*BadEnvVarError)
// 	assert.True(ok)
// 	assert.Equal(MYSQLCertificateFile, be.EnvVar)
// }

// func TestBadKeyFile(t *testing.T) {
// 	assert := assert.New(t)
//
// 	clearEnvVars()
// 	defer clearEnvVars()
//
// 	pwfile, err := ioutil.TempFile("", "pwfile")
// 	defer os.Remove(pwfile.Name())
// 	assert.NoError(err)
// 	pwfile.WriteString("foobar\n")
// 	pwfile.Close()
//
// 	os.Setenv(MYSQLUsername, "user1")
// 	os.Setenv(MYSQLPasswordFile, pwfile.Name())
// 	os.Setenv(MYSQLDatabase, "mydb")
// 	os.Setenv(MYSQLAddress, "localhost")
// 	os.Setenv(MYSQLPort, "5432")
// 	os.Setenv(MYSQLSSLMode, "require")
// 	os.Setenv(MYSQLKeyFile, "I don't exist")
//
// 	_, err = NewMysqlConnectionParametersFromEnvironment()
// 	assert.Error(err)
// 	be, ok := err.(*BadEnvVarError)
// 	assert.True(ok)
// 	assert.Equal(MYSQLKeyFile, be.EnvVar)
// }

// func TestBadRootCertFile(t *testing.T) {
// 	assert := assert.New(t)
//
// 	clearEnvVars()
// 	defer clearEnvVars()
//
// 	pwfile, err := ioutil.TempFile("", "pwfile")
// 	defer os.Remove(pwfile.Name())
// 	assert.NoError(err)
// 	pwfile.WriteString("foobar\n")
// 	pwfile.Close()
//
// 	os.Setenv(MYSQLUsername, "user1")
// 	os.Setenv(MYSQLPasswordFile, pwfile.Name())
// 	os.Setenv(MYSQLDatabase, "mydb")
// 	os.Setenv(MYSQLAddress, "localhost")
// 	os.Setenv(MYSQLPort, "5432")
// 	os.Setenv(MYSQLSSLMode, "require")
// 	os.Setenv(MYSQLRootCertificateFile, "I don't exist")
//
// 	_, err = NewMysqlConnectionParametersFromEnvironment()
// 	assert.Error(err)
// 	be, ok := err.(*BadEnvVarError)
// 	assert.True(ok)
// 	assert.Equal(MYSQLRootCertificateFile, be.EnvVar)
// }

// func clearEnvVars() {
// 	for _, v := range []string{m.MYSQLUsername, m.MYSQLPasswordFile, m.MYSQLDatabase, m.MYSQLAddress, m.MYSQLPort} {
// 		os.Setenv(v, "")
// 	}
// }
