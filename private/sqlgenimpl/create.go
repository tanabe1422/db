//go:build sqlgen_create

package sqlgenimpl

import "errors"

type createGen struct{}

func newCreateGen() createGen { return createGen{} }

func (createGen) Generate(tableJSON []byte) (string, string, error) {
	_ = tableJSON
	return "", "", errors.New("createGen: not implemented")
}
