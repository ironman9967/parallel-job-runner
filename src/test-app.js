
import fibonacci from 'fibonacci'

import createParallelJobRunner from './index.js'

createParallelJobRunner({
	workerCount: process.argv[5]
}).then(({
	meta: { workerCount, isMaster },
	createJob,
	dispose: disposeParallelJobRunner
}) => {
	const runs = process.argv[2] || 1
	const iterations = process.argv[3] || 1
	const complexity = process.argv[4] || 1
	
	const { startJob: startFibonacciJob } = createJob({
		name: 'get-fibonacci',
		work: complexity => Promise.resolve(fibonacci.iterate(complexity).number)
	})
	
	const start = Date.now()
	if (isMaster) {
		console.log('runs:', runs)
		console.log('iterations:', iterations)
		console.log('complexity', complexity)
		console.log('workerCount:', workerCount)
		console.log('#####################')
	}
	const iterationProms = []
	for (let i = 0; i < iterations; i++) {
		iterationProms.push(startFibonacciJob(complexity))
	}
	let runProms = []
	for (let i = 0; i < runs; i++) {
		runProms = runProms.concat(Promise.all(iterationProms).then(res => {
			if (isMaster) {
				const end = Date.now()
				console.log('duration:', end - start)
				console.log('number of results', res.length)
				console.log('************************')
			}
		}))
	}
	Promise.all(runProms).then(disposeParallelJobRunner).then(() => process.exit(0))
})
