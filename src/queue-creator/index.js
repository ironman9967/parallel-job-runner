
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
				const timing = { start }
				if (worker) {
					pubEvent({
						event: 'job-performing',
						name,
						timing,
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
				}
				else {
					const error = new Error('worker disposed')
					pubEvent({
						event: 'job-cancelled',
						name,
						timing,
						workId,
						data,
						error
					})
					completeJob({
						meta: {
							success: false,
							timing,
							workId
						},
						result: error
					})
				}
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
