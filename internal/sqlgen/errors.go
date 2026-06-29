package sqlgen

import "errors"

var ErrNotInstalled = errors.New("sqlgen: 独自実装が未インストールです (private/sqlgenimpl/ にファイルを配置してください)")
