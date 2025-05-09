import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Login form schema
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters")
});

// Registration form schema
const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters")
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<string>("login");
  const { user, loginMutation, registerMutation } = useAuth();
  const [_, navigate] = useLocation();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  });

  // Register form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: ""
    }
  });

  // Handle login submission
  const onLoginSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };

  // Handle registration submission
  const onRegisterSubmit = (data: RegisterFormValues) => {
    registerMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Hero section */}
      <div className="bg-primary text-white md:w-1/2 p-8 flex items-center justify-center">
        <div className="max-w-md">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 rounded-md bg-white flex items-center justify-center mr-3">
              <FontAwesomeIcon icon="link-slash" className="text-primary text-lg" />
            </div>
            <h1 className="text-3xl font-bold">Link Savor</h1>
          </div>
          
          <h2 className="text-2xl font-bold mb-4">Never lose an important link again</h2>
          
          <p className="mb-6 text-primary-foreground/90">
            Link Savor is your personal link management tool that helps you organize, 
            categorize, and be reminded of important links. Smart clipboard detection 
            automatically detects when you copy links.
          </p>
          
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="rounded-full bg-blue-600 p-1 mr-3 mt-1">
                <FontAwesomeIcon icon="check" className="text-white text-xs" />
              </div>
              <div>
                <h3 className="font-semibold">Smart Link Detection</h3>
                <p className="text-sm text-primary-foreground/80">Automatically detects links you copy</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="rounded-full bg-blue-600 p-1 mr-3 mt-1">
                <FontAwesomeIcon icon="check" className="text-white text-xs" />
              </div>
              <div>
                <h3 className="font-semibold">Deadline Reminders</h3>
                <p className="text-sm text-primary-foreground/80">Never miss an important application deadline</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="rounded-full bg-blue-600 p-1 mr-3 mt-1">
                <FontAwesomeIcon icon="check" className="text-white text-xs" />
              </div>
              <div>
                <h3 className="font-semibold">Advanced Organization</h3>
                <p className="text-sm text-primary-foreground/80">Categories, tags, and powerful search</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Auth forms */}
      <div className="bg-gray-50 md:w-1/2 flex items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              {activeTab === "login" ? "Welcome back" : "Create your account"}
            </CardTitle>
            <CardDescription className="text-center">
              {activeTab === "login" 
                ? "Sign in to access your links and collections" 
                : "Sign up to start saving and organizing your links"
              }
            </CardDescription>
          </CardHeader>
          
          <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <CardContent className="pt-6">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter your email" 
                              type="email" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter your password" 
                              type="password" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending && (
                        <FontAwesomeIcon icon="spinner" className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Sign In
                    </Button>
                  </form>
                </Form>
              </CardContent>
              
              <CardFooter className="flex flex-col space-y-2">
                <div className="text-sm text-center text-gray-500">
                  Don't have an account?{" "}
                  <button 
                    onClick={() => setActiveTab("register")}
                    className="text-primary hover:underline"
                  >
                    Sign up
                  </button>
                </div>
              </CardFooter>
            </TabsContent>
            
            <TabsContent value="register">
              <CardContent className="pt-6">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter your name" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter your email" 
                              type="email" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Create a password" 
                              type="password" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending && (
                        <FontAwesomeIcon icon="spinner" className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Create Account
                    </Button>
                  </form>
                </Form>
              </CardContent>
              
              <CardFooter className="flex flex-col space-y-2">
                <div className="text-sm text-center text-gray-500">
                  Already have an account?{" "}
                  <button 
                    onClick={() => setActiveTab("login")}
                    className="text-primary hover:underline"
                  >
                    Sign in
                  </button>
                </div>
              </CardFooter>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
