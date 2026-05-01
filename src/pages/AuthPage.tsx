import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { login, signup, resolveRole } from "@/lib/api";
import { setAuthSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Mail, Lock, User, ArrowRight, Sparkles, GraduationCap, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function AuthPage() {
    const allowPublicSignup = false;
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
    const [signupGrade, setSignupGrade] = useState<number | null>(null);
    const [signupRole, setSignupRole] = useState<"school_admin" | "teacher" | "student" | "parent">("student");
    const [signupSchoolName, setSignupSchoolName] = useState("");
    const [signupSchoolCode, setSignupSchoolCode] = useState("");
    const [signupIdentifier, setSignupIdentifier] = useState("");
    const [adminVerificationCode, setAdminVerificationCode] = useState("");
    const [resolvedRole, setResolvedRole] = useState<"teacher" | "student" | "parent" | null>(null);

    const handleResolveRole = async () => {
        if (signupRole === "school_admin") {
            return;
        }
        if (!signupSchoolCode.trim() || !signupIdentifier.trim()) {
            return;
        }
        const resolved = await resolveRole({
            school_code: signupSchoolCode.trim().toUpperCase(),
            identifier: signupIdentifier.trim(),
        });
        setResolvedRole(resolved.role);
        if (resolved.role === "student" && resolved.grade && !signupGrade) {
            setSignupGrade(resolved.grade);
        }
    };

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
        if (signupRole === "school_admin" && !signupSchoolName.trim()) {
            toast({ variant: "destructive", title: "School name required", description: "Please enter your school name." });
            return;
        }
        if (signupRole === "school_admin" && !adminVerificationCode.trim()) {
            toast({ variant: "destructive", title: "Verification code required", description: "Please enter admin verification code." });
            return;
        }
        if (signupRole !== "school_admin" && !signupSchoolCode.trim()) {
            toast({ variant: "destructive", title: "School code required", description: "Please enter your school code from admin." });
            return;
        }
        if (signupRole !== "school_admin" && !signupIdentifier.trim()) {
            toast({ variant: "destructive", title: "Identifier required", description: "Enter your enrollment/employee/parent identifier." });
            return;
        }
        setIsLoading(true);
        try {
            let effectiveRole: "teacher" | "student" | "parent" | "school_admin" = signupRole;
            if (signupRole !== "school_admin") {
                const resolved = await resolveRole({
                    school_code: signupSchoolCode.trim().toUpperCase(),
                    identifier: signupIdentifier.trim(),
                });
                effectiveRole = resolved.role;
                setResolvedRole(resolved.role);
                if (resolved.role === "student" && resolved.grade && !signupGrade) {
                    setSignupGrade(resolved.grade);
                }
            }
            if (effectiveRole === "student" && !signupGrade) {
                toast({ variant: "destructive", title: "Class required", description: "Please select your class to continue." });
                return;
            }
            const data = await signup({
                email: signupEmail,
                password: signupPassword,
                full_name: signupName,
                grade: effectiveRole === "student" ? signupGrade || undefined : undefined,
                role: effectiveRole,
                school_name: signupRole === "school_admin" ? signupSchoolName : undefined,
                school_code: signupRole !== "school_admin" ? signupSchoolCode.trim().toUpperCase() : undefined,
                identifier: signupRole !== "school_admin" ? signupIdentifier.trim() : undefined,
                admin_verification_code: signupRole === "school_admin" ? adminVerificationCode : undefined,
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
                    <TabsList className="grid w-full grid-cols-1 mb-6">
                        <TabsTrigger value="login">Login</TabsTrigger>
                        {allowPublicSignup ? <TabsTrigger value="signup">Sign Up</TabsTrigger> : null}
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

                    {allowPublicSignup ? (
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
                                                placeholder="Full Name"
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
                                    <div className="space-y-2">
                                        <Label htmlFor="signup-role">Role</Label>
                                        <select
                                            id="signup-role"
                                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            value={signupRole}
                                            onChange={(e) => {
                                                setSignupRole(e.target.value as "school_admin" | "teacher" | "student" | "parent");
                                                setResolvedRole(null);
                                            }}
                                        >
                                            <option value="student">Auto detect (Student/Teacher/Parent)</option>
                                            <option value="school_admin">School Admin</option>
                                        </select>
                                    </div>

                                    {signupRole === "school_admin" ? (
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="signup-school-name">School Name</Label>
                                                <Input
                                                    id="signup-school-name"
                                                    placeholder="e.g. Green Valley Public School"
                                                    value={signupSchoolName}
                                                    onChange={(e) => setSignupSchoolName(e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="signup-admin-code" className="flex items-center gap-1.5">
                                                    <ShieldCheck className="w-3.5 h-3.5" /> Admin Verification Code
                                                </Label>
                                                <Input
                                                    id="signup-admin-code"
                                                    placeholder="Enter admin verification code"
                                                    value={adminVerificationCode}
                                                    onChange={(e) => setAdminVerificationCode(e.target.value)}
                                                    required
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="signup-school-code">School Code</Label>
                                                <Input
                                                    id="signup-school-code"
                                                    placeholder="Enter school code"
                                                    value={signupSchoolCode}
                                                    onChange={(e) => setSignupSchoolCode(e.target.value.toUpperCase())}
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="signup-identifier">Enrollment / Staff / Parent ID</Label>
                                                <Input
                                                    id="signup-identifier"
                                                    placeholder="e.g. STU10A512, TCH4021, PAR0091"
                                                    value={signupIdentifier}
                                                    onChange={(e) => {
                                                        setSignupIdentifier(e.target.value.toUpperCase());
                                                        setResolvedRole(null);
                                                    }}
                                                    onBlur={handleResolveRole}
                                                    required
                                                />
                                                {resolvedRole ? (
                                                    <p className="text-xs text-muted-foreground">
                                                        Detected role: <span className="font-semibold text-foreground">{resolvedRole}</span>
                                                    </p>
                                                ) : (
                                                    <p className="text-xs text-muted-foreground">Role is auto-detected from your identifier.</p>
                                                )}
                                            </div>
                                            {resolvedRole === "student" && (
                                                <div className="space-y-2">
                                                    <Label className="flex items-center gap-1.5">
                                                        <GraduationCap className="w-3.5 h-3.5" /> Your Class
                                                    </Label>
                                                    <div className="grid grid-cols-7 gap-1.5">
                                                        {[6, 7, 8, 9, 10, 11, 12].map((g) => (
                                                            <button
                                                                key={g}
                                                                type="button"
                                                                onClick={() => setSignupGrade(g)}
                                                                className={cn(
                                                                    "py-2 rounded-lg text-sm font-semibold border-2 transition-all",
                                                                    signupGrade === g
                                                                        ? "bg-primary text-primary-foreground border-primary"
                                                                        : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                                                                )}
                                                            >
                                                                {g}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
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
                    ) : null}
                </Tabs>
            </div>
        </div>
    );
}
