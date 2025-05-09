import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Sidebar } from "@/components/layouts/sidebar";
import { MobileMenu } from "@/components/layouts/mobile-menu";
import { User } from "@shared/schema";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTheme } from "@/components/ui/theme-provider";

// Profile form schema
const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  emailNotifications: z.boolean(),
  pushNotifications: z.boolean(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, updateProfileMutation } = useAuth();
  const { theme, setTheme } = useTheme();

  // Profile form
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      emailNotifications: user?.emailNotifications || false,
      pushNotifications: user?.pushNotifications || false,
    },
  });

  // Update form values when user data is available
  if (user && !form.formState.isDirty) {
    form.reset({
      name: user.name,
      emailNotifications: user.emailNotifications,
      pushNotifications: user.pushNotifications,
    });
  }

  // Handle profile update
  const onSubmit = (data: ProfileFormValues) => {
    updateProfileMutation.mutate(data);
  };

  if (!user) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <FontAwesomeIcon icon="spinner" className="text-primary text-2xl animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <MobileMenu />
      
      <main className="flex-1 overflow-y-auto bg-gray-50 pt-0 md:pt-0">
        <div className="px-4 md:px-8 py-6 mt-12 md:mt-0">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2 md:mb-0">Settings</h1>
          </div>
          
          <Tabs defaultValue="profile" className="space-y-4">
            <TabsList>
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
              <TabsTrigger value="account">Account</TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your account profile information.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input 
                            value={user.email} 
                            disabled 
                            className="bg-gray-50" 
                          />
                        </FormControl>
                        <FormDescription>
                          Your email address is your identity on Link Savor and is used to login.
                        </FormDescription>
                      </FormItem>
                      
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Notification Settings</h3>
                        <Separator />
                        
                        <FormField
                          control={form.control}
                          name="emailNotifications"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Email Notifications</FormLabel>
                                <FormDescription>
                                  Receive email reminders for upcoming deadlines.
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="pushNotifications"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Push Notifications</FormLabel>
                                <FormDescription>
                                  Receive browser notifications for upcoming deadlines.
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <Button 
                        type="submit" 
                        disabled={updateProfileMutation.isPending}
                      >
                        {updateProfileMutation.isPending && (
                          <FontAwesomeIcon icon="spinner" className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Save Changes
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="preferences">
              <Card>
                <CardHeader>
                  <CardTitle>Preferences</CardTitle>
                  <CardDescription>
                    Customize your Link Savor experience.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Appearance</h3>
                    <Separator />
                    
                    <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <div className="font-medium">Theme</div>
                        <div className="text-sm text-muted-foreground">
                          Select your preferred theme.
                        </div>
                      </div>
                      <div>
                        <Tabs defaultValue={theme} onValueChange={(value) => setTheme(value as any)}>
                          <TabsList>
                            <TabsTrigger value="light">Light</TabsTrigger>
                            <TabsTrigger value="dark">Dark</TabsTrigger>
                            <TabsTrigger value="system">System</TabsTrigger>
                          </TabsList>
                        </Tabs>
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-medium">Link Display</h3>
                    <Separator />
                    
                    <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <div className="font-medium">Default View</div>
                        <div className="text-sm text-muted-foreground">
                          Choose how links are displayed by default.
                        </div>
                      </div>
                      <div>
                        <Tabs defaultValue="grid">
                          <TabsList>
                            <TabsTrigger value="grid">Grid</TabsTrigger>
                            <TabsTrigger value="list">List</TabsTrigger>
                          </TabsList>
                        </Tabs>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="account">
              <Card>
                <CardHeader>
                  <CardTitle>Account Management</CardTitle>
                  <CardDescription>
                    Manage your account settings and data.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <h3 className="text-lg font-medium">Security</h3>
                  <Separator />
                  
                  <div className="rounded-lg border p-4">
                    <h4 className="font-medium mb-1">Change Password</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Update your password to keep your account secure.
                    </p>
                    <Button variant="outline">Change Password</Button>
                  </div>
                  
                  <h3 className="text-lg font-medium text-destructive">Danger Zone</h3>
                  <Separator className="bg-destructive/20" />
                  
                  <div className="rounded-lg border border-destructive/50 p-4">
                    <h4 className="font-medium mb-1 text-destructive">Delete Account</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      This will permanently delete your account and all your data. This action cannot be undone.
                    </p>
                    <Button variant="destructive">Delete Account</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
