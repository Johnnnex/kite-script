import axios from 'axios';
import * as fs from 'fs';

// Load wallet address from config.json
const CONFIG_PATH = './config.json';
const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
const WALLET_ADDRESS = config.address; // Read wallet address

// API URLs
const API_URL =
	'https://deployment-5pg1mnhm7h5pvhntxe90f9xb.stag-vxzy.zettablock.com/main';
const API_URL_TWO =
	'https://deployment-nd28y8lniiyzpvqgftbw2nh1.stag-vxzy.zettablock.com/main';
const API_URL_THR =
	'https://deployment-nc8hdpwdvy8snooypa5sqcvc.stag-vxzy.zettablock.com/main';
const TTFT_URL = 'https://quests-usage-dev.prod.zettablock.com/api/ttft';
const REPORT_USAGE_URL =
	'https://quests-usage-dev.prod.zettablock.com/api/report_usage';

// Static agent ID
const AGENT_ID = 'deployment_5PG1mnhm7h5pvHnTxE90f9XB';
const AGENT_ID_TWO = 'deployment_nD28Y8LniIYZpVqgfTBW2nH1';
const AGENT_ID_THR = 'deployment_nC8HdPWdvy8SNOoYpA5SqCVc';

// Array of 100 random questions
const questions = [
	'What is proof of AI?',
	'How does blockchain ensure security?',
	'What is the difference between PoS and PoW?',
	'Explain ZK proofs in simple terms.',
	'What is an L2 rollup?',
	'How do decentralized oracles work?',
	'What is MEV in crypto?',
	'What are some risks of smart contracts?',
	'Explain the importance of tokenomics.',
	'How does account abstraction work?',
	// Add more questions...
];

const questionsTwo = ['Price of Bitcoin', 'Top Movers today'];
const questionsThr = []; //AI agent to help you identify fraudulent transactions

// Function to send request to main API
const sendRequest = async (question: string) => {
	try {
		console.log(`\n[INFO] Sending request: "${question}"`);

		const startTime = Date.now();
		const response = await axios.post(API_URL, {
			message: question,
			stream: false,
		});

		const timeTaken = Date.now() - startTime;
		const model = response.data.model || 'Unknown Model';
		const responseMessage =
			response.data.choices?.[0]?.message?.content || 'No response';

		console.log(`[SUCCESS] Model: ${model}`);
		console.log(`[SUCCESS] API responded in ${timeTaken} ms`);
		console.log(`[RESPONSE] ${responseMessage}`);

		return { timeTaken, responseMessage, model };
	} catch (error: any) {
		console.error(`[ERROR] Request failed: ${error?.message}`);
		return null;
	}
};

// Function to send request to TTFT API
const sendTTFT = async (timeTaken: number) => {
	try {
		const payload = {
			deployment_id: AGENT_ID,
			time_to_first_token: timeTaken, // Time taken from the initial request
		};

		await axios.post(TTFT_URL, payload);
		console.log(`[INFO] TTFT recorded: ${timeTaken} ms`);
	} catch (error: any) {
		console.error(`[ERROR] TTFT request failed: ${error?.message}`);
	}
};

// Function to send request to Report Usage API with retry logic for failures
const sendReportUsage = async (question: string, response: string) => {
	const maxRetries = 4;
	let retryCount = 0;
	let delay = 1000; // Initial delay of 1 second

	while (retryCount < maxRetries) {
		try {
			const payload = {
				wallet_address: WALLET_ADDRESS,
				agent_id: AGENT_ID,
				request_text: question,
				response_text: response,
				request_metadata: {},
			};

			await axios.post(REPORT_USAGE_URL, payload);
			console.log(`[INFO] Usage reported for: "${question}"`);
			return; // Exit after successful request
		} catch (error: any) {
			retryCount++;
			console.error(`[ERROR] Report Usage request failed: ${error?.message}`);
			if (retryCount < maxRetries) {
				console.log(`[INFO] Retrying... Attempt ${retryCount} of ${maxRetries}`);
				await new Promise((resolve) => setTimeout(resolve, delay));
				delay *= 2; // Exponentially increase delay
			} else {
				console.log(`[INFO] Max retries reached. Skipping report.`);
			}
		}
	}
};

// Function to send all questions sequentially with a 1-minute delay
const sendQuestionsSequentially = async () => {
	for (const question of questions) {
		const result = await sendRequest(question);

		if (result) {
			const { timeTaken, responseMessage } = result;

			// Send TTFT and Report Usage concurrently
			const ttftPromise = sendTTFT(timeTaken);
			const reportUsagePromise = sendReportUsage(question, responseMessage);

			// Wait for both requests to complete
			await Promise.all([ttftPromise, reportUsagePromise]);
		}

		console.log(`[INFO] Waiting for 1 minute before next request...`);
		await new Promise((resolve) => setTimeout(resolve, 60_000)); // 60,000 ms = 1 minute
	}

	console.log('\n[INFO] All requests completed.');
};

// Start sending questions
sendQuestionsSequentially();
