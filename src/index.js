
import os from 'os'
import path from 'path'
import cluster from 'cluster'

import { queue as makeQueue } from 'async'
import newId from 'uuid/v1'

import { importApp } from './import-app'
import { create as createWorkerMessageHandler } from './worker-message-handler'
import { create as createMasterMessageHandler } from './master-message-handler'
import { spawnWorkers } from './worker-spawner'
import { create as createQueue } from './queue-creator'
import { create as createJobCreator } from './job-creator'

export default ({ 
    app,
    workerCount = os.cpus().length - 1
}) => importApp(path.resolve(app)).then(app => {
	const jobs = []
	const pending = {}
	const {
		handle: handleMessageFromWorker
	} = createWorkerMessageHandler({
		getPendingJob: workId => pending[workId],
		removePendingJob: workId => { delete pending[workId] }
	})
	const {
		handle: handleMessageFromMaster
	} = createMasterMessageHandler({
		getJob: jobIndex => jobs[jobIndex],
		sendMessageToMaster: (...args) => process.send.apply(process, args)
	})
	spawnWorkers({
	    cluster,
	    listenToMaster: (...args) => process.on.apply(process, args),
        workerCount,
        handleMessageFromWorker,
        handleMessageFromMaster
	})
	const { queue } = createQueue({
	    cluster,
	    makeQueue,
	    newId,
	    workerCount,
        getJobIndex: work => jobs.findIndex(j => j.work === work),
        addPendingJob: ({ workId, job }) => pending[workId] = job
	})
    const { createJob } = createJobCreator({ 
        cluster,
        queue,
        addJob: job => jobs.push(job)
    })
    app({
    	meta: {
    		workerCount
    	},
        createJob
    })
})
