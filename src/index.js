
import '@babel/polyfill'

import os from 'os'
import cluster from 'cluster'

import { queue as makeQueue } from 'async'
import newId from 'uuid/v1'

import { create as createWorkerMessageHandler } from './worker-message-handler'
import { create as createMasterMessageHandler } from './master-message-handler'
import { create as createWorkerSpawner } from './worker-spawner'
import { create as createQueue } from './queue-creator'
import { create as createJobCreator } from './job-creator'

import manager from './manager'

export default async ({
	workerCount = os.cpus().length - 1
} = {}) => {
	const {
		meta: { isMaster, ...meta },
		createJob,
		dispose
	} = await manager({
		cluster,
		makeQueue,
		newId,
		createWorkerMessageHandler,
		createMasterMessageHandler,
		createWorkerSpawner,
		createQueue,
		createJobCreator,
	    workerCount
	})
	const jobs = {}
	let finished = false
	return {
		meta,
		createJob: job => {
			if (finished) {
				throw new Error('you cannot create new jobs once finished is called')
			}
			return jobs[job.name] = createJob(job)
		},
		finished: app => {
			finished = true
			isMaster ? app({
				jobs,
				dispose
			}) : void 0
		}
	}
}
