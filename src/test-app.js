
import os from 'os'
import cluster from 'cluster'

import { queue } from 'async'
import uuid from 'uuid/v1'

import fibonacci from 'fibonacci'

export default () => {
	const createJobCreator = ({ getWorkerCount }) => {
		const jobs = []
		const pending = {}
		const workerCount = getWorkerCount()
		if (cluster.isMaster) {
			for (let i = 0; i < workerCount; i++) {
				const worker = cluster.fork()
				worker.on('message', ({ type, ...res }) => {
					switch (type) {
						case 'job-result':
							const { workId, success, workResult } = res
							const { start, completeJob } = pending[workId]
							if (typeof completeJob == 'function') {
								completeJob({
									success,
									start,
									duration: Date.now() - start,
									workResult
								})
								delete pending[workId]
							}
							else {
								throw new Error(`unknown job-result workId: ${workId}`)
							}
							break;
						default:
							throw new Error(`unknown worker message type: ${type}`)
					}
				})
			}
		}
		else {
			process.on('message', ({ type, ...msg }) => {
				switch (type) {
					case 'do-job':
						const { job: { jobIndex, workId, data } } = msg
						let prom = jobs[jobIndex].work(data)
						if (!(prom instanceof Promise)) {
							prom = Promise.resolve(prom)
						}
						const jobResult = {
							type: 'job-result',
							workId,
							jobIndex
						}
						prom.then(workResult => {
							process.send({
								...jobResult,
								success: true,
								workResult
							})
						})
						.catch(workResult => {
							process.send({
								...jobResult,
								success: false,
								workResult
							})
						})
					break;
					default:
						throw new Error(`unknown message type from master: ${type}`)
				}
			})
		}
		
		let workerIndex = 1
		const q = queue(({ job: { work }, start, data }, completeJob) => {
			if (cluster.isMaster) {
				const jobIndex = jobs.findIndex(j => j.work === work)
				const workId = uuid()
				const worker = cluster.workers[workerIndex]
				pending[workId] = {
					start,
					completeJob
				}
				worker.send({
					type: 'do-job',
					job: {
						jobIndex,
						workId,
						data
					}
				})
				if (workerIndex == workerCount) {
					workerIndex = 1
				}
				else {
					workerIndex++
				}
			}
		}, workerCount)
		
		return {
			createJob: job => {
				jobs.push(job)
				return {
					startJob: data => new Promise((resolve, reject) => {
						if (cluster.isMaster) {
							q.push({
								job,
								start: Date.now(),
								data
							}, ({ success, workResult }) => success
								? resolve(workResult)
								: reject(workResult))
						}
					})
				}
			}
		}
	}
	
	const iterations = process.argv[2] || 500
	const complexity = process.argv[3] || 500
	const runs = process.argv[4] || 5
	const getWorkerCount = () => process.argv[5] || os.cpus().length - 1
	
	const { createJob } = createJobCreator({
		getWorkerCount
	})
	const { startJob: startFibonacciJob } = createJob({
		work: complexity => Promise.resolve(fibonacci.iterate(complexity).number)
	})
	
	const start = Date.now()
	if (cluster.isMaster) {
		console.log('runs:', runs)
		console.log('iterations:', iterations)
		console.log('complexity', complexity)
		console.log('workerCount:', getWorkerCount())
		console.log('#####################')
	}
	const proms = []
	for (let i = 0; i < iterations; i++) {
		proms.push(startFibonacciJob(complexity))
	}
	for (let i = 0; i < runs; i++) {
		Promise.all(proms).then(res => {
			if (cluster.isMaster) {
				const end = Date.now()
				console.log('duration:', end - start)
				console.log('number of results', res.length)
				console.log('************************')
			}
		})
	}
}