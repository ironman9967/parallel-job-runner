
export const create = ({
    getPendingJob,
    removePendingJob
}) => {
    return {
        handle: ({ type, ...res }) => {
        	switch (type) {
        		case 'job-result':
        			const { workId, success, workResult } = res
        			const { start, completeJob } = getPendingJob(workId)
        			if (typeof completeJob == 'function') {
        				completeJob({
        					success,
        					start,
        					duration: Date.now() - start,
        					workResult
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
