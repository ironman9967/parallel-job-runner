
export const create = ({
    getJob,
    sendMessageToMaster
}) => {
    return {
        handle: ({ type, ...msg }) => {
			switch (type) {
				case 'do-job':
					const { job: { jobIndex, workId, data } } = msg
					let prom = getJob(jobIndex).work(data)
					if (!(prom instanceof Promise)) {
						prom = Promise.resolve(prom)
					}
					const jobResult = {
						type: 'job-result',
						workId,
						jobIndex
					}
					prom.then(workResult => {
						sendMessageToMaster({
							...jobResult,
							success: true,
							workResult
						})
					})
					.catch(workResult => {
						sendMessageToMaster({
							...jobResult,
							success: false,
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
