package sqlgen

// CreateScriptGenerator turns one *.table.json into DDL SQL (CREATE TABLE, etc.).
type CreateScriptGenerator interface {
	// Generate returns SQL and a relative output path (e.g. "src/db/users.sql").
	Generate(tableJSON []byte) (sql string, relPath string, err error)
}
