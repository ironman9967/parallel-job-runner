
export const create = ({
	cluster,
	queue,
	createSubject,
	addJob,
	newId
}) => ({
	createJob: job => {
		const {
			subscribe,
			filter,
			next: pubEvent
		} = createSubject()
		addJob(job)
		return {
			observeJob: { subscribe, filter },
			startJob: data => new Promise((resolve, reject) => {
				if (cluster.isMaster) {
					const start = Date.now()
					const workId = newId()
					pubEvent({
						event: 'job-queued',
						name: job.name,
						timing: { start },
						workId,
						data
					})
					queue.push({
						pubEvent,
						workId,
						job,
						start,
						data
					}, res => res.meta.success
						? resolve(res)
						: reject(res))
				}
			})
		}
	}
})
