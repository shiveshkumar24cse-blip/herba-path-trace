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
import { useToast } from "@/hooks/use-toast";
import { Shield, Users, Leaf, Database, Plus, Eye } from "lucide-react";

interface User {
  id: string;
  full_name: string;
  email: string;
  role: string;
  organization?: string;
  location?: string;
  created_at: string;
}

interface Herb {
  id: string;
  botanical_name: string;
  local_name: string;
  plant_family?: string;
  conservation_status?: string;
  approved_regions?: string[];
  medicinal_properties?: string[];
  harvest_season?: string[];
}

interface ComplianceRule {
  id: string;
  herb_id: string;
  rule_type: string;
  rule_parameters: any;
  is_active: boolean;
  herbs?: {
    botanical_name: string;
    local_name: string;
  };
}

const AdminPortal = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [herbs, setHerbs] = useState<Herb[]>([]);
  const [complianceRules, setComplianceRules] = useState<ComplianceRule[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [showHerbForm, setShowHerbForm] = useState(false);
  const [showRuleForm, setShowRuleForm] = useState(false);
  
  const [herbForm, setHerbForm] = useState({
    botanical_name: "",
    local_name: "",
    plant_family: "",
    conservation_status: "",
    approved_regions: "",
    medicinal_properties: "",
    harvest_season: ""
  });

  const [ruleForm, setRuleForm] = useState({
    herb_id: "",
    rule_type: "",
    rule_parameters: ""
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch users (profiles)
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      // Fetch herbs
      const { data: herbsData, error: herbsError } = await supabase
        .from('herbs')
        .select('*')
        .order('created_at', { ascending: false });

      if (herbsError) throw herbsError;

      // Fetch compliance rules
      const { data: rulesData, error: rulesError } = await supabase
        .from('compliance_rules')
        .select(`
          *,
          herbs:herb_id (
            botanical_name,
            local_name
          )
        `)
        .order('created_at', { ascending: false });

      if (rulesError) throw rulesError;

      setUsers(usersData || []);
      setHerbs(herbsData || []);
      setComplianceRules(rulesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch admin data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createHerb = async () => {
    try {
      const { error } = await supabase
        .from('herbs')
        .insert([{
          botanical_name: herbForm.botanical_name,
          local_name: herbForm.local_name,
          plant_family: herbForm.plant_family || null,
          conservation_status: herbForm.conservation_status || null,
          approved_regions: herbForm.approved_regions ? herbForm.approved_regions.split(',').map(r => r.trim()) : null,
          medicinal_properties: herbForm.medicinal_properties ? herbForm.medicinal_properties.split(',').map(p => p.trim()) : null,
          harvest_season: herbForm.harvest_season ? herbForm.harvest_season.split(',').map(s => s.trim()) : null
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Herb added successfully"
      });

      setHerbForm({
        botanical_name: "",
        local_name: "",
        plant_family: "",
        conservation_status: "",
        approved_regions: "",
        medicinal_properties: "",
        harvest_season: ""
      });
      setShowHerbForm(false);
      fetchData();
    } catch (error) {
      console.error('Error creating herb:', error);
      toast({
        title: "Error",
        description: "Failed to create herb",
        variant: "destructive"
      });
    }
  };

  const createComplianceRule = async () => {
    try {
      const { error } = await supabase
        .from('compliance_rules')
        .insert([{
          herb_id: ruleForm.herb_id,
          rule_type: ruleForm.rule_type,
          rule_parameters: JSON.parse(ruleForm.rule_parameters)
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Compliance rule created successfully"
      });

      setRuleForm({
        herb_id: "",
        rule_type: "",
        rule_parameters: ""
      });
      setShowRuleForm(false);
      fetchData();
    } catch (error) {
      console.error('Error creating compliance rule:', error);
      toast({
        title: "Error",
        description: "Failed to create compliance rule",
        variant: "destructive"
      });
    }
  };

  const getOverviewStats = () => {
    const roleStats = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalUsers: users.length,
      totalHerbs: herbs.length,
      totalRules: complianceRules.length,
      roleStats
    };
  };

  const stats = getOverviewStats();

  if (loading) {
    return (
      <DashboardLayout title="Admin Portal">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Admin Portal">
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Admin Portal</h1>
            <p className="text-muted-foreground">System administration and compliance management</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-4 border-b">
          {[
            { id: 'overview', label: 'Overview', icon: Database },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'herbs', label: 'Herbs', icon: Leaf },
            { id: 'compliance', label: 'Compliance', icon: Shield }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>System Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Total Users:</span>
                  <Badge variant="secondary">{stats.totalUsers}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Total Herbs:</span>
                  <Badge variant="secondary">{stats.totalHerbs}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Compliance Rules:</span>
                  <Badge variant="secondary">{stats.totalRules}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Roles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(stats.roleStats).map(([role, count]) => (
                  <div key={role} className="flex justify-between">
                    <span className="capitalize">{role}:</span>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button onClick={() => setShowHerbForm(true)} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Herb
                </Button>
                <Button onClick={() => setShowRuleForm(true)} variant="outline" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Compliance Rule
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Registered users in the system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{user.full_name}</span>
                        <Badge variant="outline">{user.role}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      {user.organization && (
                        <p className="text-sm text-muted-foreground">
                          {user.organization} • {user.location}
                        </p>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Joined: {new Date(user.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Herbs Tab */}
        {activeTab === 'herbs' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Herb Database</h2>
              <Button onClick={() => setShowHerbForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Herb
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {herbs.map((herb) => (
                <Card key={herb.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{herb.botanical_name}</CardTitle>
                        <CardDescription>{herb.local_name}</CardDescription>
                      </div>
                      {herb.conservation_status && (
                        <Badge variant={herb.conservation_status === 'endangered' ? 'destructive' : 'secondary'}>
                          {herb.conservation_status}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {herb.plant_family && (
                      <p className="text-sm"><strong>Family:</strong> {herb.plant_family}</p>
                    )}
                    {herb.approved_regions && (
                      <p className="text-sm"><strong>Regions:</strong> {herb.approved_regions.join(', ')}</p>
                    )}
                    {herb.harvest_season && (
                      <p className="text-sm"><strong>Season:</strong> {herb.harvest_season.join(', ')}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Compliance Tab */}
        {activeTab === 'compliance' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Compliance Rules</h2>
              <Button onClick={() => setShowRuleForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Rule
              </Button>
            </div>

            <div className="space-y-4">
              {complianceRules.map((rule) => (
                <Card key={rule.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{rule.rule_type}</CardTitle>
                        <CardDescription>
                          {rule.herbs?.botanical_name} ({rule.herbs?.local_name})
                        </CardDescription>
                      </div>
                      <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                        {rule.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-sm bg-muted p-2 rounded">
                      {JSON.stringify(rule.rule_parameters, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Add Herb Form Modal */}
        {showHerbForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>Add New Herb</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="botanical_name">Botanical Name *</Label>
                  <Input
                    id="botanical_name"
                    value={herbForm.botanical_name}
                    onChange={(e) => setHerbForm({...herbForm, botanical_name: e.target.value})}
                    placeholder="Withania somnifera"
                  />
                </div>
                <div>
                  <Label htmlFor="local_name">Local Name *</Label>
                  <Input
                    id="local_name"
                    value={herbForm.local_name}
                    onChange={(e) => setHerbForm({...herbForm, local_name: e.target.value})}
                    placeholder="Ashwagandha"
                  />
                </div>
                <div>
                  <Label htmlFor="plant_family">Plant Family</Label>
                  <Input
                    id="plant_family"
                    value={herbForm.plant_family}
                    onChange={(e) => setHerbForm({...herbForm, plant_family: e.target.value})}
                    placeholder="Solanaceae"
                  />
                </div>
                <div>
                  <Label htmlFor="conservation_status">Conservation Status</Label>
                  <Select value={herbForm.conservation_status} onValueChange={(value) => setHerbForm({...herbForm, conservation_status: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="common">Common</SelectItem>
                      <SelectItem value="vulnerable">Vulnerable</SelectItem>
                      <SelectItem value="endangered">Endangered</SelectItem>
                      <SelectItem value="critically_endangered">Critically Endangered</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="approved_regions">Approved Regions (comma-separated)</Label>
                  <Input
                    id="approved_regions"
                    value={herbForm.approved_regions}
                    onChange={(e) => setHerbForm({...herbForm, approved_regions: e.target.value})}
                    placeholder="Rajasthan, Gujarat, Madhya Pradesh"
                  />
                </div>
                <div>
                  <Label htmlFor="medicinal_properties">Medicinal Properties (comma-separated)</Label>
                  <Input
                    id="medicinal_properties"
                    value={herbForm.medicinal_properties}
                    onChange={(e) => setHerbForm({...herbForm, medicinal_properties: e.target.value})}
                    placeholder="Adaptogen, Anti-inflammatory, Immunomodulator"
                  />
                </div>
                <div>
                  <Label htmlFor="harvest_season">Harvest Season (comma-separated)</Label>
                  <Input
                    id="harvest_season"
                    value={herbForm.harvest_season}
                    onChange={(e) => setHerbForm({...herbForm, harvest_season: e.target.value})}
                    placeholder="Winter, Spring"
                  />
                </div>
                <div className="flex space-x-2">
                  <Button onClick={createHerb} className="flex-1">Create Herb</Button>
                  <Button variant="outline" onClick={() => setShowHerbForm(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Add Compliance Rule Form Modal */}
        {showRuleForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Add Compliance Rule</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="rule_herb">Herb</Label>
                  <Select value={ruleForm.herb_id} onValueChange={(value) => setRuleForm({...ruleForm, herb_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select herb" />
                    </SelectTrigger>
                    <SelectContent>
                      {herbs.map((herb) => (
                        <SelectItem key={herb.id} value={herb.id}>
                          {herb.botanical_name} ({herb.local_name})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="rule_type">Rule Type</Label>
                  <Select value={ruleForm.rule_type} onValueChange={(value) => setRuleForm({...ruleForm, rule_type: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select rule type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="seasonal_restriction">Seasonal Restriction</SelectItem>
                      <SelectItem value="geo_fencing">Geo-fencing</SelectItem>
                      <SelectItem value="quantity_limit">Quantity Limit</SelectItem>
                      <SelectItem value="quality_threshold">Quality Threshold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="rule_parameters">Rule Parameters (JSON)</Label>
                  <Textarea
                    id="rule_parameters"
                    value={ruleForm.rule_parameters}
                    onChange={(e) => setRuleForm({...ruleForm, rule_parameters: e.target.value})}
                    placeholder='{"allowed_months": [10, 11, 12, 1, 2], "max_quantity_per_day": 50}'
                  />
                </div>
                <div className="flex space-x-2">
                  <Button onClick={createComplianceRule} className="flex-1">Create Rule</Button>
                  <Button variant="outline" onClick={() => setShowRuleForm(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminPortal;