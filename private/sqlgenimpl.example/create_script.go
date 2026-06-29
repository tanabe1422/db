//go:build sqlgen_create_script

package sqlgenimpl

import "errors"

type createScriptGen struct{}

func newCreateScriptGen() createScriptGen { return createScriptGen{} }

func (createScriptGen) Generate(tableJSON []byte) (string, string, error) {
	_ = tableJSON
	return "", "", errors.New("createScriptGen: not implemented")
}
