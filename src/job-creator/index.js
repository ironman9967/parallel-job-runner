
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
		const workId = newId()
		addJob({ ...job, workId })
		return {
			observeJob: { subscribe, filter },
			startJob: data => new Promise((resolve, reject) => {
				if (cluster.isMaster) {
					const start = Date.now()
					pubEvent({
						event: 'job-queued',
						name: job.name,
						timing: { start },
						workId,
						data
					})
					queue.push({
						pubEvent,
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
