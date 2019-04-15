
export const create = ({
	cluster,
	queue,
	addJob
}) => ({
	createJob: job => {
		addJob(job)
		return {
			startJob: data => new Promise((resolve, reject) => {
				if (cluster.isMaster) {
					queue.push({
						job,
						start: Date.now(),
						data
					}, res => res.meta.success
						? resolve(res)
						: reject(res))
				}
			})
		}
	}
})
