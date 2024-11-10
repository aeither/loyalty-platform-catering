import { ConnectButton } from "@rainbow-me/rainbowkit";
import type { NextPage } from "next";
import { useState } from "react";
import { useReadContract, useWriteContract } from "wagmi";
import styles from "../styles/Home.module.css";
import { abiLoyalty } from "../utils/abiLoyalty";
import { replaceBigInts } from "../utils/helpers";

// const addressToken = "0x96F249f0971Fc08Fe8fbD8956bc1a830C6C76b0e";
// const addressLoyalty = "0x67f2a17036cC4f351f457aA4c3B248b8584856B0";

const addressToken = "0xcD095ba78830c87083584c0a66049331e34e81c2";
const addressLoyalty = "0xA6bF4Ac0fe7d17B21beDa3BB4aE38CB83Cb31d6E";

const Home: NextPage = () => {
	const [restaurantId, setRestaurantId] = useState("1");
	const [customerAddress, setCustomerAddress] = useState("");
	const [referrerAddress, setReferrerAddress] = useState("");
	const [diningAmount, setDiningAmount] = useState("100");
	const [newTokenAddress, setNewTokenAddress] = useState("");

	const { data: restaurantData } = useReadContract({
		abi: abiLoyalty,
		address: addressLoyalty,
		functionName: "restaurants",
		args: [BigInt(restaurantId)],
	});

	const { data: customerData } = useReadContract({
		abi: abiLoyalty,
		address: addressLoyalty,
		functionName: "customers",
		args: [customerAddress || "0x0000000000000000000000000000000000000000"],
	});

	const { writeContract } = useWriteContract({
		mutation: {
			onError: (error) => {
				console.log(error.message);
			},
		},
	});

	return (
		<div className={styles.container}>
			<main className={styles.main}>
				<h1 className="text-2xl font-bold mb-8">Restaurant Loyalty Platform</h1>
				<ConnectButton />

				<div className="space-y-8 mt-8">
					{/* Step 1: Admin Setup */}
					<div className="p-4 border rounded-lg space-y-4 bg-gray-50">
						<h2 className="text-xl font-bold">
							Step 1: Admin Setup (Owner Only)
						</h2>
						<div className="flex gap-2">
							<input
								type="text"
								value={newTokenAddress}
								onChange={(e) => setNewTokenAddress(e.target.value)}
								placeholder="New Token Address"
								className="border p-2 rounded"
							/>
							<button
								type="button"
								className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
								onClick={() =>
									writeContract({
										abi: abiLoyalty,
										address: addressLoyalty,
										functionName: "setLoyaltyToken",
										args: [newTokenAddress as `0x${string}`],
									})
								}
							>
								1.1 Set Loyalty Token
							</button>
						</div>
					</div>

					{/* Step 2: Restaurant Registration */}
					<div className="p-4 border rounded-lg space-y-4">
						<h2 className="text-xl font-bold">
							Step 2: Restaurant Registration
						</h2>
						<div className="space-y-4">
							<button
								type="button"
								className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
								onClick={() =>
									writeContract({
										abi: abiLoyalty,
										address: addressLoyalty,
										functionName: "registerRestaurant",
										args: ["Test Restaurant 123"],
									})
								}
							>
								2.1 Register New Restaurant
							</button>

							<div className="flex gap-2">
								<input
									type="text"
									value={restaurantId}
									onChange={(e) => setRestaurantId(e.target.value)}
									placeholder="Restaurant ID"
									className="border p-2 rounded"
								/>
								<div className="bg-gray-100 p-2 rounded">
									<p className="font-semibold">2.2 Restaurant Details:</p>
									<pre>
										{JSON.stringify(replaceBigInts(restaurantData), null, 2)}
									</pre>
								</div>
							</div>
						</div>
					</div>

					{/* Step 3: Customer Registration */}
					<div className="p-4 border rounded-lg space-y-4">
						<h2 className="text-xl font-bold">Step 3: Customer Registration</h2>
						<div className="space-y-4">
							<div className="flex gap-2">
								<input
									type="text"
									value={referrerAddress}
									onChange={(e) => setReferrerAddress(e.target.value)}
									placeholder="Referrer Address (Optional)"
									className="border p-2 rounded"
								/>
								<button
									type="button"
									className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
									onClick={() =>
										writeContract({
											abi: abiLoyalty,
											address: addressLoyalty,
											functionName: "registerCustomer",
											args: [referrerAddress as `0x${string}`],
										})
									}
								>
									3.1 Register as Customer
								</button>
							</div>

							<div className="flex gap-2">
								<input
									type="text"
									value={customerAddress}
									onChange={(e) => setCustomerAddress(e.target.value)}
									placeholder="Customer Address"
									className="border p-2 rounded"
								/>
								<div className="bg-gray-100 p-2 rounded">
									<p className="font-semibold">3.2 Customer Details:</p>
									<pre>
										{JSON.stringify(replaceBigInts(customerData), null, 2)}
									</pre>
								</div>
							</div>
						</div>
					</div>

					{/* Step 4: Record Dining */}
					<div className="p-4 border rounded-lg space-y-4">
						<h2 className="text-xl font-bold">
							Step 4: Record Dining (Restaurant Only)
						</h2>
						<div className="flex gap-2">
							<input
								type="text"
								value={restaurantId}
								onChange={(e) => setRestaurantId(e.target.value)}
								placeholder="Restaurant ID"
								className="border p-2 rounded"
							/>
							<input
								type="text"
								value={customerAddress}
								onChange={(e) => setCustomerAddress(e.target.value)}
								placeholder="Customer Address"
								className="border p-2 rounded"
							/>
							<input
								type="text"
								value={diningAmount}
								onChange={(e) => setDiningAmount(e.target.value)}
								placeholder="Amount in USD"
								className="border p-2 rounded"
							/>
							<button
								type="button"
								className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
								onClick={() =>
									writeContract({
										abi: abiLoyalty,
										address: addressLoyalty,
										functionName: "recordDining",
										args: [
											BigInt(restaurantId),
											customerAddress,
											BigInt(diningAmount),
										],
									})
								}
							>
								4.1 Record Dining
							</button>
						</div>
					</div>

					{/* Step 5: Claim Rewards */}
					<div className="p-4 border rounded-lg space-y-4">
						<h2 className="text-xl font-bold">
							Step 5: Claim Rewards (Customer Only)
						</h2>
						<button
							type="button"
							className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
							onClick={() =>
								writeContract({
									abi: abiLoyalty,
									address: addressLoyalty,
									functionName: "claimRewards",
								})
							}
						>
							5.1 Claim Available Rewards
						</button>
					</div>

					{/* Step 6: View History */}
					<div className="p-4 border rounded-lg space-y-4">
						<h2 className="text-xl font-bold">Step 6: View History</h2>
						<div className="space-y-2">
							<button
								type="button"
								className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 mr-2"
								onClick={() =>
									writeContract({
										abi: abiLoyalty,
										address: addressLoyalty,
										functionName: "getRestaurantCustomers",
										args: [BigInt(restaurantId)],
									})
								}
							>
								6.1 View Restaurant Customers
							</button>

							<button
								type="button"
								className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
								onClick={() =>
									writeContract({
										abi: abiLoyalty,
										address: addressLoyalty,
										functionName: "getCustomerDiningHistory",
										args: [customerAddress],
									})
								}
							>
								6.2 View Customer History
							</button>
						</div>
					</div>
				</div>
			</main>
		</div>
	);
};

export default Home;
