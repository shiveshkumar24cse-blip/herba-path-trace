import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { getQRCodeData } from '@/utils/blockchain';
import { 
  QrCode, 
  Search, 
  MapPin, 
  Calendar, 
  Weight, 
  Leaf,
  User,
  FlaskConical,
  Factory,
  CheckCircle,
  Info,
  ExternalLink,
  Shield
} from 'lucide-react';

interface TraceabilityData {
  product?: any;
  batches?: any[];
  collections?: any[];
  qualityTests?: any[];
  processingSteps?: any[];
}

export default function ConsumerPortal() {
  const [qrCode, setQrCode] = useState('');
  const [traceData, setTraceData] = useState<TraceabilityData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();

  const scanQRCode = async () => {
    if (!qrCode.trim()) {
      toast({
        title: "Missing QR Code",
        description: "Please enter a QR code to scan.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setError('');
    setTraceData(null);

    try {
      const data = await getQRCodeData(qrCode.trim());
      
      if (data.error) {
        setError(data.error);
        toast({
          title: "QR Code not found",
          description: "This QR code is not registered in our system.",
          variant: "destructive",
        });
      } else {
        setTraceData(data);
        toast({
          title: "QR Code scanned successfully!",
          description: "Full traceability information loaded.",
        });
      }
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Error scanning QR code",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      common: { variant: 'default' as const, color: 'text-green-600' },
      vulnerable: { variant: 'outline' as const, color: 'text-yellow-600' },
      endangered: { variant: 'destructive' as const, color: 'text-red-600' },
      critical: { variant: 'destructive' as const, color: 'text-red-800' },
      excellent: { variant: 'default' as const, color: 'text-green-600' },
      good: { variant: 'default' as const, color: 'text-green-500' },
      fair: { variant: 'outline' as const, color: 'text-yellow-600' },
      fresh: { variant: 'default' as const, color: 'text-green-600' },
      dry: { variant: 'secondary' as const, color: 'text-blue-600' },
      completed: { variant: 'default' as const, color: 'text-green-600' },
      approved: { variant: 'default' as const, color: 'text-green-600' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { variant: 'secondary' as const, color: 'text-gray-600' };

    return (
      <Badge variant={config.variant} className={config.color}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  return (
    <DashboardLayout 
      title="Consumer Portal" 
      description="Scan QR codes to verify herb authenticity and traceability"
    >
      {/* QR Scanner Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <QrCode className="w-5 h-5" />
            <span>QR Code Scanner</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <div className="flex-1">
              <Input
                placeholder="Enter QR code or scan from product packaging"
                value={qrCode}
                onChange={(e) => setQrCode(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && scanQRCode()}
              />
            </div>
            <Button 
              onClick={scanQRCode} 
              disabled={loading}
              className="flex items-center space-x-2"
            >
              <Search className="w-4 h-4" />
              <span>{loading ? 'Scanning...' : 'Scan'}</span>
            </Button>
          </div>
          
          {error && (
            <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-destructive font-medium">Error: {error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Traceability Results */}
      {traceData && (
        <div className="space-y-6">
          {/* Product Information */}
          {traceData.product && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Factory className="w-5 h-5 text-primary" />
                  <span>Product Information</span>
                  <Shield className="w-5 h-5 text-green-600" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{traceData.product.product_name}</h3>
                    <p className="text-muted-foreground mb-4">{traceData.product.product_type}</p>
                    
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">
                          Manufactured by: {traceData.product.manufacturer.full_name}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">
                          Manufacturing Date: {new Date(traceData.product.manufacturing_date).toLocaleDateString()}
                        </span>
                      </div>
                      {traceData.product.expiry_date && (
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">
                            Expiry Date: {new Date(traceData.product.expiry_date).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Formulation Details</h4>
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <pre className="text-sm whitespace-pre-wrap">
                        {JSON.stringify(traceData.product.formulation_details, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Batch Information */}
          {traceData.batches && traceData.batches.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Leaf className="w-5 h-5 text-primary" />
                  <span>Herb Batches ({traceData.batches.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {traceData.batches.map((batch) => (
                    <div key={batch.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{batch.batch_id}</h4>
                        {getStatusBadge(batch.batch_status)}
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p><strong>Herb:</strong> {batch.herb.local_name} ({batch.herb.botanical_name})</p>
                        <p><strong>Quantity:</strong> {batch.total_quantity_kg}kg</p>
                        <p><strong>Aggregator:</strong> {batch.aggregator.full_name}</p>
                        <p><strong>Storage:</strong> {batch.storage_location}</p>
                        <p><strong>Created:</strong> {new Date(batch.creation_timestamp).toLocaleDateString()}</p>
                        {batch.quality_notes && (
                          <p><strong>Quality Notes:</strong> {batch.quality_notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Collection Events */}
          {traceData.collections && traceData.collections.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  <span>Collection Sources ({traceData.collections.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {traceData.collections.map((collection) => (
                    <div key={collection.id} className="p-4 border rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium mb-2">Collection Details</h4>
                          <div className="space-y-1 text-sm">
                            <p><strong>Collector:</strong> {collection.collector.profile.full_name}</p>
                            <p><strong>Location:</strong> {collection.collector.profile.location}</p>
                            <p><strong>Plant Part:</strong> {collection.plant_part}</p>
                            <p><strong>Quantity:</strong> {collection.quantity_kg}kg</p>
                            <p><strong>Date:</strong> {new Date(collection.collection_timestamp).toLocaleDateString()}</p>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium mb-2">Quality & Location</h4>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm">Condition:</span>
                              {getStatusBadge(collection.initial_condition)}
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm">Season:</span>
                              <Badge variant="outline">{collection.harvest_season}</Badge>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              <p>GPS: {collection.latitude.toFixed(6)}, {collection.longitude.toFixed(6)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {collection.herb && (
                        <div className="mt-4 pt-4 border-t">
                          <div className="flex items-center justify-between">
                            <div>
                              <h5 className="font-medium">{collection.herb.local_name}</h5>
                              <p className="text-sm text-muted-foreground">{collection.herb.botanical_name}</p>
                            </div>
                            <div className="text-right">
                              {getStatusBadge(collection.herb.conservation_status)}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quality Tests */}
          {traceData.qualityTests && traceData.qualityTests.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FlaskConical className="w-5 h-5 text-primary" />
                  <span>Quality Test Results ({traceData.qualityTests.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {traceData.qualityTests.map((test) => (
                    <div key={test.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{test.test_type.replace('_', ' ').toUpperCase()}</h4>
                        {getStatusBadge(test.test_status)}
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p><strong>Lab:</strong> {test.lab.full_name}</p>
                        <p><strong>Sample ID:</strong> {test.sample_id}</p>
                        <p><strong>Test Date:</strong> {new Date(test.test_date).toLocaleDateString()}</p>
                        {test.completion_date && (
                          <p><strong>Completed:</strong> {new Date(test.completion_date).toLocaleDateString()}</p>
                        )}
                      </div>
                      
                      <div className="mt-3">
                        <h5 className="font-medium text-sm mb-1">Test Results:</h5>
                        <div className="bg-muted/50 p-2 rounded text-xs">
                          <pre className="whitespace-pre-wrap">
                            {JSON.stringify(test.test_results, null, 2)}
                          </pre>
                        </div>
                      </div>
                      
                      {test.certificate_url && (
                        <div className="mt-2">
                          <Button size="sm" variant="outline" className="flex items-center space-x-1">
                            <ExternalLink className="w-3 h-3" />
                            <span>View Certificate</span>
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Processing Steps */}
          {traceData.processingSteps && traceData.processingSteps.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Factory className="w-5 h-5 text-primary" />
                  <span>Processing History ({traceData.processingSteps.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {traceData.processingSteps.map((step, index) => (
                    <div key={step.id} className="relative">
                      {index < traceData.processingSteps!.length - 1 && (
                        <div className="absolute left-6 top-12 h-8 w-0.5 bg-border"></div>
                      )}
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                          <Factory className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium capitalize">{step.process_type.replace('_', ' ')}</h4>
                            <span className="text-sm text-muted-foreground">
                              {new Date(step.process_date).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <p><strong>Processor:</strong> {step.processor.full_name}</p>
                              <p><strong>Input:</strong> {step.input_quantity_kg}kg</p>
                              {step.output_quantity_kg && (
                                <p><strong>Output:</strong> {step.output_quantity_kg}kg</p>
                              )}
                            </div>
                            {step.process_conditions && (
                              <div>
                                <p><strong>Conditions:</strong></p>
                                <div className="bg-muted/50 p-2 rounded text-xs mt-1">
                                  <pre className="whitespace-pre-wrap">
                                    {JSON.stringify(step.process_conditions, null, 2)}
                                  </pre>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Blockchain Verification */}
          <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-green-700 dark:text-green-400">
                <Shield className="w-5 h-5" />
                <span>Blockchain Verified</span>
                <CheckCircle className="w-5 h-5" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p className="flex items-center space-x-2">
                  <Info className="w-4 h-4" />
                  <span>This product's entire supply chain has been recorded on an immutable blockchain ledger.</span>
                </p>
                <p className="text-muted-foreground">
                  All information displayed here has been cryptographically verified and cannot be altered retroactively.
                </p>
                <p className="text-muted-foreground">
                  Scan date: {new Date().toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Help Section */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Info className="w-5 h-5" />
            <span>How to Use QR Scanner</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm text-muted-foreground">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-medium text-primary">1</span>
              </div>
              <p>Look for the QR code on your Ayurvedic product packaging</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-medium text-primary">2</span>
              </div>
              <p>Enter the QR code in the scanner above or use your phone's camera</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-medium text-primary">3</span>
              </div>
              <p>View complete traceability information from farm to your hands</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-medium text-primary">4</span>
              </div>
              <p>Verify authenticity, quality tests, and sustainable sourcing practices</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}