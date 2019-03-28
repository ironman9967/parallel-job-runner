
export default ({
	createJob
}) => {
	const {
		startJob
	} = createJob({
		job: data => {
			console.log('job', process.pid, data)
		}
	})
	startJob({ some: `data-1` })
	startJob({ some: `data-2` })
}
