
export const spawnWorkers = ({
	cluster,
	listenToMaster,
	workerCount,
	handleMessageFromWorker,
	handleMessageFromMaster
}) => {
	if (cluster.isMaster) {
		for (let i = 0; i < workerCount; i++) {
			const worker = cluster.fork()
			worker.on('message', handleMessageFromWorker)
		}
	}
	else {
		listenToMaster('message', handleMessageFromMaster)
	}
}
