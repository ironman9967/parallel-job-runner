
import os from 'os'
import cluster from 'cluster'

export const create = () => {
	const workers = []
	if (cluster.isMaster) {
		for (let i = 0; i < os.cpus().length - 1; i++) {
			const worker = cluster.fork()
			worker.on('message', msg => console.log('from worker', msg))
			workers.push(worker)
		}
	}
	else {
		process.on('message', msg => {
			console.log('worker message', process.pid, msg)
		})
	}
	return {
		numOfWorkers: workers.length,
		start: ({
			workerIndex,
			...job
		}) => new Promise((resolve, reject) => {
			
			workers[workerIndex].send(job)
			
			// worker.once('message', json => {
			// 	const { 
			// 		type, 
			// 		data, 
			// 		error
			// 	} = JSON.parse(json)
			// 	switch (type) {
			// 		case 'result':
			// 			return resolve({ ...data})
			// 		case 'error':
			// 			return reject(error)
			// 		default:
			// 			reject(new Error(`unknown message type from job: ${json}`))
			// 	}
			// })
		})
	}
}
