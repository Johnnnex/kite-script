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

// Static agent IDs
const AGENT_ID = 'deployment_5PG1mnhm7h5pvHnTxE90f9XB';
const AGENT_ID_TWO = 'deployment_nD28Y8LniIYZpVqgfTBW2nH1';
const AGENT_ID_THR = 'deployment_nC8HdPWdvy8SNOoYpA5SqCVc';

// Questions for each API
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
];

const questionsTwo = [
	'Price of Bitcoin?', // Market price info for API 2
	'Top Movers today?', // Market analysis for API 2
];

const questionsThr = [
	'How do you detect fraudulent transactions in blockchain?', // Fraud detection for API 3
	'What are the signs of suspicious behavior in financial data?', // Fraud detection for API 3
];

// Function to send request to the API
const sendRequest = async (url: string, question: string, agentId: string) => {
	try {
		console.log(`\n[INFO] Sending request: "${question}" to API: ${url}`);

		const startTime = Date.now();
		const response = await axios.post(url, {
			message: question,
			stream: false,
		});

		const timeTaken = Date.now() - startTime;
		const model = response?.data?.model || 'Unknown Model';
		const responseMessage =
			response?.data?.choices?.[0]?.message?.content || 'No response';

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
const sendTTFT = async (timeTaken: number, agentId: string) => {
	try {
		const payload = {
			deployment_id: agentId,
			time_to_first_token: timeTaken, // Time taken from the initial request
		};

		await axios.post(TTFT_URL, payload);
		console.log(`[INFO] TTFT recorded for ${agentId}: ${timeTaken} ms`);
	} catch (error: any) {
		console.error(`[ERROR] TTFT request failed: ${error?.message}`);
	}
};

// Function to send request to Report Usage API
const sendReportUsage = async (
	question: string,
	response: string,
	agentId: string
) => {
	const maxRetries = 2;
	let retryCount = 0;
	let delay = 1000; // Initial delay of 1 second

	while (retryCount < maxRetries) {
		try {
			const payload = {
				wallet_address: WALLET_ADDRESS,
				agent_id: agentId,
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

// Function to send all questions in a round-robin manner with 30-second delay
const sendQuestionsSequentially = async () => {
	let indexOne = 0;
	let indexTwo = 0;
	let indexThr = 0;

	// Round-robin approach to process the questions
	while (true) {
		// API 1 (Agent 1)
		const resultOne = await sendRequest(API_URL, questions[indexOne], AGENT_ID);
		if (resultOne) {
			const { timeTaken, responseMessage } = resultOne;

			// Send TTFT and Report Usage concurrently
			const ttftPromise = sendTTFT(timeTaken, AGENT_ID);
			const reportUsagePromise = sendReportUsage(
				questions[indexOne],
				responseMessage,
				AGENT_ID
			);

			await Promise.all([ttftPromise, reportUsagePromise]);
		}

		indexOne = (indexOne + 1) % questions.length; // Cycle through questions

		console.log(`[INFO] Waiting for 30 seconds before next request...`);
		await new Promise((resolve) => setTimeout(resolve, 30_000)); // Wait for 30 seconds

		// API 2 (Agent 2)
		const resultTwo = await sendRequest(
			API_URL_TWO,
			questionsTwo[indexTwo],
			AGENT_ID_TWO
		);
		if (resultTwo) {
			const { timeTaken, responseMessage } = resultTwo;

			// Send TTFT and Report Usage concurrently
			const ttftPromise = sendTTFT(timeTaken, AGENT_ID_TWO);
			const reportUsagePromise = sendReportUsage(
				questionsTwo[indexTwo],
				responseMessage,
				AGENT_ID_TWO
			);

			await Promise.all([ttftPromise, reportUsagePromise]);
		}

		indexTwo = (indexTwo + 1) % questionsTwo.length; // Cycle through questions

		console.log(`[INFO] Waiting for 30 seconds before next request...`);
		await new Promise((resolve) => setTimeout(resolve, 30_000)); // Wait for 30 seconds

		// API 3 (Agent 3)
		const resultThr = await sendRequest(
			API_URL_THR,
			questionsThr[indexThr],
			AGENT_ID_THR
		);
		if (resultThr) {
			const { timeTaken, responseMessage } = resultThr;

			// Send TTFT and Report Usage concurrently
			const ttftPromise = sendTTFT(timeTaken, AGENT_ID_THR);
			const reportUsagePromise = sendReportUsage(
				questionsThr[indexThr],
				responseMessage,
				AGENT_ID_THR
			);

			await Promise.all([ttftPromise, reportUsagePromise]);
		}

		indexThr = (indexThr + 1) % questionsThr.length; // Cycle through questions

		console.log(`[INFO] Waiting for 30 seconds before next request...`);
		await new Promise((resolve) => setTimeout(resolve, 30_000)); // Wait for 30 seconds
	}
};

// Start sending questions
sendQuestionsSequentially();
