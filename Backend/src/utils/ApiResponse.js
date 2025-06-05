class ApiResponse {
	constructor(statusCode, data, message = 'Success') {
		//console.log("ApiResponse", data, statusCode, message);
		this.data = data;
		this.statusCode = statusCode;
		this.success = statusCode < 400;
		this.message = message;

	}
}

export{ApiResponse}