import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Palette, Upload, Save } from "lucide-react";

export default function BrandingSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [config, setConfig] = useState({
    app_name: "StaffTrak",
    primary_color: "#4A90E2",
    secondary_color: "#BB86FC",
    logo_url: "",
    favicon_url: "",
    custom_css: ""
  });

  const { data: brandingConfig, isLoading } = useQuery({
    queryKey: ["/api/branding/config"],
    queryFn: () => 
      fetch("/api/branding/config")
        .then(res => res.json())
  });

  const updateBrandingMutation = useMutation({
    mutationFn: (newConfig: any) => 
      fetch("/api/branding/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newConfig)
      }).then(res => res.json()),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Branding configuration updated successfully"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/branding/config"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update branding configuration",
        variant: "destructive"
      });
    }
  });

  useEffect(() => {
    if (brandingConfig) {
      setConfig(brandingConfig);
    }
  }, [brandingConfig]);

  const handleSave = () => {
    updateBrandingMutation.mutate(config);
  };

  const handleColorChange = (field: string, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
    
    // Apply color changes immediately for preview
    if (field === 'primary_color') {
      document.documentElement.style.setProperty('--brand-primary', value);
    } else if (field === 'secondary_color') {
      document.documentElement.style.setProperty('--brand-secondary', value);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Branding Settings</h1>
          <p className="text-gray-600 dark:text-gray-400">Customize your organization's appearance</p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={updateBrandingMutation.isPending}
          data-testid="button-save-branding"
        >
          <Save className="w-4 h-4 mr-2" />
          {updateBrandingMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Palette className="w-5 h-5 mr-2" />
              Basic Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="app_name">Application Name</Label>
              <Input
                id="app_name"
                value={config.app_name}
                onChange={(e) => setConfig(prev => ({ ...prev, app_name: e.target.value }))}
                placeholder="StaffTrak"
                data-testid="input-app-name"
              />
            </div>

            <div>
              <Label htmlFor="primary_color">Primary Color</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="primary_color"
                  type="color"
                  value={config.primary_color}
                  onChange={(e) => handleColorChange('primary_color', e.target.value)}
                  className="w-16 h-10 p-1"
                  data-testid="input-primary-color"
                />
                <Input
                  value={config.primary_color}
                  onChange={(e) => handleColorChange('primary_color', e.target.value)}
                  placeholder="#4A90E2"
                  className="flex-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="secondary_color">Secondary Color</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="secondary_color"
                  type="color"
                  value={config.secondary_color}
                  onChange={(e) => handleColorChange('secondary_color', e.target.value)}
                  className="w-16 h-10 p-1"
                  data-testid="input-secondary-color"
                />
                <Input
                  value={config.secondary_color}
                  onChange={(e) => handleColorChange('secondary_color', e.target.value)}
                  placeholder="#BB86FC"
                  className="flex-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logo and Assets */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="w-5 h-5 mr-2" />
              Logo & Assets
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="logo_url">Logo URL</Label>
              <Input
                id="logo_url"
                value={config.logo_url}
                onChange={(e) => setConfig(prev => ({ ...prev, logo_url: e.target.value }))}
                placeholder="https://example.com/logo.png"
                data-testid="input-logo-url"
              />
            </div>

            <div>
              <Label htmlFor="favicon_url">Favicon URL</Label>
              <Input
                id="favicon_url"
                value={config.favicon_url}
                onChange={(e) => setConfig(prev => ({ ...prev, favicon_url: e.target.value }))}
                placeholder="https://example.com/favicon.ico"
                data-testid="input-favicon-url"
              />
            </div>

            <Button variant="outline" className="w-full" data-testid="button-upload-logo">
              <Upload className="w-4 h-4 mr-2" />
              Upload Logo
              <span className="text-xs text-gray-500 ml-2">(Object storage integration required)</span>
            </Button>
          </CardContent>
        </Card>

        {/* Custom CSS */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Custom CSS</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="custom_css">Custom Styles</Label>
              <Textarea
                id="custom_css"
                value={config.custom_css}
                onChange={(e) => setConfig(prev => ({ ...prev, custom_css: e.target.value }))}
                placeholder="/* Add your custom CSS here */
.custom-button {
  background: var(--brand-primary);
  color: white;
}"
                rows={8}
                className="font-mono text-sm"
                data-testid="textarea-custom-css"
              />
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center space-x-4 mb-4">
                <div 
                  className="w-8 h-8 rounded"
                  style={{ backgroundColor: config.primary_color }}
                ></div>
                <h3 className="text-lg font-semibold" data-testid="text-preview-app-name">
                  {config.app_name}
                </h3>
              </div>
              <div className="flex space-x-2">
                <Button 
                  style={{ backgroundColor: config.primary_color }}
                  className="text-white"
                >
                  Primary Button
                </Button>
                <Button 
                  variant="outline"
                  style={{ 
                    borderColor: config.secondary_color,
                    color: config.secondary_color
                  }}
                >
                  Secondary Button
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}