const asyncHandler = (func) => async (req, res, next) => {
	try {
		await func(req, res, next)
	} catch (error) {
		res.status(error.code||500).json({ message: error.message,success:false });
		next(error)
	}
}



export {asyncHandler}