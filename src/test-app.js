
import fibonacci from 'fibonacci'

import createParallelJobRunner from './index.js'

const run = async () => {
	const {
		meta: { workerCount },
		createJob,
		finished
	} = await createParallelJobRunner()

	createJob({
		name: 'getFibonacci',
		work: complexity => fibonacci.iterate(complexity).number
	})

	finished(({
		jobs: {
			getFibonacci: {
				startJob: startFibonacciJob
			}
		},
		dispose: disposeParallelJobRunner
	}) => {
		const runs = process.argv[2] || 1
		const iterations = process.argv[3] || 1
		const complexity = process.argv[4] || 1

		const start = Date.now()
		console.log('runs:', runs)
		console.log('iterations:', iterations)
		console.log('complexity', complexity)
		console.log('workerCount:', workerCount)
		console.log('#####################')

		const iterationProms = []
		for (let i = 0; i < iterations; i++) {
			iterationProms.push(startFibonacciJob(complexity))
		}
		let runProms = []
		for (let i = 0; i < runs; i++) {
			runProms = runProms.concat(Promise.all(iterationProms).then(res => {
				const end = Date.now()
				console.log('duration:', end - start)
				console.log('number of results', res.length)
				console.log('************************')
				return res
			}))
		}
		Promise.all(runProms)
		.then(([ runIterations ]) => runIterations.forEach(({
			meta,
			//result
		}) => console.log('iteration', meta)))
		.then(disposeParallelJobRunner)
		.then(() => process.exit(0))
	})
}

run()
