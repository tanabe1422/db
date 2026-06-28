package tabledef

type TableDefinition struct {
	SchemaVersion int      `json:"schemaVersion"`
	Name          string   `json:"name"`
	NameJa        string   `json:"nameJa,omitempty"`
	Description   string   `json:"description,omitempty"`
	PrimaryKey    []string `json:"primaryKey,omitempty"`
	Columns       []Column `json:"columns"`
	Indexes       []Index  `json:"indexes,omitempty"`
}

type Column struct {
	Name         string `json:"name"`
	NameJa       string `json:"nameJa,omitempty"`
	DataType     string `json:"dataType"`
	NotNull      bool   `json:"notNull,omitempty"`
	DefaultValue any    `json:"defaultValue,omitempty"`
	Length       *int   `json:"length,omitempty"`
	Precision    *int   `json:"precision,omitempty"`
	Scale        *int   `json:"scale,omitempty"`
	Unique       bool   `json:"unique,omitempty"`
}

type Index struct {
	Keys    []IndexKey `json:"keys"`
	Include []string   `json:"include,omitempty"`
}

type IndexKey struct {
	Column string `json:"column"`
	Order  string `json:"order,omitempty"`
}
