import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { createBlockchainRecord, generateQRCode } from '@/utils/blockchain';
import { 
  Package, 
  Plus, 
  Search, 
  MapPin, 
  Calendar, 
  Weight, 
  Leaf,
  FlaskConical,
  Factory,
  QrCode,
  TrendingUp,
  Users,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface Herb {
  id: string;
  botanical_name: string;
  local_name: string;
  conservation_status: string;
  approved_regions: string[];
}

interface CollectionEvent {
  id: string;
  collector: {
    profile: {
      full_name: string;
      location: string;
    };
  };
  herb: Herb;
  plant_part: string;
  quantity_kg: number;
  latitude: number;
  longitude: number;
  collection_timestamp: string;
  initial_condition: string;
}

interface Batch {
  id: string;
  batch_id: string;
  herb: Herb;
  total_quantity_kg: number;
  batch_status: string;
  creation_timestamp: string;
  quality_notes: string;
  storage_location: string;
  qr_code: string;
}

export default function AggregatorDashboard() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [collections, setCollections] = useState<CollectionEvent[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [herbs, setHerbs] = useState<Herb[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [batchForm, setBatchForm] = useState({
    herb_id: '',
    quality_notes: '',
    storage_location: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load collection events
      const { data: collectionsData } = await supabase
        .from('collection_events')
        .select(`
          *,
          collector:collectors(
            *,
            profile:profiles(*)
          ),
          herb:herbs(*)
        `)
        .order('collection_timestamp', { ascending: false });

      // Load batches created by this aggregator
      const { data: batchesData } = await supabase
        .from('batches')
        .select(`
          *,
          herb:herbs(*)
        `)
        .eq('aggregator_id', profile?.id)
        .order('creation_timestamp', { ascending: false });

      // Load herbs
      const { data: herbsData } = await supabase
        .from('herbs')
        .select('*')
        .order('local_name');

      setCollections(collectionsData || []);
      setBatches(batchesData || []);
      setHerbs(herbsData || []);
    } catch (error: any) {
      toast({
        title: "Error loading data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createBatch = async () => {
    if (!batchForm.herb_id || selectedCollections.length === 0) {
      toast({
        title: "Missing information",
        description: "Please select herb type and at least one collection.",
        variant: "destructive",
      });
      return;
    }

    try {
      const selectedCollectionData = collections.filter(c => 
        selectedCollections.includes(c.id) && c.herb.id === batchForm.herb_id
      );

      if (selectedCollectionData.length === 0) {
        toast({
          title: "Invalid selection",
          description: "Selected collections don't match the chosen herb type.",
          variant: "destructive",
        });
        return;
      }

      const totalQuantity = selectedCollectionData.reduce((sum, c) => sum + Number(c.quantity_kg), 0);
      
      // Generate batch ID
      const batchId = `BATCH_${Date.now()}`;
      const qrCode = generateQRCode({ type: 'batch', batchId, herbId: batchForm.herb_id });

      // Create batch
      const { data: newBatch, error: batchError } = await supabase
        .from('batches')
        .insert({
          batch_id: batchId,
          herb_id: batchForm.herb_id,
          total_quantity_kg: totalQuantity,
          aggregator_id: profile?.id,
          quality_notes: batchForm.quality_notes,
          storage_location: batchForm.storage_location,
          qr_code: qrCode,
        })
        .select()
        .single();

      if (batchError) throw batchError;

      // Create batch-collection mappings
      const batchCollections = selectedCollectionData.map(collection => ({
        batch_id: newBatch.id,
        collection_event_id: collection.id,
        contribution_percentage: (Number(collection.quantity_kg) / totalQuantity) * 100,
      }));

      const { error: mappingError } = await supabase
        .from('batch_collections')
        .insert(batchCollections);

      if (mappingError) throw mappingError;

      // Create blockchain record
      await createBlockchainRecord('BATCH_CREATED', {
        batch_id: batchId,
        herb_id: batchForm.herb_id,
        total_quantity_kg: totalQuantity,
        collections: selectedCollections.length,
        aggregator_id: profile?.id,
      }, newBatch.id);

      toast({
        title: "Batch created successfully!",
        description: `Batch ${batchId} has been created with ${selectedCollections.length} collections.`,
      });

      // Reset form
      setBatchForm({ herb_id: '', quality_notes: '', storage_location: '' });
      setSelectedCollections([]);
      loadData();
    } catch (error: any) {
      toast({
        title: "Error creating batch",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const sendToLab = async (batchId: string) => {
    try {
      const { error } = await supabase
        .from('batches')
        .update({ batch_status: 'lab_testing' })
        .eq('id', batchId);

      if (error) throw error;

      // Create blockchain record
      await createBlockchainRecord('BATCH_SENT_TO_LAB', {
        batch_id: batchId,
        status: 'lab_testing',
      }, batchId);

      toast({
        title: "Batch sent to lab",
        description: "The batch has been marked for lab testing.",
      });

      loadData();
    } catch (error: any) {
      toast({
        title: "Error updating batch",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      created: { variant: 'secondary' as const, icon: Package },
      lab_testing: { variant: 'default' as const, icon: FlaskConical },
      approved: { variant: 'default' as const, icon: CheckCircle },
      rejected: { variant: 'destructive' as const, icon: AlertCircle },
      dispatched: { variant: 'outline' as const, icon: Factory },
      sold: { variant: 'default' as const, icon: QrCode },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.created;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center space-x-1">
        <Icon className="w-3 h-3" />
        <span className="capitalize">{status.replace('_', ' ')}</span>
      </Badge>
    );
  };

  const availableCollections = collections.filter(c => 
    !batches.some(b => 
      b.herb.id === c.herb.id && 
      selectedCollections.includes(c.id)
    )
  );

  const filteredCollections = batchForm.herb_id 
    ? availableCollections.filter(c => c.herb.id === batchForm.herb_id)
    : [];

  if (loading) {
    return (
      <DashboardLayout title="Aggregator Dashboard" description="Manage herb collections and create batches">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title="Aggregator Dashboard" 
      description="Manage herb collections and create batches for distribution"
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Leaf className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Collections</p>
                <p className="text-2xl font-bold">{collections.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Batches</p>
                <p className="text-2xl font-bold">{batches.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold">
                  {batches.filter(b => b.batch_status === 'approved').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Volume</p>
                <p className="text-2xl font-bold">
                  {collections.reduce((sum, c) => sum + Number(c.quantity_kg), 0).toFixed(1)}kg
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="collections" className="space-y-6">
        <TabsList>
          <TabsTrigger value="collections">Collections</TabsTrigger>
          <TabsTrigger value="create-batch">Create Batch</TabsTrigger>
          <TabsTrigger value="batches">My Batches</TabsTrigger>
        </TabsList>

        <TabsContent value="collections" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Search className="w-5 h-5" />
                <span>Recent Collections</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {collections.slice(0, 10).map((collection) => (
                  <div key={collection.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <Leaf className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium">{collection.herb.local_name}</h3>
                          <p className="text-sm text-muted-foreground">
                            by {collection.collector.profile.full_name}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Weight className="w-4 h-4" />
                        <span>{collection.quantity_kg}kg</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span>{collection.collector.profile.location}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(collection.collection_timestamp).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create-batch" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Plus className="w-5 h-5" />
                <span>Create New Batch</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="herb_id">Herb Type</Label>
                  <Select 
                    value={batchForm.herb_id} 
                    onValueChange={(value) => setBatchForm(prev => ({ ...prev, herb_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select herb type" />
                    </SelectTrigger>
                    <SelectContent>
                      {herbs.map((herb) => (
                        <SelectItem key={herb.id} value={herb.id}>
                          {herb.local_name} ({herb.botanical_name})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="storage_location">Storage Location</Label>
                  <Input
                    id="storage_location"
                    placeholder="Warehouse location"
                    value={batchForm.storage_location}
                    onChange={(e) => setBatchForm(prev => ({ ...prev, storage_location: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quality_notes">Quality Notes</Label>
                  <Input
                    id="quality_notes"
                    placeholder="Visual inspection notes"
                    value={batchForm.quality_notes}
                    onChange={(e) => setBatchForm(prev => ({ ...prev, quality_notes: e.target.value }))}
                  />
                </div>
              </div>

              {batchForm.herb_id && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Select Collections to Include</h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {filteredCollections.map((collection) => (
                      <div 
                        key={collection.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedCollections.includes(collection.id)
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => {
                          setSelectedCollections(prev => 
                            prev.includes(collection.id)
                              ? prev.filter(id => id !== collection.id)
                              : [...prev, collection.id]
                          );
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{collection.collector.profile.full_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {collection.plant_part} • {collection.initial_condition}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{collection.quantity_kg}kg</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(collection.collection_timestamp).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {selectedCollections.length > 0 && (
                    <div className="p-4 bg-primary/5 rounded-lg">
                      <p className="font-medium">Batch Summary</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedCollections.length} collections • {' '}
                        {filteredCollections
                          .filter(c => selectedCollections.includes(c.id))
                          .reduce((sum, c) => sum + Number(c.quantity_kg), 0)
                          .toFixed(1)}kg total
                      </p>
                    </div>
                  )}

                  <Button 
                    onClick={createBatch}
                    disabled={selectedCollections.length === 0}
                    className="w-full"
                  >
                    Create Batch
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="batches" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="w-5 h-5" />
                <span>My Batches</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {batches.map((batch) => (
                  <div key={batch.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center">
                          <Package className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                          <h3 className="font-medium">{batch.batch_id}</h3>
                          <p className="text-sm text-muted-foreground">
                            {batch.herb.local_name} • {batch.total_quantity_kg}kg
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      {getStatusBadge(batch.batch_status)}
                      {batch.batch_status === 'created' && (
                        <Button 
                          size="sm" 
                          onClick={() => sendToLab(batch.id)}
                          className="flex items-center space-x-1"
                        >
                          <FlaskConical className="w-4 h-4" />
                          <span>Send to Lab</span>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}