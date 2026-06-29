package sqlgen

// MigrateScriptGenerator compares two *.table.json files and emits schema migration SQL.
type MigrateScriptGenerator interface {
	// Generate returns SQL and a relative output path (e.g. "src/db/users.migrate.sql").
	Generate(beforeJSON, afterJSON []byte) (sql string, relPath string, err error)
}
