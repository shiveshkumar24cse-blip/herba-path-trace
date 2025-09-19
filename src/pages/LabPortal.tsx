import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { TestTube, FileText, CheckCircle, Clock, XCircle } from "lucide-react";

interface QualityTest {
  id: string;
  batch_id: string;
  sample_id: string;
  test_type: string;
  test_status: string;
  test_date: string;
  completion_date?: string;
  test_parameters: any;
  test_results: any;
  certificate_url?: string;
  batches?: {
    batch_id: string;
    total_quantity_kg: number;
    herbs?: {
      botanical_name: string;
      local_name: string;
    };
  };
}

const LabPortal = () => {
  const [qualityTests, setQualityTests] = useState<QualityTest[]>([]);
  const [selectedTest, setSelectedTest] = useState<QualityTest | null>(null);
  const [testResults, setTestResults] = useState({
    moisture_content: "",
    pesticide_residue: "",
    heavy_metals: "",
    microbial_count: "",
    dna_barcode: "",
    overall_grade: "",
    notes: ""
  });
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchQualityTests();
  }, []);

  const fetchQualityTests = async () => {
    try {
      const { data, error } = await supabase
        .from('quality_tests')
        .select(`
          *,
          batches:batch_id (
            batch_id,
            total_quantity_kg,
            herbs:herb_id (
              botanical_name,
              local_name
            )
          )
        `)
        .eq('lab_id', profile?.id)
        .order('test_date', { ascending: false });

      if (error) throw error;
      setQualityTests(data || []);
    } catch (error) {
      console.error('Error fetching quality tests:', error);
      toast({
        title: "Error",
        description: "Failed to fetch quality tests",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateTestResults = async () => {
    if (!selectedTest) return;

    try {
      const { error } = await supabase
        .from('quality_tests')
        .update({
          test_results: testResults,
          test_status: 'completed',
          completion_date: new Date().toISOString()
        })
        .eq('id', selectedTest.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Test results updated successfully"
      });

      fetchQualityTests();
      setSelectedTest(null);
      setTestResults({
        moisture_content: "",
        pesticide_residue: "",
        heavy_metals: "",
        microbial_count: "",
        dna_barcode: "",
        overall_grade: "",
        notes: ""
      });
    } catch (error) {
      console.error('Error updating test results:', error);
      toast({
        title: "Error",
        description: "Failed to update test results",
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'failed':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Lab Portal">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Lab Portal">
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <TestTube className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Lab Testing Portal</h1>
            <p className="text-muted-foreground">Manage quality tests and lab results</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Test Queue */}
          <Card>
            <CardHeader>
              <CardTitle>Quality Test Queue</CardTitle>
              <CardDescription>Pending and completed tests</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {qualityTests.map((test) => (
                <div
                  key={test.id}
                  className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedTest(test)}
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(test.test_status)}
                      <span className="font-medium">Sample #{test.sample_id}</span>
                      <Badge variant={getStatusBadgeVariant(test.test_status)}>
                        {test.test_status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {test.batches?.herbs?.botanical_name} ({test.batches?.herbs?.local_name})
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Batch: {test.batches?.batch_id} • {test.test_type}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    {test.test_status === 'pending' ? 'Process' : 'View'}
                  </Button>
                </div>
              ))}
              {qualityTests.length === 0 && (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No quality tests assigned</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Test Results Form */}
          {selectedTest && (
            <Card>
              <CardHeader>
                <CardTitle>Test Results - Sample #{selectedTest.sample_id}</CardTitle>
                <CardDescription>
                  {selectedTest.batches?.herbs?.botanical_name} from Batch {selectedTest.batches?.batch_id}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="moisture">Moisture Content (%)</Label>
                    <Input
                      id="moisture"
                      value={testResults.moisture_content}
                      onChange={(e) => setTestResults({...testResults, moisture_content: e.target.value})}
                      placeholder="8.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="pesticide">Pesticide Residue (ppm)</Label>
                    <Input
                      id="pesticide"
                      value={testResults.pesticide_residue}
                      onChange={(e) => setTestResults({...testResults, pesticide_residue: e.target.value})}
                      placeholder="0.01"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="metals">Heavy Metals (ppm)</Label>
                    <Input
                      id="metals"
                      value={testResults.heavy_metals}
                      onChange={(e) => setTestResults({...testResults, heavy_metals: e.target.value})}
                      placeholder="0.1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="microbial">Microbial Count (CFU/g)</Label>
                    <Input
                      id="microbial"
                      value={testResults.microbial_count}
                      onChange={(e) => setTestResults({...testResults, microbial_count: e.target.value})}
                      placeholder="1000"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="dna">DNA Barcode Result</Label>
                  <Input
                    id="dna"
                    value={testResults.dna_barcode}
                    onChange={(e) => setTestResults({...testResults, dna_barcode: e.target.value})}
                    placeholder="Confirmed: Withania somnifera"
                  />
                </div>

                <div>
                  <Label htmlFor="grade">Overall Grade</Label>
                  <Select value={testResults.overall_grade} onValueChange={(value) => setTestResults({...testResults, overall_grade: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select grade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">Grade A - Premium</SelectItem>
                      <SelectItem value="B">Grade B - Standard</SelectItem>
                      <SelectItem value="C">Grade C - Below Standard</SelectItem>
                      <SelectItem value="REJECT">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="notes">Lab Notes</Label>
                  <Textarea
                    id="notes"
                    value={testResults.notes}
                    onChange={(e) => setTestResults({...testResults, notes: e.target.value})}
                    placeholder="Additional observations..."
                  />
                </div>

                <div className="flex space-x-2">
                  <Button onClick={updateTestResults} className="flex-1">
                    Save Results
                  </Button>
                  <Button variant="outline" onClick={() => setSelectedTest(null)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default LabPortal;