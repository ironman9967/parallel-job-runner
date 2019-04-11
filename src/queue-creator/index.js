
export const create = ({
	cluster,
	makeQueue,
	newId,
	workerCount,
	getJob,
	addPendingJob
}) => {
	let workerIndex = 1
	return {
		queue: makeQueue(({ job: { name, work }, start, data }, completeJob) => {
			if (cluster.isMaster) {
				const job = getJob(name)
				const workId = newId()
				const worker = cluster.workers[workerIndex]
				addPendingJob({
					workId,
					job: {
						start,
						completeJob
					}
				})
				worker.send({
					type: 'do-job',
					task: {
						job,
						workId,
						data
					}
				})
				if (workerIndex == workerCount) {
					workerIndex = 1
				}
				else {
					workerIndex++
				}
			}
		}, workerCount)
	}
}
