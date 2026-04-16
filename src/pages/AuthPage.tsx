import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { login, signup } from "@/lib/api";
import { setAuthSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Mail, Lock, User, ArrowRight, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AuthPage() {
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { toast } = useToast();

    const from = location.state?.from?.pathname || "/";

    // Login state
    const [loginEmail, setLoginEmail] = useState("");
    const [loginPassword, setLoginPassword] = useState("");

    // Signup state
    const [signupEmail, setSignupEmail] = useState("");
    const [signupPassword, setSignupPassword] = useState("");
    const [signupName, setSignupName] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const data = await login({ email: loginEmail, password: loginPassword });
            setAuthSession(data);
            toast({
                title: "Welcome back!",
                description: `Successfully logged in as ${data.user.full_name || data.user.email}`,
            });
            navigate(from, { replace: true });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Login failed",
                description: error.response?.data?.detail || "Please check your credentials.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const data = await signup({
                email: signupEmail,
                password: signupPassword,
                full_name: signupName
            });
            setAuthSession(data);
            toast({
                title: "Account created!",
                description: "Welcome to CogniMentor. Start your learning journey today.",
            });
            navigate(from, { replace: true });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Signup failed",
                description: error.response?.data?.detail || "Something went wrong. Please try again.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center gradient-bg p-4">
            <div className="w-full max-w-md animate-scale-in">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-lg mb-4">
                        <img src="/logo.png" alt="CogniMentor" className="w-12 h-12 object-contain" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">CogniMentor</h1>
                    <p className="text-muted-foreground mt-2">Your AI-Powered Personal Tutor</p>
                </div>

                <Tabs defaultValue="login" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                        <TabsTrigger value="login">Login</TabsTrigger>
                        <TabsTrigger value="signup">Sign Up</TabsTrigger>
                    </TabsList>

                    <TabsContent value="login">
                        <Card className="glass-card-elevated border-none shadow-2xl">
                            <CardHeader>
                                <CardTitle>Welcome Back</CardTitle>
                                <CardDescription>
                                    Enter your credentials to access your personalized learning dashboard.
                                </CardDescription>
                            </CardHeader>
                            <form onSubmit={handleLogin}>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="name@example.com"
                                                className="pl-10"
                                                value={loginEmail}
                                                onChange={(e) => setLoginEmail(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="password">Password</Label>
                                        </div>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="password"
                                                type="password"
                                                className="pl-10"
                                                value={loginPassword}
                                                onChange={(e) => setLoginPassword(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button className="w-full h-12 text-base font-semibold" type="submit" disabled={isLoading}>
                                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Sign In"}
                                        {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
                                    </Button>
                                </CardFooter>
                            </form>
                        </Card>
                    </TabsContent>

                    <TabsContent value="signup">
                        <Card className="glass-card-elevated border-none shadow-2xl">
                            <CardHeader>
                                <CardTitle>Create an Account</CardTitle>
                                <CardDescription>
                                    Join thousands of students learning better with AI.
                                </CardDescription>
                            </CardHeader>
                            <form onSubmit={handleSignup}>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="signup-name">Full Name</Label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="signup-name"
                                                placeholder="John Doe"
                                                className="pl-10"
                                                value={signupName}
                                                onChange={(e) => setSignupName(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="signup-email">Email</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="signup-email"
                                                type="email"
                                                placeholder="name@example.com"
                                                className="pl-10"
                                                value={signupEmail}
                                                onChange={(e) => setSignupEmail(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="signup-password">Password</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="signup-password"
                                                type="password"
                                                placeholder="••••••••"
                                                className="pl-10"
                                                value={signupPassword}
                                                onChange={(e) => setSignupPassword(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button className="w-full h-12 text-base font-semibold" type="submit" disabled={isLoading}>
                                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Create Account"}
                                        {!isLoading && <Sparkles className="ml-2 h-4 w-4" />}
                                    </Button>
                                </CardFooter>
                            </form>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
