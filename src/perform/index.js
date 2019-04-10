
export const perform = job => data => {
		
	console.log(process.env.jobId)
	
	const res = job(data)
	const prom = res instanceof Promise
		? res
		: Promise.resolve(res)
	return prom
		.then(data => process.send(JSON.stringify({
			type: 'result',
			data
		})))
		.catch(err => process.send(JSON.stringify({
			type: 'error',
			data: { error: err.stack }
		})))
}
