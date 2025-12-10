import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { useAuth } from "@/hooks/useAuth";

import Landing from "@/pages/landing";
import Celebrities from "@/pages/celebrities";
import CelebrityProfile from "@/pages/celebrity-profile";
import CelebritiesCampaigns from "@/pages/celebrities-campaigns";
import About from "@/pages/about";
import Contact from "@/pages/contact";
import Terms from "@/pages/terms";
import Privacy from "@/pages/privacy";

import Dashboard from "@/pages/dashboard/index";
import WalletPage from "@/pages/dashboard/wallet";
import BookingsPage from "@/pages/dashboard/bookings";
import CampaignsPage from "@/pages/dashboard/campaigns";
import MessagesPage from "@/pages/dashboard/messages";
import NotificationsPage from "@/pages/dashboard/notifications";
import ProfilePage from "@/pages/dashboard/profile";
import BookCelebrityPage from "@/pages/dashboard/book";
import CampaignRequestPage from "@/pages/dashboard/campaign";

import AdminDashboard from "@/pages/admin/index";
import AdminUsers from "@/pages/admin/users";
import AdminCelebrities from "@/pages/admin/celebrities";
import AdminBookings from "@/pages/admin/bookings";
import AdminCampaigns from "@/pages/admin/campaigns";
import AdminDeposits from "@/pages/admin/deposits";
import AdminMessages from "@/pages/admin/messages";
import AdminSettings from "@/pages/admin/settings";

import NotFound from "@/pages/not-found";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = "/api/login";
    return null;
  }

  return <Component />;
}

function AdminRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = "/api/login";
    return null;
  }

  if (user?.role !== "admin") {
    return <NotFound />;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/celebrities" component={Celebrities} />
      <Route path="/celebrity/:id" component={CelebrityProfile} />
      <Route path="/campaigns" component={CelebritiesCampaigns} />
      <Route path="/about" component={About} />
      <Route path="/contact" component={Contact} />
      <Route path="/terms" component={Terms} />
      <Route path="/privacy" component={Privacy} />

      <Route path="/dashboard">
        {() => <ProtectedRoute component={Dashboard} />}
      </Route>
      <Route path="/dashboard/wallet">
        {() => <ProtectedRoute component={WalletPage} />}
      </Route>
      <Route path="/dashboard/bookings">
        {() => <ProtectedRoute component={BookingsPage} />}
      </Route>
      <Route path="/dashboard/campaigns">
        {() => <ProtectedRoute component={CampaignsPage} />}
      </Route>
      <Route path="/dashboard/messages">
        {() => <ProtectedRoute component={MessagesPage} />}
      </Route>
      <Route path="/dashboard/notifications">
        {() => <ProtectedRoute component={NotificationsPage} />}
      </Route>
      <Route path="/dashboard/profile">
        {() => <ProtectedRoute component={ProfilePage} />}
      </Route>
      <Route path="/dashboard/book/:id">
        {() => <ProtectedRoute component={BookCelebrityPage} />}
      </Route>
      <Route path="/dashboard/campaign/:id">
        {() => <ProtectedRoute component={CampaignRequestPage} />}
      </Route>

      <Route path="/admin">
        {() => <AdminRoute component={AdminDashboard} />}
      </Route>
      <Route path="/admin/users">
        {() => <AdminRoute component={AdminUsers} />}
      </Route>
      <Route path="/admin/celebrities">
        {() => <AdminRoute component={AdminCelebrities} />}
      </Route>
      <Route path="/admin/bookings">
        {() => <AdminRoute component={AdminBookings} />}
      </Route>
      <Route path="/admin/campaigns">
        {() => <AdminRoute component={AdminCampaigns} />}
      </Route>
      <Route path="/admin/deposits">
        {() => <AdminRoute component={AdminDeposits} />}
      </Route>
      <Route path="/admin/messages">
        {() => <AdminRoute component={AdminMessages} />}
      </Route>
      <Route path="/admin/settings">
        {() => <AdminRoute component={AdminSettings} />}
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
