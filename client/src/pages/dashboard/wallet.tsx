import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Wallet, Plus, ArrowDownLeft, ArrowUpRight, Clock, CheckCircle, XCircle, Copy, ExternalLink } from "lucide-react";
import { Header } from "@/components/header";
import { MobileNav } from "@/components/mobile-nav";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Deposit } from "@shared/schema";
import { SiBitcoin, SiEthereum, SiTether } from "react-icons/si";

const cryptoOptions = [
  { value: "BTC", label: "Bitcoin", icon: SiBitcoin, color: "text-orange-500" },
  { value: "ETH", label: "Ethereum", icon: SiEthereum, color: "text-blue-500" },
  { value: "USDT", label: "USDT (TRC20)", icon: SiTether, color: "text-green-500" },
];

export default function WalletPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [depositOpen, setDepositOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [selectedCoin, setSelectedCoin] = useState("BTC");
  const [step, setStep] = useState<"amount" | "payment">("amount");

  const { data: deposits, isLoading: depositsLoading } = useQuery<Deposit[]>({
    queryKey: ["/api/deposits"],
  });

  const { data: cryptoPrices } = useQuery<Record<string, number>>({
    queryKey: ["/api/crypto/prices"],
  });

  const { data: walletAddresses } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings/wallets"],
  });

  const depositMutation = useMutation({
    mutationFn: async (data: { amountUsd: number; coin: string }) => {
      return apiRequest("POST", "/api/deposits", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deposits"] });
      toast({
        title: "Deposit Initiated",
        description: "Your deposit is pending confirmation. We'll notify you once it's approved.",
      });
      setDepositOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      console.error('Deposit error:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to create deposit. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setAmount("");
    setSelectedCoin("BTC");
    setStep("amount");
  };

  const formatBalance = (balance: string | number) => {
    const num = typeof balance === "string" ? parseFloat(balance) : balance;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(num);
  };

  const getCryptoAmount = () => {
    if (!amount || !cryptoPrices) return "0.00000000";
    const usdAmount = parseFloat(amount);
    const price = cryptoPrices[selectedCoin] || 1;
    return (usdAmount / price).toFixed(8);
  };

  const handleProceed = () => {
    if (!amount || parseFloat(amount) < 10) {
      toast({
        title: "Invalid Amount",
        description: "Minimum deposit is $10 USD",
        variant: "destructive",
      });
      return;
    }
    setStep("payment");
  };

  const handleConfirmPayment = () => {
    depositMutation.mutate({
      amountUsd: parseFloat(amount),
      coin: selectedCoin,
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Wallet address copied to clipboard",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col pb-20 md:pb-0">
      <Header />
      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="font-heading font-bold text-2xl md:text-3xl mb-2">Wallet</h1>
            <p className="text-muted-foreground">Manage your USD balance and view transaction history.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <Card className="bg-gradient-to-br from-skyline-navy to-skyline-navy/80 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center">
                      <Wallet className="h-7 w-7" />
                    </div>
                    <div>
                      <p className="text-white/70 text-sm">Available Balance</p>
                      <p className="font-heading font-bold text-3xl text-skyline-gold" data-testid="text-wallet-balance">
                        {formatBalance(user?.balanceUsd || 0)}
                      </p>
                    </div>
                  </div>

                  <Dialog open={depositOpen} onOpenChange={setDepositOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full bg-skyline-cyan hover:bg-skyline-cyan/90" size="lg" data-testid="button-deposit">
                        <Plus className="h-5 w-5 mr-2" />
                        Deposit Funds
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle className="font-heading">
                          {step === "amount" ? "Deposit Funds" : "Complete Payment"}
                        </DialogTitle>
                        <DialogDescription>
                          {step === "amount"
                            ? "Enter the amount and select your cryptocurrency"
                            : "Send the exact amount to the wallet address below"
                          }
                        </DialogDescription>
                      </DialogHeader>

                      {step === "amount" ? (
                        <div className="space-y-6 py-4">
                          <div className="space-y-2">
                            <Label>Amount (USD)</Label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                              <Input
                                type="number"
                                placeholder="100.00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="pl-7"
                                min="10"
                                data-testid="input-deposit-amount"
                              />
                            </div>
                            <p className="text-xs text-muted-foreground">Minimum deposit: $10 USD</p>
                          </div>

                          <div className="space-y-3">
                            <Label>Select Cryptocurrency</Label>
                            <RadioGroup value={selectedCoin} onValueChange={setSelectedCoin}>
                              {cryptoOptions.map((option) => (
                                <div
                                  key={option.value}
                                  className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                                  data-testid={`radio-${option.value.toLowerCase()}`}
                                >
                                  <RadioGroupItem value={option.value} id={option.value} />
                                  <Label htmlFor={option.value} className="flex items-center gap-3 cursor-pointer flex-1">
                                    <option.icon className={`h-6 w-6 ${option.color}`} />
                                    <span>{option.label}</span>
                                  </Label>
                                </div>
                              ))}
                            </RadioGroup>
                          </div>

                          {amount && parseFloat(amount) > 0 && (
                            <div className="p-4 bg-muted rounded-lg">
                              <p className="text-sm text-muted-foreground mb-1">You will send:</p>
                              <p className="font-heading font-bold text-xl" data-testid="text-crypto-amount">
                                {getCryptoAmount()} {selectedCoin}
                              </p>
                              {cryptoPrices && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Rate: 1 {selectedCoin} = ${cryptoPrices[selectedCoin]?.toLocaleString() || "N/A"}
                                </p>
                              )}
                            </div>
                          )}

                          <Button onClick={handleProceed} className="w-full" size="lg" data-testid="button-proceed-deposit">
                            Proceed to Payment
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-6 py-4">
                          <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                            <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                              Send exactly {getCryptoAmount()} {selectedCoin}
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label>Wallet Address</Label>
                            <div className="flex gap-2">
                              <Input
                                value={walletAddresses?.[selectedCoin] || "Address not available"}
                                readOnly
                                className="font-mono text-sm"
                                data-testid="input-wallet-address"
                              />
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => copyToClipboard(walletAddresses?.[selectedCoin] || "")}
                                data-testid="button-copy-address"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                            <div>
                              <p className="text-xs text-muted-foreground">Amount (USD)</p>
                              <p className="font-semibold">${amount}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Amount ({selectedCoin})</p>
                              <p className="font-semibold">{getCryptoAmount()}</p>
                            </div>
                          </div>

                          <div className="flex gap-3">
                            <Button variant="outline" onClick={() => setStep("amount")} className="flex-1">
                              Back
                            </Button>
                            <Button
                              onClick={handleConfirmPayment}
                              className="flex-1"
                              disabled={depositMutation.isPending}
                              data-testid="button-confirm-payment"
                            >
                              {depositMutation.isPending ? "Processing..." : "I've Sent Payment"}
                            </Button>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-base">Supported Cryptocurrencies</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {cryptoOptions.map((option) => (
                    <div key={option.value} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <option.icon className={`h-5 w-5 ${option.color}`} />
                        <span className="text-sm">{option.label}</span>
                      </div>
                      {cryptoPrices && (
                        <span className="text-sm text-muted-foreground">
                          ${cryptoPrices[option.value]?.toLocaleString() || "N/A"}
                        </span>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading">Transaction History</CardTitle>
                  <CardDescription>View your deposit and transaction history</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="deposits">
                    <TabsList>
                      <TabsTrigger value="deposits" data-testid="tab-deposits">Deposits</TabsTrigger>
                      <TabsTrigger value="transactions" data-testid="tab-transactions">Transactions</TabsTrigger>
                    </TabsList>

                    <TabsContent value="deposits" className="mt-4">
                      {depositsLoading ? (
                        <div className="space-y-3">
                          {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
                          ))}
                        </div>
                      ) : deposits && deposits.length > 0 ? (
                        <div className="space-y-3">
                          {deposits.map((deposit) => (
                            <div
                              key={deposit.id}
                              className="flex items-center justify-between p-4 rounded-lg border"
                              data-testid={`deposit-item-${deposit.id}`}
                            >
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                                  <ArrowDownLeft className="h-5 w-5 text-green-500" />
                                </div>
                                <div>
                                  <p className="font-medium">
                                    {formatBalance(deposit.amountUsd)}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {deposit.cryptoAmountExpected} {deposit.coin} • {new Date(deposit.createdAt!).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {getStatusIcon(deposit.status)}
                                <Badge
                                  variant={
                                    deposit.status === "approved" ? "default" :
                                    deposit.status === "rejected" ? "destructive" : "outline"
                                  }
                                >
                                  {deposit.status}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12 text-muted-foreground">
                          <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No deposits yet</p>
                          <p className="text-sm">Add funds to get started</p>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="transactions" className="mt-4">
                      <div className="text-center py-12 text-muted-foreground">
                        <ArrowUpRight className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No transactions yet</p>
                        <p className="text-sm">Your booking and campaign payments will appear here</p>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <MobileNav />
    </div>
  );
}
