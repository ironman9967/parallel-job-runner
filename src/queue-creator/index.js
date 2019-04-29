
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
		queue: makeQueue(({
			pubEvent,
			job: {
				name,
				work
			},
			start,
			data
		}, completeJob) => {
			if (cluster.isMaster) {
				const job = getJob(name)
				const worker = cluster.workers[workerIndex]
				pubEvent({
					event: 'job-pending',
					name,
					timing: { start },
					workId: job.workId,
					data,
					worker: { pid: worker.process.pid }
				})
				addPendingJob({
					workId: job.workId,
					job: {
						start,
						pubEvent,
						completeJob
					}
				})
				worker.send({
					type: 'do-job',
					task: {
						job,
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
