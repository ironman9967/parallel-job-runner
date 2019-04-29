
export const create = ({
	now,
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
						data,
						workResult
					} = res
        			const {
						start,
						pubEvent,
						completeJob
					} = getPendingJob(workId)
        			if (typeof completeJob == 'function') {
						const timing = { start, duration: now() - start }
						pubEvent({
							event: 'job-complete',
							name,
							timing,
							workId,
							data,
							worker,
							result: workResult,
							success
						})
        				completeJob({
							meta: {
								success,
								timing,
								workId,
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
