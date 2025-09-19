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
import { MapPin, Leaf, Plus, Calendar, Thermometer } from "lucide-react";

interface Herb {
  id: string;
  botanical_name: string;
  local_name: string;
  harvest_season?: string[];
  conservation_status?: string;
}

interface CollectionEvent {
  id: string;
  quantity_kg: number;
  collection_timestamp: string;
  latitude: number;
  longitude: number;
  initial_condition: string;
  plant_part: string;
  harvest_season: string;
  herbs?: {
    botanical_name: string;
    local_name: string;
  };
}

interface Collector {
  id: string;
  collector_type: string;
  verification_status: string;
  aadhaar_id?: string;
  cooperative_id?: string;
}

const CollectorPortal = () => {
  const [herbs, setHerbs] = useState<Herb[]>([]);
  const [collectionEvents, setCollectionEvents] = useState<CollectionEvent[]>([]);
  const [collector, setCollector] = useState<Collector | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showCollectionForm, setShowCollectionForm] = useState(false);
  const [collectionForm, setCollectionForm] = useState({
    herb_id: "",
    quantity_kg: "",
    plant_part: "",
    harvest_season: "",
    initial_condition: "",
    environmental_data: "",
    storage_conditions: ""
  });
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
    getCurrentLocation();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch collector profile
      const { data: collectorData, error: collectorError } = await supabase
        .from('collectors')
        .select('*')
        .eq('profile_id', profile?.id)
        .single();

      if (collectorError && collectorError.code !== 'PGRST116') {
        throw collectorError;
      }

      // Fetch herbs
      const { data: herbsData, error: herbsError } = await supabase
        .from('herbs')
        .select('*')
        .order('botanical_name');

      if (herbsError) throw herbsError;

      // Fetch collection events if collector exists
      let eventsData = [];
      if (collectorData) {
        const { data, error: eventsError } = await supabase
          .from('collection_events')
          .select(`
            *,
            herbs:herb_id (
              botanical_name,
              local_name
            )
          `)
          .eq('collector_id', collectorData.id)
          .order('collection_timestamp', { ascending: false });

        if (eventsError) throw eventsError;
        eventsData = data || [];
      }

      setCollector(collectorData);
      setHerbs(herbsData || []);
      setCollectionEvents(eventsData);
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

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          toast({
            title: "Location Error",
            description: "Unable to get current location. Please enable location services.",
            variant: "destructive"
          });
        }
      );
    }
  };

  const createCollectorProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('collectors')
        .insert([{
          profile_id: profile?.id,
          collector_type: profile?.role === 'farmer' ? 'farmer' : 'wild_collector',
          verification_status: 'pending',
          aadhaar_id: profile?.aadhaar_id,
          cooperative_id: profile?.cooperative_group
        }])
        .select()
        .single();

      if (error) throw error;

      setCollector(data);
      toast({
        title: "Success",
        description: "Collector profile created successfully"
      });
    } catch (error) {
      console.error('Error creating collector profile:', error);
      toast({
        title: "Error",
        description: "Failed to create collector profile",
        variant: "destructive"
      });
    }
  };

  const recordCollection = async () => {
    if (!collector || !location || !collectionForm.herb_id || !collectionForm.quantity_kg) {
      toast({
        title: "Error",
        description: "Please fill all required fields and ensure location is available",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('collection_events')
        .insert([{
          collector_id: collector.id,
          herb_id: collectionForm.herb_id,
          quantity_kg: parseFloat(collectionForm.quantity_kg),
          latitude: location.lat,
          longitude: location.lng,
          plant_part: collectionForm.plant_part,
          harvest_season: collectionForm.harvest_season,
          initial_condition: collectionForm.initial_condition,
          environmental_data: collectionForm.environmental_data ? JSON.parse(collectionForm.environmental_data) : null,
          storage_conditions: collectionForm.storage_conditions ? JSON.parse(collectionForm.storage_conditions) : null
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Collection event recorded successfully"
      });

      setCollectionForm({
        herb_id: "",
        quantity_kg: "",
        plant_part: "",
        harvest_season: "",
        initial_condition: "",
        environmental_data: "",
        storage_conditions: ""
      });
      setShowCollectionForm(false);
      fetchData();
    } catch (error) {
      console.error('Error recording collection:', error);
      toast({
        title: "Error",
        description: "Failed to record collection event",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Collector Portal">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  // If no collector profile exists, show creation form
  if (!collector) {
    return (
      <DashboardLayout title="Collector Portal">
        <div className="flex items-center justify-center h-64">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Create Collector Profile</CardTitle>
              <CardDescription>
                Set up your collector profile to start recording herb collections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={createCollectorProfile} className="w-full">
                Create Profile
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Collector Portal">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Leaf className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Collector Portal</h1>
              <p className="text-muted-foreground">Record herb collections with GPS tracking</p>
            </div>
          </div>
          <Button onClick={() => setShowCollectionForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Record Collection
          </Button>
        </div>

        {/* Collector Status */}
        <Card>
          <CardHeader>
            <CardTitle>Collector Status</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="space-y-1">
              <p><strong>Type:</strong> {collector.collector_type}</p>
              <p><strong>Verification:</strong> 
                <Badge variant={collector.verification_status === 'verified' ? 'default' : 'secondary'} className="ml-2">
                  {collector.verification_status}
                </Badge>
              </p>
              {collector.aadhaar_id && <p><strong>Aadhaar:</strong> {collector.aadhaar_id}</p>}
              {collector.cooperative_id && <p><strong>Cooperative:</strong> {collector.cooperative_id}</p>}
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : 'Location unavailable'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Collection History */}
        <Card>
          <CardHeader>
            <CardTitle>Collection History</CardTitle>
            <CardDescription>Your recorded herb collections</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {collectionEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Leaf className="h-4 w-4 text-green-600" />
                      <span className="font-medium">
                        {event.herbs?.botanical_name} ({event.herbs?.local_name})
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>📦 {event.quantity_kg} kg</span>
                      <span>🌱 {event.plant_part}</span>
                      <span>📍 {event.latitude.toFixed(4)}, {event.longitude.toFixed(4)}</span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>📅 {new Date(event.collection_timestamp).toLocaleDateString()}</span>
                      <span>🏷️ {event.harvest_season}</span>
                      <Badge variant="outline">{event.initial_condition}</Badge>
                    </div>
                  </div>
                </div>
              ))}
              {collectionEvents.length === 0 && (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No collections recorded yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Collection Form Modal */}
        {showCollectionForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>Record Collection</CardTitle>
                <CardDescription>
                  Current location: {location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : 'Getting location...'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="herb">Herb *</Label>
                  <Select value={collectionForm.herb_id} onValueChange={(value) => setCollectionForm({...collectionForm, herb_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select herb" />
                    </SelectTrigger>
                    <SelectContent>
                      {herbs.map((herb) => (
                        <SelectItem key={herb.id} value={herb.id}>
                          {herb.botanical_name} ({herb.local_name})
                          {herb.conservation_status && (
                            <Badge variant="outline" className="ml-2">{herb.conservation_status}</Badge>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="quantity">Quantity (kg) *</Label>
                  <Input
                    id="quantity"
                    value={collectionForm.quantity_kg}
                    onChange={(e) => setCollectionForm({...collectionForm, quantity_kg: e.target.value})}
                    placeholder="10.5"
                    type="number"
                    step="0.1"
                  />
                </div>

                <div>
                  <Label htmlFor="plant_part">Plant Part *</Label>
                  <Select value={collectionForm.plant_part} onValueChange={(value) => setCollectionForm({...collectionForm, plant_part: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select part" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="root">Root</SelectItem>
                      <SelectItem value="leaf">Leaf</SelectItem>
                      <SelectItem value="stem">Stem</SelectItem>
                      <SelectItem value="bark">Bark</SelectItem>
                      <SelectItem value="seed">Seed</SelectItem>
                      <SelectItem value="flower">Flower</SelectItem>
                      <SelectItem value="fruit">Fruit</SelectItem>
                      <SelectItem value="whole_plant">Whole Plant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="season">Harvest Season *</Label>
                  <Select value={collectionForm.harvest_season} onValueChange={(value) => setCollectionForm({...collectionForm, harvest_season: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select season" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="spring">Spring</SelectItem>
                      <SelectItem value="summer">Summer</SelectItem>
                      <SelectItem value="monsoon">Monsoon</SelectItem>
                      <SelectItem value="winter">Winter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="condition">Initial Condition *</Label>
                  <Select value={collectionForm.initial_condition} onValueChange={(value) => setCollectionForm({...collectionForm, initial_condition: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fresh">Fresh</SelectItem>
                      <SelectItem value="partially_dried">Partially Dried</SelectItem>
                      <SelectItem value="sun_dried">Sun Dried</SelectItem>
                      <SelectItem value="damaged">Damaged</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="environmental">Environmental Data (JSON)</Label>
                  <Textarea
                    id="environmental"
                    value={collectionForm.environmental_data}
                    onChange={(e) => setCollectionForm({...collectionForm, environmental_data: e.target.value})}
                    placeholder='{"temperature": "25°C", "humidity": "60%", "rainfall": "low"}'
                  />
                </div>

                <div>
                  <Label htmlFor="storage">Storage Conditions (JSON)</Label>
                  <Textarea
                    id="storage"
                    value={collectionForm.storage_conditions}
                    onChange={(e) => setCollectionForm({...collectionForm, storage_conditions: e.target.value})}
                    placeholder='{"container": "jute bags", "temperature": "ambient", "ventilation": "good"}'
                  />
                </div>

                <div className="flex space-x-2">
                  <Button onClick={recordCollection} className="flex-1" disabled={!location}>
                    Record Collection
                  </Button>
                  <Button variant="outline" onClick={() => setShowCollectionForm(false)}>
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

export default CollectorPortal;