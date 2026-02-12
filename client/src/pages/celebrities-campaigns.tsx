import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Star, MessageSquare, Search, Filter } from "lucide-react";
import { Header } from "@/components/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Celebrity } from "@shared/schema";

const campaignTypes = [
  "Brand Ambassador",
  "Social Media Campaign",
  "Product Launch",
  "Event Appearance",
  "Commercial",
  "Influencer Partnership",
  "Custom Campaign"
];

export default function CelebritiesCampaigns() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedCelebrity, setSelectedCelebrity] = useState<Celebrity | null>(null);
  const [formData, setFormData] = useState({
    campaignType: "",
    description: "",
  });

  const { data: celebrities, isLoading } = useQuery<Celebrity[]>({
    queryKey: ["/api/celebrities"],
  });

  const requestCampaignMutation = useMutation({
    mutationFn: async (data: { celebrityId: number; campaignType: string; description: string }) => {
      return apiRequest("POST", "/api/campaigns", data);
    },
    onSuccess: (campaign) => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      toast({
        title: "Campaign Request Submitted",
        description: "Your campaign request has been submitted successfully.",
      });
      setSelectedCelebrity(null);
      setFormData({ campaignType: "", description: "" });
      // Redirect to messages to chat about the campaign
      setLocation(`/dashboard/messages?type=campaign&id=${campaign.id}`);
    },
    onError: (error: any) => {
      console.error('Campaign request error:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to submit campaign request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const filteredCelebrities = celebrities?.filter((celebrity) => {
    const matchesSearch = celebrity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         celebrity.bio?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || celebrity.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ["all", ...Array.from(new Set(celebrities?.map(c => c.category) || []))];

  const handleRequestCampaign = () => {
    if (!selectedCelebrity || !formData.campaignType.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    requestCampaignMutation.mutate({
      celebrityId: selectedCelebrity.id,
      campaignType: formData.campaignType,
      description: formData.description,
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="font-heading font-bold text-2xl md:text-3xl mb-2">
              Celebrity <span className="text-gradient-cyan">Campaigns</span>
            </h1>
            <p className="text-muted-foreground">
              Request custom campaigns with our celebrities.
            </p>
          </div>

          <div className="mb-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search celebrities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category === "all" ? "All Categories" : category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <div className="h-48 bg-muted animate-pulse" />
                  <CardContent className="p-4">
                    <div className="h-6 bg-muted rounded animate-pulse mb-2" />
                    <div className="h-4 bg-muted rounded animate-pulse mb-4" />
                    <div className="h-10 bg-muted rounded animate-pulse" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredCelebrities && filteredCelebrities.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCelebrities.map((celebrity) => (
                <Card key={celebrity.id} className="overflow-hidden hover-elevate">
                  <div className="aspect-square bg-muted">
                    <img
                      src={celebrity.imageUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop"}
                      alt={celebrity.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-heading font-semibold text-lg">{celebrity.name}</h3>
                        <Badge variant="secondary" className="mt-1">
                          {celebrity.category}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {celebrity.bio || "No bio available"}
                      </p>

                      <div className="flex gap-2">
                        <Link href={`/celebrities/${celebrity.id}`} className="flex-1">
                          <Button variant="outline" className="w-full" size="sm">
                            <Star className="h-4 w-4 mr-2" />
                            View Profile
                          </Button>
                        </Link>
                        
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              className="flex-1"
                              onClick={() => setSelectedCelebrity(celebrity)}
                              size="sm"
                            >
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Request Campaign
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Request Campaign</DialogTitle>
                              <DialogDescription>
                                Request a custom campaign with {celebrity.name}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="campaignType">Campaign Type</Label>
                                <Select 
                                  value={formData.campaignType} 
                                  onValueChange={(v) => setFormData({ ...formData, campaignType: v })}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select campaign type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {campaignTypes.map((type) => (
                                      <SelectItem key={type} value={type}>
                                        {type}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor="description">Campaign Description</Label>
                                <Textarea
                                  id="description"
                                  value={formData.description}
                                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                  placeholder="Describe your campaign requirements, goals, timeline, etc."
                                  rows={4}
                                />
                              </div>
                              
                              <Button 
                                onClick={handleRequestCampaign}
                                disabled={requestCampaignMutation.isPending}
                                className="w-full"
                              >
                                {requestCampaignMutation.isPending ? "Submitting..." : "Submit Campaign Request"}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-16 text-center">
                <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="font-heading font-semibold text-lg mb-2">No celebrities found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search criteria or browse all categories.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}