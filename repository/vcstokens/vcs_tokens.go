package vcstokens

import (
	"bytes"
	"encoding/json"

	"github.com/hpcloud/portal-proxy/repository/vcs"
)

// VCSTokenRecord -
type VcsTokenRecord struct {
	Guid     string `json:"guid"`
	UserGuid string `json:"-"`
	VcsGuid  string `json:"vcs_guid"`
	Name     string `json:"name"`
	Token    string `json:"-"`
}

// repeatRune - return a string containing count repeats of r
func repeatRune(r rune, count int) string {
	if count < 1 {
		return ""
	}
	var bb bytes.Buffer
	rLen, _ := bb.WriteRune(r)
	bb.Grow((count - 1) * rLen)
	for i := 1; i < count; i++ {
		bb.WriteRune(r)
	}
	return bb.String()
}

// obfuscateString - return a copy of input where only the last n characters are left intact while the rest are replaced with replaceChar
func obfuscateString(token string, replaceChar rune, n int) string {
	tokenLen := len(token)
	ret := repeatRune(replaceChar, tokenLen - n)
	ret += token[tokenLen - n:]
	return ret
}

// Custom Marshal that obfuscates the Token to only show the last 3 characters
func (vr *VcsTokenRecord) MarshalJSON() ([]byte, error) {
	type Alias VcsTokenRecord
	return json.Marshal(&struct {
		Token string `json:"token"`
		*Alias
	}{
		Token: obfuscateString(vr.Token, '•', 3),
		Alias: (*Alias)(vr),
	})
}

// Used in the list call
type UserVcsToken struct {
	VcsToken *VcsTokenRecord `json:"token"`
	Vcs  *vcs.VcsRecord `json:"vcs"`
}

// Repository is an application of the repository pattern for storing tokens
type Repository interface {
	FindVcsToken(userGuid string, tokenGuid string, encryptionKey []byte) (*VcsTokenRecord, error)
	FindMatchingVcsToken(tr *VcsTokenRecord, encryptionKey []byte) (*VcsTokenRecord, error)
	ListVcsTokenByUser(userGuid string, encryptionKey []byte) ([]*UserVcsToken, error)
	SaveVcsToken(t *VcsTokenRecord, encryptionKey []byte) error
	DeleteVcsToken(userGuid string, tokenGuid string) error
	RenameVcsToken(userGuid string, tokenGuid string, tokenName string) error
}
