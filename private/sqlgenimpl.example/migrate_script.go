//go:build sqlgen_migrate_script

package sqlgenimpl

import "errors"

type migrateScriptGen struct{}

func newMigrateScriptGen() migrateScriptGen { return migrateScriptGen{} }

func (migrateScriptGen) Generate(beforeJSON, afterJSON []byte) (string, string, error) {
	_, _ = beforeJSON, afterJSON
	return "", "", errors.New("migrateScriptGen: not implemented")
}
