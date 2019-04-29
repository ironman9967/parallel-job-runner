
export const create = ({
	cluster,
	queue,
	createSubject,
	addJob,
	newId,
	now
}) => {
	const unsubs = []
	return {
		createJob: job => {
			const {
				subscribe,
				filter,
				next: pubEvent
			} = createSubject()
			addJob(job)
			const wrapSubscribe = (subscribe, cb) => {
				const { unsubscribe } = subscribe(cb)
				unsubs.push(unsubscribe)
				return { unsubscribe }
			}
			return {
				observeJob: {
					subscribe: cb => wrapSubscribe(subscribe, cb),
					filter: cb => {
						const { subscribe } = filter(cb)
						return {
							subscribe: cb => wrapSubscribe(subscribe, cb)
						}
					}
				},
				startJob: data => new Promise((resolve, reject) => {
					if (cluster.isMaster) {
						const start = now()
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
		},
		dispose: () => Promise.all(unsubs.map(unsub => Promise.resolve(unsub)))
	}
}
