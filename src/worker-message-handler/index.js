
export const create = ({
    getPendingJob,
    removePendingJob
}) => {
    return {
        handle: ({ type, ...res }) => {
        	switch (type) {
        		case 'job-result':
        			const {
						name,
						workId,
						worker,
						success,
						workResult
					} = res
        			const { start, completeJob } = getPendingJob(workId)
        			if (typeof completeJob == 'function') {
        				completeJob({
							meta: {
								success,
								timing: { start, duration: Date.now() - start },
								worker
							},
        					result: workResult
        				})
        				removePendingJob(workId)
        			}
        			else {
        				throw new Error(`unknown job-result workId: ${workId}`)
        			}
        			break;
        		default:
        			throw new Error(`unknown worker message type: ${type}`)
        	}
        }
    }
}
