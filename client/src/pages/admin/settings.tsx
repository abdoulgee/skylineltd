import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Settings, Save, Wallet } from "lucide-react";
import { Header } from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { SiBitcoin, SiEthereum, SiTether } from "react-icons/si";

export default function AdminSettings() {
  const { toast } = useToast();

  const { data: settings } = useQuery<Record<string, string>>({
    queryKey: ["/api/admin/settings"],
  });

  const [wallets, setWallets] = useState({
    BTC: "",
    ETH: "",
    USDT: "",
  });

  useEffect(() => {
    if (settings) {
      setWallets({
        BTC: settings.BTC_WALLET || "",
        ETH: settings.ETH_WALLET || "",
        USDT: settings.USDT_WALLET || "",
      });
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      // Send wallet settings as an object with multiple keys
      const walletData: any = {};
      if (wallets.BTC !== "") walletData.BTC_WALLET = wallets.BTC;
      if (wallets.ETH !== "") walletData.ETH_WALLET = wallets.ETH;
      if (wallets.USDT !== "") walletData.USDT_WALLET = wallets.USDT;
      
      return apiRequest("POST", "/api/admin/settings", walletData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/settings/wallets"] });
      toast({ title: "Settings saved successfully" });
    },
    onError: (error: any) => {
      console.error('Settings save error:', error);
      toast({ 
        title: "Failed to save settings", 
        description: error?.message || "Please check your input and try again.",
        variant: "destructive" 
      });
    },
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="font-heading font-bold text-2xl md:text-3xl mb-2">Platform Settings</h1>
            <p className="text-muted-foreground">Configure system-wide settings and wallet addresses.</p>
          </div>

          <div className="max-w-2xl">
            <Card>
              <CardHeader>
                <CardTitle className="font-heading flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Cryptocurrency Wallet Addresses
                </CardTitle>
                <CardDescription>
                  Configure the wallet addresses where users will send cryptocurrency deposits.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <SiBitcoin className="h-5 w-5 text-orange-500" />
                    Bitcoin (BTC) Wallet
                  </Label>
                  <Input
                    value={wallets.BTC}
                    onChange={(e) => setWallets({ ...wallets, BTC: e.target.value })}
                    placeholder="bc1q..."
                    className="font-mono text-sm"
                    data-testid="input-btc-wallet"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <SiEthereum className="h-5 w-5 text-blue-500" />
                    Ethereum (ETH) Wallet
                  </Label>
                  <Input
                    value={wallets.ETH}
                    onChange={(e) => setWallets({ ...wallets, ETH: e.target.value })}
                    placeholder="0x..."
                    className="font-mono text-sm"
                    data-testid="input-eth-wallet"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <SiTether className="h-5 w-5 text-green-500" />
                    USDT (TRC20) Wallet
                  </Label>
                  <Input
                    value={wallets.USDT}
                    onChange={(e) => setWallets({ ...wallets, USDT: e.target.value })}
                    placeholder="T..."
                    className="font-mono text-sm"
                    data-testid="input-usdt-wallet"
                  />
                </div>

                <Separator />

                <Button
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending}
                  className="gap-2"
                  data-testid="button-save-settings"
                >
                  <Save className="h-4 w-4" />
                  {saveMutation.isPending ? "Saving..." : "Save Settings"}
                </Button>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="font-heading">Platform Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Platform Name</span>
                  <span className="font-medium">Skyline LTD</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Version</span>
                  <span className="font-medium">1.0.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Environment</span>
                  <span className="font-medium">Production</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
