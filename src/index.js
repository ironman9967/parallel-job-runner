
import os from 'os'
import cluster from 'cluster'

import { queue as makeQueue } from 'async'
import newId from 'uuid/v1'

import { create as createWorkerMessageHandler } from './worker-message-handler'
import { create as createMasterMessageHandler } from './master-message-handler'
import { create as createWorkerSpawner } from './worker-spawner'
import { create as createQueue } from './queue-creator'
import { create as createJobCreator } from './job-creator'

export default ({ 
    workerCount = os.cpus().length - 1
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
		    newId,
		    workerCount,
	        getJob,
	        addPendingJob: ({ workId, job }) => pending[workId] = job
		})
	    const { createJob } = createJobCreator({ 
	        cluster,
	        queue,
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
