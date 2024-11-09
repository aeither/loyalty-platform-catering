"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { certificateContractAddresses } from "@/config";
import { calculateLevelAndMaxXp } from "@/lib/utils";
import { apiReact } from "@/trpc/react";
import type { NFTResponseType } from "@/utils/types";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { useAccount } from "wagmi";
import { fetchNFTs } from "../actions/blockscout";

export default function Profile() {
  const { address, chain } = useAccount();
  const { data: user } = apiReact.user.getUser.useQuery({
    address: address as string,
  });
  const { data: xpData } = useQuery({
    queryKey: ["userStats", user?.xp],
    queryFn: () => {
      if (!user?.xp) {
        return null;
      }
      const { level, currentXp, maxXp } = calculateLevelAndMaxXp(
        Number(user.xp)
      );
      const progress = (currentXp / maxXp) * 100;
      return { level, currentXp, maxXp, progress };
    },
    enabled: !!user?.xp,
    staleTime: Number.POSITIVE_INFINITY,
  });
  const chainId = chain?.id;

  const nftsQuery = useQuery<NFTResponseType, Error>({
    queryKey: ["nfts", address, chainId],
    queryFn: async () => {
      if (!address || !chainId) return { items: [], next_page_params: null };
      const contractAddresses = certificateContractAddresses[chainId] || [];
      const baseUrl = chain.blockExplorers?.default.url;
      const response = await fetchNFTs(address, baseUrl!);
      return {
        ...response,
        items: response.items.filter(
          (nft) =>
            contractAddresses.toLowerCase() === nft.token.address.toLowerCase()
        ),
      };
    },
    enabled: !!address && !!chainId,
  });

  if (!address) {
    return <div>Please connect your wallet to view your profile.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-8">
      <h1 className="text-3xl font-bold">Profile</h1>
      <div className="grid grid-cols-1 gap-4">
        {xpData && user && (
          <Card className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-bold">
                Level Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 md:space-x-6">
                <div className="w-32 h-32">
                  <CircularProgressbar
                    value={xpData.progress}
                    text={`Level ${xpData.level}`}
                    styles={buildStyles({
                      textSize: "16px",
                      pathColor: `rgba(62, 152, 199, ${xpData.progress / 100})`,
                      textColor: "#000000", // Changed to black for higher contrast
                      trailColor: "#FFC107", // Changed to a more distinct orange color
                    })}
                  />
                </div>
                <div className="flex-grow">
                  <div className="space-y-2 text-center md:text-left">
                    <p className="text-lg font-semibold">
                      XP: {xpData.currentXp} / {xpData.maxXp}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Total XP: {user.xp}
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mt-2">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${xpData.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <h2 className="text-2xl font-bold mt-8">NFT Certificates</h2>
      {nftsQuery.isLoading ? (
        <p>Loading NFTs...</p>
      ) : nftsQuery.isError ? (
        <p>Error loading NFTs: {nftsQuery.error.message}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {nftsQuery.data?.items.map((nft) => (
            <Card key={nft.id} className="overflow-hidden relative">
              <div className="aspect-square relative">
                <Image
                  src={nft.image_url || "/placeholder-image.jpg"}
                  alt={nft.metadata?.name || "NFT"}
                  layout="fill"
                  objectFit="cover"
                />
                <Link
                  href={`${chain?.blockExplorers?.default.url}/token/${nft.token.address}/instance/${nft.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:shadow-lg transition-shadow duration-200"
                >
                  <ExternalLink size={16} className="text-gray-600" />
                </Link>
              </div>
              <CardContent className="p-4">
                <h3 className="font-bold text-lg mb-2">
                  {nft.metadata?.name || "Unnamed NFT"}
                </h3>
                <p className="text-sm text-gray-600 truncate">
                  {nft.metadata?.description || "No description available"}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
