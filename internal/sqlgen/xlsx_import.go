package sqlgen

// XlsxImportGenerator turns one xlsx file into *.table.json bytes.
type XlsxImportGenerator interface {
	// Generate returns table JSON and a relative output path (e.g. "src/db/users.table.json").
	Generate(xlsx []byte) (tableJSON []byte, relPath string, err error)
}
