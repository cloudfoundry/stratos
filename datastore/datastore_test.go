package datastore

// import (
// 	"fmt"
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
// 	clearEnvVars("")
// 	defer clearEnvVars("")
//
// 	pwfile, err := ioutil.TempFile("", "pwfile")
// 	defer os.Remove(pwfile.Name())
// 	assert.NoError(err)
// 	pwfile.WriteString("foobar\n")
// 	pwfile.Close()
//
// 	os.Setenv(PGSQLUser, "user1")
// 	os.Setenv(PGSQLPasswordFile, pwfile.Name())
// 	os.Setenv(PGSQLHost, "localhost")
// 	os.Setenv(PGSQLPort, "5432")
// 	os.Setenv(PGSQLDatabase, "mydb")
// 	os.Setenv(PGSQLConnectionTimeout, "5")
//
// 	connParams, err := NewPostgresConnectionParametersFromEnvironment("")
// 	assert.NoError(err)
//
// 	connStr := buildConnectionString(connParams)
//
// 	assert.Equal(`user='user1' password='foobar' dbname='mydb' host=localhost port=5432 connect_timeout=5`, connStr)
// }
//
// func TestBuildConnStrSSL(t *testing.T) {
// 	assert := assert.New(t)
//
// 	clearEnvVars("")
// 	defer clearEnvVars("")
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
// 	os.Setenv(PGSQLUser, "user1")
// 	os.Setenv(PGSQLPasswordFile, pwfile.Name())
// 	os.Setenv(PGSQLDatabase, "mydb")
// 	os.Setenv(PGSQLHost, "localhost")
// 	os.Setenv(PGSQLPort, "5432")
// 	os.Setenv(PGSQLSSLMode, "require")
// 	os.Setenv(PGSQLCertificateFile, certFile.Name())
// 	os.Setenv(PGSQLKeyFile, keyFile.Name())
// 	os.Setenv(PGSQLRootCertificateFile, rootCertFile.Name())
//
// 	connParams, err := NewPostgresConnectionParametersFromEnvironment("")
// 	assert.NoError(err)
//
// 	connStr := buildConnectionString(connParams)
//
// 	expected := fmt.Sprintf("user='user1' password='foobar' dbname='mydb' host=localhost port=5432 connect_timeout=10 sslmode=require sslcert='%s' sslkey='%s' sslrootcert='%s'", certFile.Name(), keyFile.Name(), rootCertFile.Name())
// 	assert.Equal(expected, connStr)
// }
//
// func TestBuildConnStrSSLWithPrefix(t *testing.T) {
// 	assert := assert.New(t)
// 	prefix := "IPFOO_"
//
// 	clearEnvVars(prefix)
// 	defer clearEnvVars(prefix)
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
// 	os.Setenv(prefix+PGSQLUser, "user1")
// 	os.Setenv(prefix+PGSQLPasswordFile, pwfile.Name())
// 	os.Setenv(prefix+PGSQLDatabase, "mydb")
// 	os.Setenv(prefix+PGSQLHost, "localhost")
// 	os.Setenv(prefix+PGSQLPort, "5432")
// 	os.Setenv(prefix+PGSQLSSLMode, "require")
// 	os.Setenv(prefix+PGSQLCertificateFile, certFile.Name())
// 	os.Setenv(prefix+PGSQLKeyFile, keyFile.Name())
// 	os.Setenv(prefix+PGSQLRootCertificateFile, rootCertFile.Name())
//
// 	connParams, err := NewPostgresConnectionParametersFromEnvironment(prefix)
// 	assert.NoError(err)
//
// 	connStr := buildConnectionString(connParams)
//
// 	expected := fmt.Sprintf("user='user1' password='foobar' dbname='mydb' host=localhost port=5432 connect_timeout=10 sslmode=require sslcert='%s' sslkey='%s' sslrootcert='%s'", certFile.Name(), keyFile.Name(), rootCertFile.Name())
// 	assert.Equal(expected, connStr)
// }
//
// func TestBuildConnStrSSLDisabledIgnoresCerts(t *testing.T) {
// 	assert := assert.New(t)
//
// 	clearEnvVars("")
// 	defer clearEnvVars("")
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
// 	os.Setenv(PGSQLUser, "user1")
// 	os.Setenv(PGSQLPasswordFile, pwfile.Name())
// 	os.Setenv(PGSQLDatabase, "mydb")
// 	os.Setenv(PGSQLHost, "localhost")
// 	os.Setenv(PGSQLPort, "5432")
// 	os.Setenv(PGSQLSSLMode, "disable")
// 	os.Setenv(PGSQLCertificateFile, certFile.Name())
// 	os.Setenv(PGSQLKeyFile, keyFile.Name())
// 	os.Setenv(PGSQLRootCertificateFile, rootCertFile.Name())
//
// 	connParams, err := NewPostgresConnectionParametersFromEnvironment("")
// 	assert.NoError(err)
//
// 	connStr := buildConnectionString(connParams)
//
// 	expected := fmt.Sprintf("user='user1' password='foobar' dbname='mydb' host=localhost port=5432 connect_timeout=10 sslmode=disable")
// 	assert.Equal(expected, connStr)
// }
//
// func TestBadPWFile(t *testing.T) {
// 	assert := assert.New(t)
//
// 	clearEnvVars("")
// 	defer clearEnvVars("")
//
// 	os.Setenv(PGSQLUser, "user1")
// 	os.Setenv(PGSQLPasswordFile, "I do not exist")
// 	os.Setenv(PGSQLDatabase, "mydb")
// 	os.Setenv(PGSQLHost, "localhost")
// 	os.Setenv(PGSQLPort, "5432")
//
// 	_, err := NewPostgresConnectionParametersFromEnvironment("")
// 	assert.Error(err)
// 	be, ok := err.(*BadEnvVarError)
// 	assert.True(ok)
// 	assert.Equal(PGSQLPasswordFile, be.EnvVar)
// }
//
// func TestMissingUser(t *testing.T) {
// 	assert := assert.New(t)
//
// 	clearEnvVars("")
// 	defer clearEnvVars("")
//
// 	_, err := NewPostgresConnectionParametersFromEnvironment("")
// 	assert.Error(err)
// 	me, ok := err.(*MissingEnvVarError)
// 	assert.True(ok)
// 	assert.Equal(PGSQLUser, me.EnvVar)
// }
//
// func TestMissingPWFile(t *testing.T) {
// 	assert := assert.New(t)
//
// 	clearEnvVars("")
// 	defer clearEnvVars("")
//
// 	os.Setenv(PGSQLUser, "user1")
// 	os.Setenv(PGSQLDatabase, "mydb")
// 	os.Setenv(PGSQLHost, "localhost")
// 	os.Setenv(PGSQLPort, "5432")
//
// 	_, err := NewPostgresConnectionParametersFromEnvironment("")
// 	assert.Error(err)
// 	me, ok := err.(*MissingEnvVarError)
// 	assert.True(ok)
// 	assert.Equal(PGSQLPasswordFile, me.EnvVar)
// }
//
// func TestMissingDatabase(t *testing.T) {
// 	assert := assert.New(t)
//
// 	clearEnvVars("")
// 	defer clearEnvVars("")
//
// 	pwfile, err := ioutil.TempFile("", "pwfile")
// 	defer os.Remove(pwfile.Name())
// 	assert.NoError(err)
// 	pwfile.WriteString("foobar\n")
// 	pwfile.Close()
//
// 	os.Setenv(PGSQLUser, "user1")
// 	os.Setenv(PGSQLPasswordFile, pwfile.Name())
// 	os.Setenv(PGSQLHost, "localhost")
// 	os.Setenv(PGSQLPort, "5432")
//
// 	_, err = NewPostgresConnectionParametersFromEnvironment("")
// 	assert.Error(err)
// 	me, ok := err.(*MissingEnvVarError)
// 	assert.True(ok)
// 	assert.Equal(PGSQLDatabase, me.EnvVar)
// }
//
// func TestMissingHost(t *testing.T) {
// 	assert := assert.New(t)
//
// 	clearEnvVars("")
// 	defer clearEnvVars("")
//
// 	pwfile, err := ioutil.TempFile("", "pwfile")
// 	defer os.Remove(pwfile.Name())
// 	assert.NoError(err)
// 	pwfile.WriteString("foobar\n")
// 	pwfile.Close()
//
// 	os.Setenv(PGSQLUser, "user1")
// 	os.Setenv(PGSQLPasswordFile, pwfile.Name())
// 	os.Setenv(PGSQLDatabase, "mydb")
// 	os.Setenv(PGSQLPort, "5432")
//
// 	_, err = NewPostgresConnectionParametersFromEnvironment("")
// 	assert.Error(err)
// 	me, ok := err.(*MissingEnvVarError)
// 	assert.True(ok)
// 	assert.Equal(PGSQLHost, me.EnvVar)
// }
//
// func TestMissingPort(t *testing.T) {
// 	assert := assert.New(t)
//
// 	clearEnvVars("")
// 	defer clearEnvVars("")
//
// 	pwfile, err := ioutil.TempFile("", "pwfile")
// 	defer os.Remove(pwfile.Name())
// 	assert.NoError(err)
// 	pwfile.WriteString("foobar\n")
// 	pwfile.Close()
//
// 	os.Setenv(PGSQLUser, "user1")
// 	os.Setenv(PGSQLPasswordFile, pwfile.Name())
// 	os.Setenv(PGSQLDatabase, "mydb")
// 	os.Setenv(PGSQLHost, "localhost")
//
// 	_, err = NewPostgresConnectionParametersFromEnvironment("")
// 	assert.Error(err)
// 	me, ok := err.(*MissingEnvVarError)
// 	assert.True(ok)
// 	assert.Equal(PGSQLPort, me.EnvVar)
// }
//
// func TestBadPortBelow1(t *testing.T) {
// 	assert := assert.New(t)
//
// 	clearEnvVars("")
// 	defer clearEnvVars("")
//
// 	pwfile, err := ioutil.TempFile("", "pwfile")
// 	defer os.Remove(pwfile.Name())
// 	assert.NoError(err)
// 	pwfile.WriteString("foobar\n")
// 	pwfile.Close()
//
// 	os.Setenv(PGSQLUser, "user1")
// 	os.Setenv(PGSQLPasswordFile, pwfile.Name())
// 	os.Setenv(PGSQLDatabase, "mydb")
// 	os.Setenv(PGSQLHost, "localhost")
// 	os.Setenv(PGSQLPort, "-1")
//
// 	_, err = NewPostgresConnectionParametersFromEnvironment("")
// 	assert.Error(err)
// 	be, ok := err.(*BadEnvVarError)
// 	assert.True(ok)
// 	assert.Equal(PGSQLPort, be.EnvVar)
// }
//
// func TestBadPortAbove65535(t *testing.T) {
// 	assert := assert.New(t)
//
// 	clearEnvVars("")
// 	defer clearEnvVars("")
//
// 	pwfile, err := ioutil.TempFile("", "pwfile")
// 	defer os.Remove(pwfile.Name())
// 	assert.NoError(err)
// 	pwfile.WriteString("foobar\n")
// 	pwfile.Close()
//
// 	os.Setenv(PGSQLUser, "user1")
// 	os.Setenv(PGSQLPasswordFile, pwfile.Name())
// 	os.Setenv(PGSQLDatabase, "mydb")
// 	os.Setenv(PGSQLHost, "localhost")
// 	os.Setenv(PGSQLPort, "70000")
//
// 	_, err = NewPostgresConnectionParametersFromEnvironment("")
// 	assert.Error(err)
// 	be, ok := err.(*BadEnvVarError)
// 	assert.True(ok)
// 	assert.Equal(PGSQLPort, be.EnvVar)
// }
//
// func TestBadPortNotInteger(t *testing.T) {
// 	assert := assert.New(t)
//
// 	clearEnvVars("")
// 	defer clearEnvVars("")
//
// 	pwfile, err := ioutil.TempFile("", "pwfile")
// 	defer os.Remove(pwfile.Name())
// 	assert.NoError(err)
// 	pwfile.WriteString("foobar\n")
// 	pwfile.Close()
//
// 	os.Setenv(PGSQLUser, "user1")
// 	os.Setenv(PGSQLPasswordFile, pwfile.Name())
// 	os.Setenv(PGSQLDatabase, "mydb")
// 	os.Setenv(PGSQLHost, "localhost")
// 	os.Setenv(PGSQLPort, "I am not an integer")
//
// 	_, err = NewPostgresConnectionParametersFromEnvironment("")
// 	assert.Error(err)
// 	be, ok := err.(*BadEnvVarError)
// 	assert.True(ok)
// 	assert.Equal(PGSQLPort, be.EnvVar)
// }
//
// func TestBadConnectionTimeoutNotInteger(t *testing.T) {
// 	assert := assert.New(t)
//
// 	clearEnvVars("")
// 	defer clearEnvVars("")
//
// 	pwfile, err := ioutil.TempFile("", "pwfile")
// 	defer os.Remove(pwfile.Name())
// 	assert.NoError(err)
// 	pwfile.WriteString("foobar\n")
// 	pwfile.Close()
//
// 	os.Setenv(PGSQLUser, "user1")
// 	os.Setenv(PGSQLPasswordFile, pwfile.Name())
// 	os.Setenv(PGSQLDatabase, "mydb")
// 	os.Setenv(PGSQLHost, "localhost")
// 	os.Setenv(PGSQLPort, "5432")
// 	os.Setenv(PGSQLConnectionTimeout, "I am not an integer")
//
// 	_, err = NewPostgresConnectionParametersFromEnvironment("")
// 	assert.Error(err)
// 	be, ok := err.(*BadEnvVarError)
// 	assert.True(ok)
// 	assert.Equal(PGSQLConnectionTimeout, be.EnvVar)
// }
//
// func TestBadConnectionTimeoutLessThanZero(t *testing.T) {
// 	assert := assert.New(t)
//
// 	clearEnvVars("")
// 	defer clearEnvVars("")
//
// 	pwfile, err := ioutil.TempFile("", "pwfile")
// 	defer os.Remove(pwfile.Name())
// 	assert.NoError(err)
// 	pwfile.WriteString("foobar\n")
// 	pwfile.Close()
//
// 	os.Setenv(PGSQLUser, "user1")
// 	os.Setenv(PGSQLPasswordFile, pwfile.Name())
// 	os.Setenv(PGSQLDatabase, "mydb")
// 	os.Setenv(PGSQLHost, "localhost")
// 	os.Setenv(PGSQLPort, "5432")
// 	os.Setenv(PGSQLConnectionTimeout, "-1234")
//
// 	_, err = NewPostgresConnectionParametersFromEnvironment("")
// 	assert.Error(err)
// 	be, ok := err.(*BadEnvVarError)
// 	assert.True(ok)
// 	assert.Equal(PGSQLConnectionTimeout, be.EnvVar)
// }
//
// func TestBadSSLMode(t *testing.T) {
// 	assert := assert.New(t)
//
// 	clearEnvVars("")
// 	defer clearEnvVars("")
//
// 	pwfile, err := ioutil.TempFile("", "pwfile")
// 	defer os.Remove(pwfile.Name())
// 	assert.NoError(err)
// 	pwfile.WriteString("foobar\n")
// 	pwfile.Close()
//
// 	os.Setenv(PGSQLUser, "user1")
// 	os.Setenv(PGSQLPasswordFile, pwfile.Name())
// 	os.Setenv(PGSQLHost, "localhost")
// 	os.Setenv(PGSQLPort, "5432")
// 	os.Setenv(PGSQLDatabase, "mydb")
// 	os.Setenv(PGSQLSSLMode, "I'm a bad mode")
//
// 	_, err = NewPostgresConnectionParametersFromEnvironment("")
// 	assert.Error(err)
// 	be, ok := err.(*BadEnvVarError)
// 	assert.True(ok)
// 	assert.Equal(PGSQLSSLMode, be.EnvVar)
// }
//
// func TestBadCertFile(t *testing.T) {
// 	assert := assert.New(t)
//
// 	clearEnvVars("")
// 	defer clearEnvVars("")
//
// 	pwfile, err := ioutil.TempFile("", "pwfile")
// 	defer os.Remove(pwfile.Name())
// 	assert.NoError(err)
// 	pwfile.WriteString("foobar\n")
// 	pwfile.Close()
//
// 	os.Setenv(PGSQLUser, "user1")
// 	os.Setenv(PGSQLPasswordFile, pwfile.Name())
// 	os.Setenv(PGSQLDatabase, "mydb")
// 	os.Setenv(PGSQLHost, "localhost")
// 	os.Setenv(PGSQLPort, "5432")
// 	os.Setenv(PGSQLSSLMode, "require")
// 	os.Setenv(PGSQLCertificateFile, "I don't exist")
//
// 	_, err = NewPostgresConnectionParametersFromEnvironment("")
// 	assert.Error(err)
// 	be, ok := err.(*BadEnvVarError)
// 	assert.True(ok)
// 	assert.Equal(PGSQLCertificateFile, be.EnvVar)
// }
//
// func TestBadKeyFile(t *testing.T) {
// 	assert := assert.New(t)
//
// 	clearEnvVars("")
// 	defer clearEnvVars("")
//
// 	pwfile, err := ioutil.TempFile("", "pwfile")
// 	defer os.Remove(pwfile.Name())
// 	assert.NoError(err)
// 	pwfile.WriteString("foobar\n")
// 	pwfile.Close()
//
// 	os.Setenv(PGSQLUser, "user1")
// 	os.Setenv(PGSQLPasswordFile, pwfile.Name())
// 	os.Setenv(PGSQLDatabase, "mydb")
// 	os.Setenv(PGSQLHost, "localhost")
// 	os.Setenv(PGSQLPort, "5432")
// 	os.Setenv(PGSQLSSLMode, "require")
// 	os.Setenv(PGSQLKeyFile, "I don't exist")
//
// 	_, err = NewPostgresConnectionParametersFromEnvironment("")
// 	assert.Error(err)
// 	be, ok := err.(*BadEnvVarError)
// 	assert.True(ok)
// 	assert.Equal(PGSQLKeyFile, be.EnvVar)
// }
//
// func TestBadRootCertFile(t *testing.T) {
// 	assert := assert.New(t)
//
// 	clearEnvVars("")
// 	defer clearEnvVars("")
//
// 	pwfile, err := ioutil.TempFile("", "pwfile")
// 	defer os.Remove(pwfile.Name())
// 	assert.NoError(err)
// 	pwfile.WriteString("foobar\n")
// 	pwfile.Close()
//
// 	os.Setenv(PGSQLUser, "user1")
// 	os.Setenv(PGSQLPasswordFile, pwfile.Name())
// 	os.Setenv(PGSQLDatabase, "mydb")
// 	os.Setenv(PGSQLHost, "localhost")
// 	os.Setenv(PGSQLPort, "5432")
// 	os.Setenv(PGSQLSSLMode, "require")
// 	os.Setenv(PGSQLRootCertificateFile, "I don't exist")
//
// 	_, err = NewPostgresConnectionParametersFromEnvironment("")
// 	assert.Error(err)
// 	be, ok := err.(*BadEnvVarError)
// 	assert.True(ok)
// 	assert.Equal(PGSQLRootCertificateFile, be.EnvVar)
// }
//
// func clearEnvVars(prefix string) {
// 	for _, v := range []string{PGSQLUser, PGSQLPasswordFile, PGSQLDatabase, PGSQLHost, PGSQLPort,
// 		PGSQLSSLMode, PGSQLCertificateFile, PGSQLKeyFile, PGSQLRootCertificateFile, PGSQLConnectionTimeout} {
//
// 		os.Setenv(prefix+v, "")
// 	}
// }
