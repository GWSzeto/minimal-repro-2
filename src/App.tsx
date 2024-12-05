import {
	getContract,
	parseEventLogs,
	prepareContractCall,
	prepareEvent,
	sendAndConfirmTransaction,
	sendTransaction,
	waitForReceipt,
} from "thirdweb";
import {
	ConnectButton,
	useActiveAccount,
	useActiveWalletChain,
} from "thirdweb/react";
import { concatHex, padHex } from "viem";
import { client } from "./client";
import thirdwebIcon from "./thirdweb.svg";

const deployProxyByImplementation = {
	inputs: [
		{
			internalType: "address",
			name: "implementation",
			type: "address",
		},
		{
			internalType: "bytes",
			name: "data",
			type: "bytes",
		},
		{
			internalType: "bytes32",
			name: "salt",
			type: "bytes32",
		},
	],
	name: "deployProxyByImplementation",
	outputs: [
		{
			internalType: "address",
			name: "deployedProxy",
			type: "address",
		},
	],
	stateMutability: "nonpayable",
	type: "function",
} as const;

const installModule = {
	inputs: [
		{
			internalType: "address",
			name: "_module",
			type: "address",
		},
		{
			internalType: "bytes",
			name: "_data",
			type: "bytes",
		},
	],
	name: "installModule",
	outputs: [],
	stateMutability: "payable",
	type: "function",
} as const;

//address: "0xB83db4b940e4796aA1f53DBFC824B9B1865835D5",
//abi: abi,
//functionName: "deployProxyByImplementation" as const,
//args: ["0xa6b59721ac0cad7a4f502914b5872b6782a09085", "0x", salt],

export function App() {
	const account = useActiveAccount();
	const chain = useActiveWalletChain();

	const simulate = async () => {
		if (!chain || !account) return;

		const salt = concatHex(["0x0101", padHex("0x", { size: 30 })])
			.toString()
			.slice(0, -2)
			.concat("10") as `0x${string}`;

		const contract = getContract({
			client,
			address: "0xB83db4b940e4796aA1f53DBFC824B9B1865835D5",
			chain,
		});

		const deployCoreContractTx = prepareContractCall({
			contract,
			method: deployProxyByImplementation,
			params: ["0xa6b59721ac0cad7a4f502914b5872b6782a09085", "0x", salt],
		});
		console.log("deployCoreContractTx: ", deployCoreContractTx);
		const submittedTx = await sendTransaction({
			account,
			transaction: deployCoreContractTx,
		});
		console.log("submittedTx: ", submittedTx);
		const receipt = await waitForReceipt(submittedTx);
		console.log("receipt: ", receipt);

		const proxyDeployedEvent = prepareEvent({
			signature:
				"event ProxyDeployed(address indexed implementation, address proxy, address indexed deployer, bytes data)",
		});
		const [event] = parseEventLogs({
			logs: receipt.logs,
			events: [proxyDeployedEvent],
		});
		const proxyAddress = event?.args?.proxy;
		console.log("proxyAddress: ", proxyAddress);

		const installModuleTx = prepareContractCall({
			contract,
			method: installModule,
			params: ["0xB96b2328EA4946cf7785B8797a084e27e6aCf062", "0x"],
		});

		await sendAndConfirmTransaction({
			account,
			transaction: installModuleTx,
		});
	};

	return (
		<main className="p-4 pb-10 min-h-[100vh] flex items-center justify-center container max-w-screen-lg mx-auto">
			<div className="py-20">
				<Header />

				<div className="flex justify-center mb-20">
					<ConnectButton
						client={client}
						appMetadata={{
							name: "Example app",
							url: "https://example.com",
						}}
					/>
				</div>

				<button
					onClick={() => simulate()}
					className="border border-zinc-800 p-4 rounded-lg hover:bg-zinc-900 transition-colors hover:border-zinc-700 self-center align-self-center mx-auto"
				>
					Simulate core deployment and module installation
				</button>
			</div>
		</main>
	);
}

function Header() {
	return (
		<header className="flex flex-col items-center mb-20 md:mb-20">
			<img
				src={thirdwebIcon}
				alt=""
				className="size-[150px] md:size-[150px]"
				style={{
					filter: "drop-shadow(0px 0px 24px #a726a9a8)",
				}}
			/>

			<h1 className="text-2xl md:text-6xl font-bold tracking-tighter mb-6 text-zinc-100">
				thirdweb SDK
				<span className="text-zinc-300 inline-block mx-1"> + </span>
				<span className="inline-block -skew-x-6 text-violet-500"> vite </span>
			</h1>

			<p className="text-zinc-300 text-base">
				Read the{" "}
				<code className="bg-zinc-800 text-zinc-300 px-2 rounded py-1 text-sm mx-1">
					README.md
				</code>{" "}
				file to get started.
			</p>
		</header>
	);
}
