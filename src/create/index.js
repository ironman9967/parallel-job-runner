
import cluster from 'cluster'

import { queue } from 'async'
import uuid from 'uuid/v1'

import { perform } from '../perform'
import { create as createStart } from '../start'

const createJobIdMaanger = () => {
	const workRepo = {}
	let workIndex = 0
	return {
		manageWork: work => {
			if (cluster.isMaster) {
				const id = uuid()
				workRepo[id] = work
				return Promise.resolve({
					id,
					work
				})
			}
			workIndex++
			const workIdListener = process.on('message', msg => {
				if (msg.type == 'work-id') {
					
					console.log('asdf', msg)
					
					process.removeEventListener(workIdListener)
				}
			})
			process.send({
				type: 'get-work-id',
				workIndex
			})
			return Promise.resolve({
				id: 'asdf;laksdfj',
				work
			})
		}
	}
}

export const create = () => {
	const { numOfWorkers, start } = createStart()
	let q
	if (cluster.isMaster) {
		q = queue((job, cb) => start(job).then(cb).catch(cb), numOfWorkers)
	}
	const { manageWork } = createJobIdMaanger()
	return {
		createJob: ({ job: work }) => manageWork(work).then(job => {
			let workerIndex = 0
			return {
				startJob: data => new Promise((resolve, reject) => {
					if (cluster.isMaster) {
						q.push({ 
							id: job.id, 
							workerIndex, 
							data
						}, res => res instanceof Error
							? reject(res)
							: resolve(res))
						workerIndex++
					}
				})
			}
		})
	}
}
