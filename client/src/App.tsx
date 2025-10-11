import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { useAuthStore } from "@/store/auth";

import { UserLayout } from "@/components/user-layout";
import { AdminLayout } from "@/components/admin/admin-layout";
import { AdminLogin } from "@/components/admin/admin-login";

import Dashboard from "@/pages/dashboard";
import QuizPage from "@/pages/quiz-page";
import ResultsPage from "@/pages/results-page";
import ProfilePage from "@/pages/profile-page";

import AdminDashboard from "@/pages/admin-dashboard";
import AdminSubjects from "@/pages/admin-subjects";
import AdminQuizzes from "@/pages/admin-quizzes";
import AdminQuestions from "@/pages/admin-questions";
import AdminSettings from "@/pages/admin-settings";

import NotFound from "@/pages/not-found";

function ProtectedRoute({ component: Component, ...rest }: any) {
  const { user } = useAuthStore();
  return user ? <Component {...rest} /> : <Redirect to="/" />;
}

function AdminRoute({ component: Component, ...rest }: any) {
  const { admin } = useAuthStore();
  return admin ? <Component {...rest} /> : <Redirect to="/admin/login" />;
}

function Router() {
  const { admin } = useAuthStore();

  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/quiz/:id">
        {(params) => <ProtectedRoute component={QuizPage} {...params} />}
      </Route>
      <Route path="/results/:id">
        {(params) => <ProtectedRoute component={ResultsPage} {...params} />}
      </Route>
      <Route path="/profile">
        {(params) => <ProtectedRoute component={ProfilePage} {...params} />}
      </Route>

      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/dashboard">
        {(params) => <AdminRoute component={AdminDashboard} {...params} />}
      </Route>
      <Route path="/admin/subjects">
        {(params) => <AdminRoute component={AdminSubjects} {...params} />}
      </Route>
      <Route path="/admin/quizzes">
        {(params) => <AdminRoute component={AdminQuizzes} {...params} />}
      </Route>
      <Route path="/admin/questions/:quizId">
        {(params) => <AdminRoute component={AdminQuestions} {...params} />}
      </Route>
      <Route path="/admin/settings">
        {(params) => <AdminRoute component={AdminSettings} {...params} />}
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const { admin } = useAuthStore();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          {admin ? (
            <AdminLayout>
              <Router />
            </AdminLayout>
          ) : (
            <UserLayout>
              <Router />
            </UserLayout>
          )}
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
