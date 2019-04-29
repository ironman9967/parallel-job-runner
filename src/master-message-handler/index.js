
export const create = ({
    getJob,
    sendMessageToMaster
}) => {
    return {
        handle: ({ type, ...msg }) => {
			switch (type) {
				case 'do-job':
					const { task: { job: { name, workId }, data } } = msg
					let prom = getJob(name).work(data)
					if (!(prom instanceof Promise)) {
						prom = Promise.resolve(prom)
					}
					const jobResult = {
						type: 'job-result',
						name,
						workId,
						worker: {
							pid: process.pid
						}
					}
					prom.then(workResult => {
						sendMessageToMaster({
							...jobResult,
							success: true,
							data,
							workResult
						})
					})
					.catch(workResult => {
						sendMessageToMaster({
							...jobResult,
							success: false,
							data,
							workResult
						})
					})
				break;
				default:
					throw new Error(`unknown message type from master: ${type}`)
			}
		}
    }
}
