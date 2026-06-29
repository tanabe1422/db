package sqlgen

var (
	NewCreateScript  func() (CreateScriptGenerator, error)
	NewMigrateScript func() (MigrateScriptGenerator, error)
	NewXlsxImport    func() (XlsxImportGenerator, error)
	NewXlsxExport    func() (XlsxExportGenerator, error)
)

func RegisterCreateScript(newFn func() (CreateScriptGenerator, error)) {
	NewCreateScript = newFn
}

func RegisterMigrateScript(newFn func() (MigrateScriptGenerator, error)) {
	NewMigrateScript = newFn
}

func RegisterXlsxImport(newFn func() (XlsxImportGenerator, error)) {
	NewXlsxImport = newFn
}

func RegisterXlsxExport(newFn func() (XlsxExportGenerator, error)) {
	NewXlsxExport = newFn
}
