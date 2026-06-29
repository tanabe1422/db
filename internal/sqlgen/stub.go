package sqlgen

func init() {
	NewCreateScript = stubNewCreateScript
	NewMigrateScript = stubNewMigrateScript
	NewXlsxImport = stubNewXlsxImport
	NewXlsxExport = stubNewXlsxExport
}

func stubNewCreateScript() (CreateScriptGenerator, error) {
	return nil, ErrNotInstalled
}

func stubNewMigrateScript() (MigrateScriptGenerator, error) {
	return nil, ErrNotInstalled
}

func stubNewXlsxImport() (XlsxImportGenerator, error) {
	return nil, ErrNotInstalled
}

func stubNewXlsxExport() (XlsxExportGenerator, error) {
	return nil, ErrNotInstalled
}
