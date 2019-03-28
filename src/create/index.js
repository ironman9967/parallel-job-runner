
import os from 'os'
import cluster from 'cluster'

import { queue } from 'async'

import { perform } from '../perform'
import { start } from '../start'

export const create = () => {
	let q
	if (cluster.isMaster) {
		q = queue((notUsed, cb) => cluster.isMaster 
			? start().then(cb).catch(cb)
			: void 0, os.cpus().length - 1)
	}
	return {
		createJob: ({ job }) => ({
			startJob: data => new Promise((resolve, reject) => {
				if (cluster.isMaster) {
					
					console.log('master', process.pid)
					
					q.push(void 0, res => res instanceof Error
						? reject(res)
						: resolve(res))
				}
				else {
					perform(job)(data)
				}
			})
		})
	}
}
