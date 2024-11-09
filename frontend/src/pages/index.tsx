import { ConnectButton } from "@rainbow-me/rainbowkit";
import type { NextPage } from "next";
import { useReadContract, useWriteContract } from "wagmi";
import styles from "../styles/Home.module.css";
import { abiLoyalty } from "../utils/abiLoyalty";

const addressToken = "0x96F249f0971Fc08Fe8fbD8956bc1a830C6C76b0e";
const addressLoyalty = "0x67f2a17036cC4f351f457aA4c3B248b8584856B0";

const Home: NextPage = () => {
	const { data } = useReadContract({
		abi: abiLoyalty,
		address: addressLoyalty,
		functionName: "restaurants",
		args: [BigInt(1)]
	});
	console.log("🚀 ~ data:", data)

	const { writeContract } = useWriteContract();

	return (
		<div className={styles.container}>
			<main className={styles.main}>
				<ConnectButton />

				<button
					type="button"
					onClick={() =>
						writeContract({
							abi: abiLoyalty,
							address: addressLoyalty,
							functionName: "registerRestaurant",
							args: ["Hello World"],
						})
					}
				>
					Register Restaurant
				</button>

				{/* create all the buttons here as kitchensink for testing */}
			</main>
		</div>
	);
};

export default Home;
