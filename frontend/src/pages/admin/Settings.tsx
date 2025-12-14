import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

const Settings = () => {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Settings</h1>
                <p className="text-muted-foreground">Manage your application settings</p>
            </div>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>General Settings</CardTitle>
                        <CardDescription>
                            Configure general application settings
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="appName">Application Name</Label>
                            <Input id="appName" defaultValue="NSUK ODEL Application" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="appEmail">Contact Email</Label>
                            <Input id="appEmail" type="email" defaultValue="admin@odel.edu.ng" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="appPhone">Contact Phone</Label>
                            <Input id="appPhone" type="tel" defaultValue="+234 XXX XXX XXXX" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Application Settings</CardTitle>
                        <CardDescription>
                            Control application behavior and features
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Enable New Registrations</Label>
                                <p className="text-sm text-muted-foreground">
                                    Allow new students to register
                                </p>
                            </div>
                            <Switch defaultChecked />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Auto-approve Applications</Label>
                                <p className="text-sm text-muted-foreground">
                                    Automatically approve new applications
                                </p>
                            </div>
                            <Switch />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Email Notifications</Label>
                                <p className="text-sm text-muted-foreground">
                                    Send email notifications to applicants
                                </p>
                            </div>
                            <Switch defaultChecked />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Academic Session</CardTitle>
                        <CardDescription>
                            Configure the current academic session
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="currentSession">Current Session</Label>
                            <Input id="currentSession" defaultValue="2025/2026" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="applicationDeadline">Application Deadline</Label>
                            <Input id="applicationDeadline" type="date" />
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-4">
                    <Button variant="outline">Cancel</Button>
                    <Button>Save Changes</Button>
                </div>
            </div>
        </div>
    );
};

export default Settings;
