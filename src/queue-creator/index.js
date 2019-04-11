
export const create = ({
	cluster,
	makeQueue,
	newId,
	workerCount,
	getJobIndex,
	addPendingJob
}) => {
	let workerIndex = 1
	return {
		queue: makeQueue(({ job: { work }, start, data }, completeJob) => {
			if (cluster.isMaster) {
				const jobIndex = getJobIndex(work)
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
					job: {
						jobIndex,
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
