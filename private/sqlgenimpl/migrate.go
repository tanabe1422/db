//go:build sqlgen_migrate

package sqlgenimpl

import "errors"

type migrateGen struct{}

func newMigrateGen() migrateGen { return migrateGen{} }

func (migrateGen) Generate(beforeJSON, afterJSON []byte) (string, string, error) {
	_, _ = beforeJSON, afterJSON
	return "", "", errors.New("migrateGen: not implemented")
}
