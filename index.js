const crypto = require("crypto");
const AWS = require("aws-sdk");
const docClient = new AWS.DynamoDB.DocumentClient();

module.exports.handler = async (event) => {
	const path = event.requestContext.http.path;
	const method = event.requestContext.http.method;
	const body = event.body;

	const listPath = /\/user$/;
	const userPath = /\/user\/(?<userid>[^/]*)$/;

	if (path.match(listPath)) {
		if (method === "GET") {
			const items = await docClient.scan({
				TableName: process.env.TABLE,
			}).promise();

			return items.Items;
		}else if (method === "POST") {
			const user = JSON.parse(body);
			const userid = crypto.randomBytes(16).toString("hex");

			await docClient.put({
				TableName: process.env.TABLE,
				Item: {
					...user,
					userid,
				},
			}).promise();
			
			return {userid};
		}
	}else if (path.match(userPath)) {
		const {userid} = path.match(userPath).groups;

		if (method === "GET") {
			const user = await docClient.get({
				TableName: process.env.TABLE,
				Key: {userid},
			}).promise();

			return user.Item;
		}else if (method === "PUT") {
			const user = JSON.parse(body);

			await docClient.put({
				TableName: process.env.TABLE,
				Item: {
					...user,
					userid,
				},
			}).promise();

			return {status: "OK"};
		}else if (method === "DELETE") {
			await docClient.delete({
				TableName: process.env.TABLE,
				Key: {userid},
			}).promise();

			return {status: "OK"};
		}
	}
	if (method === "OPTIONS") {
		return {
			statusCode: 200,
		};

	}else {
		return {
			statusCode: 404,
			body: "Not Found",
		};
	}
};
