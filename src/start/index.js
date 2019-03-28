
import cluster from 'cluster'

export const start = () => new Promise((resolve, reject) => {
	const worker = cluster.fork()
	worker.once('message', json => {
		const { 
			type, 
			data, 
			error
		} = JSON.parse(json)
		switch (type) {
			case 'result':
				return resolve({ ...data})
			case 'error':
				return reject(error)
			default:
				reject(new Error(`unknown result from job: ${json}`))
		}
	})
})
