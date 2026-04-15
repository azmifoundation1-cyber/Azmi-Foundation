import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import Home from "@/pages/Home";
import About from "@/pages/About";
import Programs from "@/pages/Programs";
import Campaigns from "@/pages/Campaigns";
import CampaignDetail from "@/pages/CampaignDetail";
import Donate from "@/pages/Donate";
import GetInvolved from "@/pages/GetInvolved";
import Dashboard from "@/pages/Dashboard";
import Contact from "@/pages/Contact";
import NotFound from "@/pages/not-found";
import Zakat from "@/pages/Zakat";
import Sadaqah from "@/pages/Sadaqah";
import Volunteer from "@/pages/Volunteer";
import Blog from "@/pages/Blog";

import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import CreateCampaign from "@/pages/CreateCampaign";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminCampaigns from "@/pages/admin/AdminCampaigns";
import AdminDonations from "@/pages/admin/AdminDonations";
import AdminRegistrations from "@/pages/admin/AdminRegistrations";
import AdminPrograms from "@/pages/admin/AdminPrograms";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminMessages from "@/pages/admin/AdminMessages";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/programs" component={Programs} />
      <Route path="/campaigns" component={Campaigns} />
      <Route path="/campaigns/create" component={CreateCampaign} />
      <Route path="/campaigns/:id" component={CampaignDetail} />
      <Route path="/donate" component={Donate} />
      <Route path="/zakat" component={Zakat} />
      <Route path="/sadaqah" component={Sadaqah} />
      <Route path="/volunteer" component={Volunteer} />
      <Route path="/blog/:slug" component={Blog} />
      <Route path="/blog" component={Blog} />
      <Route path="/get-involved" component={GetInvolved} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/contact" component={Contact} />

      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/campaigns" component={AdminCampaigns} />
      <Route path="/admin/donations" component={AdminDonations} />
      <Route path="/admin/registrations" component={AdminRegistrations} />
      <Route path="/admin/programs" component={AdminPrograms} />
      <Route path="/admin/users" component={AdminUsers} />
      <Route path="/admin/messages" component={AdminMessages} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
