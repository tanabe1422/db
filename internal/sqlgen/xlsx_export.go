package sqlgen

// XlsxExportGenerator turns one *.table.json into xlsx bytes.
type XlsxExportGenerator interface {
	// Generate returns xlsx data and a relative output path (e.g. "src/db/users.xlsx").
	Generate(tableJSON []byte) (xlsx []byte, relPath string, err error)
}
