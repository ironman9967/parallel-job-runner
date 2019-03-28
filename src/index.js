
import path from 'path'

import { importApp } from './import-app'
import { create } from './create'

export default ({ app }) => importApp(path.resolve(app))
	.then(app => app(create()))
