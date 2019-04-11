
export const create = ({
	cluster,
	listenToMaster,
	workerCount,
	handleMessageFromWorker,
	handleMessageFromMaster
}) => {
	const mapWorkers = mapping => cluster.isMaster
		? Object.keys(cluster.workers).map(k => mapping(cluster.workers[k]))
		: []
	return {
		spawnWorkers: () => {
			if (cluster.isMaster) {
				for (let i = 0; i < workerCount; i++) {
					const w = cluster.fork()
				}
				return Promise.all(mapWorkers(w => new Promise(resolve => {
					w.on('message', handleMessageFromWorker)
					w.on('online', resolve)
				})))
			}
			listenToMaster('message', handleMessageFromMaster)
			return Promise.resolve()
		},
		killWorkers: () => Promise.all(mapWorkers(w => new Promise(resolve => {
			w.on('exit', () => {
				w.removeAllListeners()
				resolve()
			})
			w.kill()
		})))
	}
}
