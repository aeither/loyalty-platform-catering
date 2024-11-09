import { ToastAction } from "@/components/ui/toast";
import { toast } from "@/components/ui/use-toast";
import { apiReact } from "@/trpc/react";
import { useAccount } from "wagmi";

export function useAdminMintCertificate() {
  const { chain } = useAccount();
  const baseUrl = chain?.blockExplorers?.default.url;
  const utils = apiReact.useUtils();

  return apiReact.web3.adminMintCertificate.useMutation({
    onSuccess(data, variables, context) {
      if (data.hash) {
        utils.user.getUser.invalidate();

        toast({
          title: "Certificate Minted",
          description: "Your certificate has been successfully minted.",
          action: (
            <ToastAction
              onClick={() =>
                window.open(`${baseUrl}/tx/${data.hash}`, "_blank")
              }
              altText={"View Transaction"}
            >
              View Transaction
            </ToastAction>
          ),
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Something went wrong :(",
        description: error.message,
      });
    },
  });
}
