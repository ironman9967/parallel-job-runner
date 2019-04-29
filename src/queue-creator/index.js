
export const create = ({
	cluster,
	makeQueue,
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
			workId,
			start,
			data
		}, completeJob) => {
			if (cluster.isMaster) {
				const job = getJob(name)
				const worker = cluster.workers[workerIndex]
				pubEvent({
					event: 'job-performing',
					name,
					timing: { start },
					workId,
					data,
					worker: { pid: worker.process.pid }
				})
				addPendingJob({
					workId,
					job: {
						start,
						pubEvent,
						completeJob
					}
				})
				worker.send({
					type: 'do-job',
					task: {
						job: { ...job, workId },
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
