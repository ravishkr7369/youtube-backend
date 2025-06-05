import dotenv from 'dotenv';
import connectDB from './db/index.js';
import { app } from './app.js';
dotenv.config({
	path:'./.env'
});

const PORT = process.env.PORT || 8000;


connectDB()
.then(()=>{
	app.listen(PORT, () => {
		console.log(`Server is running on port ${PORT}`);
	})
})

.catch((error)=>{
	console.error('Error connecting to database:', error.message);
	process.exit(1); // Exit the process with failure
})