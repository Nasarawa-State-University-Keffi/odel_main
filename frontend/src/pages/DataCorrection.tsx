import ApplicationLayout from "@/components/ApplicationLayout";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const DataCorrection = () => {
  return (
    <ApplicationLayout>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <h2 className="text-2xl font-bold mb-6">Data-Correction</h2>

          <Tabs defaultValue="current" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="current" className="text-teal-600 data-[state=active]:border-b-2 data-[state=active]:border-teal-600">
                CURRENT
              </TabsTrigger>
              <TabsTrigger value="history">HISTORY</TabsTrigger>
            </TabsList>

            <TabsContent value="current" className="space-y-6">
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select Change" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="phone">Phone</SelectItem>
                  <SelectItem value="address">Address</SelectItem>
                </SelectContent>
              </Select>

              <div>
                <label className="block text-sm text-muted-foreground mb-2">Current</label>
                <Textarea
                  placeholder="Current"
                  className="min-h-[120px] resize-none"
                />
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-2">New</label>
                <Textarea
                  placeholder="New"
                  className="min-h-[120px] resize-none"
                />
              </div>

              <Button className="bg-gray-300 text-gray-700 hover:bg-gray-400">
                Update
              </Button>
            </TabsContent>

            <TabsContent value="history">
              <p className="text-muted-foreground text-center py-8">No history available</p>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ApplicationLayout>
  );
};

export default DataCorrection;
