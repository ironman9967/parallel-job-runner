
export default ({
	cluster,
	makeQueue,
	newId,
	createSubject,
	createWorkerMessageHandler,
	createMasterMessageHandler,
	createWorkerSpawner,
	createQueue,
	createJobCreator,
    workerCount
} = {}) => {
	const jobs = []
	const pending = {}
	const getJob = name => jobs.find(j => j.name == name)
	const {
		handle: handleMessageFromWorker
	} = createWorkerMessageHandler({
		getPendingJob: workId => pending[workId],
		removePendingJob: workId => { delete pending[workId] }
	})
	const {
		handle: handleMessageFromMaster
	} = createMasterMessageHandler({
		getJob,
		sendMessageToMaster: (...args) => process.send.apply(process, args)
	})
	const {
		spawnWorkers,
		killWorkers
	} = createWorkerSpawner({
	    cluster,
	    listenToMaster: (...args) => process.on.apply(process, args),
        workerCount,
        handleMessageFromWorker,
        handleMessageFromMaster
	})
	return spawnWorkers().then(() => {
		const { queue } = createQueue({
		    cluster,
		    makeQueue,
		    workerCount,
	        getJob,
	        addPendingJob: ({ workId, job }) => pending[workId] = job
		})
	    const { createJob } = createJobCreator({
	        cluster,
	        queue,
		    newId,
			createSubject,
	        addJob: job => {
	        	if (cluster.isMaster && getJob(job.name)) {
	        		throw new Error(`job name '${job.name}' is already created, job names must be unique`)
	        	}
	        	jobs.push(job)
	        }
	    })
	    return {
	    	meta: {
	    		workerCount,
	    		isMaster: cluster.isMaster
	    	},
	        createJob,
	        dispose: () => killWorkers()
	    }
	})
}
