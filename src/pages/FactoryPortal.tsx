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
import { Factory, Package, Plus, ArrowRight } from "lucide-react";
import { generateQRCode } from "@/utils/blockchain";

interface Batch {
  id: string;
  batch_id: string;
  total_quantity_kg: number;
  batch_status: string;
  herbs?: {
    botanical_name: string;
    local_name: string;
  };
}

interface ProcessingStep {
  id: string;
  batch_id: string;
  process_type: string;
  input_quantity_kg: number;
  output_quantity_kg?: number;
  process_date: string;
  completion_date?: string;
  batches?: {
    batch_id: string;
    herbs?: {
      botanical_name: string;
      local_name: string;
    };
  };
}

const FactoryPortal = () => {
  const [availableBatches, setAvailableBatches] = useState<Batch[]>([]);
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [processForm, setProcessForm] = useState({
    process_type: "",
    input_quantity_kg: "",
    process_parameters: "",
    process_conditions: ""
  });
  const [productForm, setProductForm] = useState({
    product_name: "",
    product_type: "",
    final_quantity: "",
    unit_type: "",
    formulation_details: ""
  });
  const [showProductForm, setShowProductForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch available batches (approved by lab)
      const { data: batches, error: batchError } = await supabase
        .from('batches')
        .select(`
          *,
          herbs:herb_id (
            botanical_name,
            local_name
          )
        `)
        .eq('batch_status', 'approved')
        .order('creation_timestamp', { ascending: false });

      if (batchError) throw batchError;

      // Fetch processing steps
      const { data: steps, error: stepsError } = await supabase
        .from('processing_steps')
        .select(`
          *,
          batches:batch_id (
            batch_id,
            herbs:herb_id (
              botanical_name,
              local_name
            )
          )
        `)
        .eq('processor_id', profile?.id)
        .order('process_date', { ascending: false });

      if (stepsError) throw stepsError;

      setAvailableBatches(batches || []);
      setProcessingSteps(steps || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createProcessingStep = async () => {
    if (!selectedBatch || !processForm.process_type || !processForm.input_quantity_kg) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('processing_steps')
        .insert([{
          batch_id: selectedBatch.id,
          processor_id: profile?.id,
          process_type: processForm.process_type,
          input_quantity_kg: parseFloat(processForm.input_quantity_kg),
          process_parameters: JSON.parse(processForm.process_parameters || '{}'),
          process_conditions: JSON.parse(processForm.process_conditions || '{}')
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Processing step created successfully"
      });

      setProcessForm({
        process_type: "",
        input_quantity_kg: "",
        process_parameters: "",
        process_conditions: ""
      });
      setSelectedBatch(null);
      fetchData();
    } catch (error) {
      console.error('Error creating processing step:', error);
      toast({
        title: "Error",
        description: "Failed to create processing step",
        variant: "destructive"
      });
    }
  };

  const createProduct = async () => {
    if (!productForm.product_name || !productForm.final_quantity) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      // Get batch IDs from completed processing steps
      const batchIds = processingSteps
        .filter(step => step.completion_date)
        .map(step => step.batch_id);

      const qrCode = generateQRCode({
        type: 'product',
        productId: `PROD_${Date.now()}`,
        batchIds
      });

      const { error } = await supabase
        .from('products')
        .insert([{
          manufacturer_id: profile?.id,
          product_name: productForm.product_name,
          product_type: productForm.product_type,
          final_quantity: parseInt(productForm.final_quantity),
          unit_type: productForm.unit_type,
          formulation_details: JSON.parse(productForm.formulation_details || '{}'),
          batch_ids: batchIds,
          qr_code: qrCode
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Product created successfully with QR code"
      });

      setProductForm({
        product_name: "",
        product_type: "",
        final_quantity: "",
        unit_type: "",
        formulation_details: ""
      });
      setShowProductForm(false);
    } catch (error) {
      console.error('Error creating product:', error);
      toast({
        title: "Error",
        description: "Failed to create product",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Factory Portal">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Factory Portal">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Factory className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Factory Processing Portal</h1>
              <p className="text-muted-foreground">Process herbs and create final products</p>
            </div>
          </div>
          <Button onClick={() => setShowProductForm(true)}>
            <Package className="h-4 w-4 mr-2" />
            Create Product
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Available Batches */}
          <Card>
            <CardHeader>
              <CardTitle>Available Batches</CardTitle>
              <CardDescription>Lab-approved batches ready for processing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {availableBatches.map((batch) => (
                <div
                  key={batch.id}
                  className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedBatch(batch)}
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">Batch #{batch.batch_id}</span>
                      <Badge variant="default">{batch.batch_status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {batch.herbs?.botanical_name} ({batch.herbs?.local_name})
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Quantity: {batch.total_quantity_kg} kg
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Process
                  </Button>
                </div>
              ))}
              {availableBatches.length === 0 && (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No batches available for processing</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Processing Form */}
          {selectedBatch && (
            <Card>
              <CardHeader>
                <CardTitle>Process Batch #{selectedBatch.batch_id}</CardTitle>
                <CardDescription>
                  {selectedBatch.herbs?.botanical_name} - {selectedBatch.total_quantity_kg} kg
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="process_type">Process Type</Label>
                  <Select value={processForm.process_type} onValueChange={(value) => setProcessForm({...processForm, process_type: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select process" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="drying">Drying</SelectItem>
                      <SelectItem value="grinding">Grinding</SelectItem>
                      <SelectItem value="extraction">Extraction</SelectItem>
                      <SelectItem value="purification">Purification</SelectItem>
                      <SelectItem value="formulation">Formulation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="input_quantity">Input Quantity (kg)</Label>
                  <Input
                    id="input_quantity"
                    value={processForm.input_quantity_kg}
                    onChange={(e) => setProcessForm({...processForm, input_quantity_kg: e.target.value})}
                    placeholder="10.5"
                    type="number"
                  />
                </div>

                <div>
                  <Label htmlFor="parameters">Process Parameters (JSON)</Label>
                  <Textarea
                    id="parameters"
                    value={processForm.process_parameters}
                    onChange={(e) => setProcessForm({...processForm, process_parameters: e.target.value})}
                    placeholder='{"temperature": "60°C", "duration": "24h"}'
                  />
                </div>

                <div>
                  <Label htmlFor="conditions">Process Conditions (JSON)</Label>
                  <Textarea
                    id="conditions"
                    value={processForm.process_conditions}
                    onChange={(e) => setProcessForm({...processForm, process_conditions: e.target.value})}
                    placeholder='{"humidity": "40%", "pressure": "1atm"}'
                  />
                </div>

                <div className="flex space-x-2">
                  <Button onClick={createProcessingStep} className="flex-1">
                    <Plus className="h-4 w-4 mr-2" />
                    Start Processing
                  </Button>
                  <Button variant="outline" onClick={() => setSelectedBatch(null)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Processing Steps History */}
        <Card>
          <CardHeader>
            <CardTitle>Processing History</CardTitle>
            <CardDescription>Your recent processing activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {processingSteps.map((step) => (
                <div key={step.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{step.process_type}</span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <span>{step.batches?.herbs?.botanical_name}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Batch: {step.batches?.batch_id} • Input: {step.input_quantity_kg} kg
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Started: {new Date(step.process_date).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={step.completion_date ? "default" : "secondary"}>
                    {step.completion_date ? "Completed" : "In Progress"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Product Creation Modal */}
        {showProductForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Create Final Product</CardTitle>
                <CardDescription>Generate QR code for consumer traceability</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="product_name">Product Name</Label>
                  <Input
                    id="product_name"
                    value={productForm.product_name}
                    onChange={(e) => setProductForm({...productForm, product_name: e.target.value})}
                    placeholder="Ashwagandha Tablets"
                  />
                </div>

                <div>
                  <Label htmlFor="product_type">Product Type</Label>
                  <Select value={productForm.product_type} onValueChange={(value) => setProductForm({...productForm, product_type: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tablet">Tablet</SelectItem>
                      <SelectItem value="capsule">Capsule</SelectItem>
                      <SelectItem value="powder">Powder</SelectItem>
                      <SelectItem value="extract">Extract</SelectItem>
                      <SelectItem value="oil">Oil</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="quantity">Final Quantity</Label>
                    <Input
                      id="quantity"
                      value={productForm.final_quantity}
                      onChange={(e) => setProductForm({...productForm, final_quantity: e.target.value})}
                      placeholder="100"
                      type="number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="unit">Unit Type</Label>
                    <Select value={productForm.unit_type} onValueChange={(value) => setProductForm({...productForm, unit_type: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tablets">Tablets</SelectItem>
                        <SelectItem value="capsules">Capsules</SelectItem>
                        <SelectItem value="grams">Grams</SelectItem>
                        <SelectItem value="ml">ML</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="formulation">Formulation Details (JSON)</Label>
                  <Textarea
                    id="formulation"
                    value={productForm.formulation_details}
                    onChange={(e) => setProductForm({...productForm, formulation_details: e.target.value})}
                    placeholder='{"active_ingredient": "500mg", "excipients": ["lactose", "starch"]}'
                  />
                </div>

                <div className="flex space-x-2">
                  <Button onClick={createProduct} className="flex-1">
                    Create Product
                  </Button>
                  <Button variant="outline" onClick={() => setShowProductForm(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default FactoryPortal;