
export const create = ({
    getJob,
    sendMessageToMaster
}) => {
    return {
        handle: ({ type, ...msg }) => {
			switch (type) {
				case 'do-job':
					const { task: { job: { name }, workId, data } } = msg
					let prom = getJob(name).work(data)
					if (!(prom instanceof Promise)) {
						prom = Promise.resolve(prom)
					}
					const jobResult = {
						type: 'job-result',
						name,
						workId
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
