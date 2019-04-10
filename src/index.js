
import path from 'path'

import { importApp } from './import-app'

export default ({ app }) => importApp(path.resolve(app)).then(app => app())
