import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Lightbulb, Zap, Activity, Thermometer, Tv, Fan, Speaker, Shield, Lock, Sparkles } from "lucide-react";
import * as LucideIcons from "lucide-react";

import { DeviceTemplate, DeviceType } from "../rooms/types";
import { deviceTemplates, getTemplatesByCategory, getAllCategories } from "../devices/templates";
import { useGeneratedTemplateStore } from "../setup/generatedTemplateStore";

interface DeviceLibraryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: (template: DeviceTemplate) => void;
}

export function DeviceLibraryDialog({ open, onOpenChange, onSelectTemplate }: DeviceLibraryDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const { templates: generatedTemplates, getAllCategories: getGeneratedCategories } = useGeneratedTemplateStore();

  // Combine manual and generated templates
  const allTemplates = [...deviceTemplates, ...generatedTemplates];
  const manualCategories = getAllCategories();
  const generatedCategories = getGeneratedCategories();
  const categories = Array.from(new Set([...manualCategories, ...generatedCategories])).sort();

  // Filter templates based on search and category
  const filteredTemplates = allTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'lighting': return <Lightbulb className="h-4 w-4 text-muted-foreground" />;
      case 'switches': return <Zap className="h-4 w-4 text-muted-foreground" />;
      case 'sensors': return <Activity className="h-4 w-4 text-muted-foreground" />;
      case 'climate': return <Thermometer className="h-4 w-4 text-muted-foreground" />;
      case 'scenes': return <Sparkles className="h-4 w-4 text-muted-foreground" />;
      case 'entertainment': return <Tv className="h-4 w-4 text-muted-foreground" />;
      default: return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTemplateIcon = (iconName: string) => {
    const IconComponent = (LucideIcons as any)[iconName];
    if (IconComponent) {
      return <IconComponent className="h-5 w-5 text-muted-foreground" />;
    }
    return <Activity className="h-5 w-5 text-muted-foreground" />;
  };

  const handleTemplateSelect = (template: DeviceTemplate) => {
    onSelectTemplate(template);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Add Device - Choose Template</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search and Filter */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search device types..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(category)}
                      <span className="capitalize">{category}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Template Categories */}
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
            <div className="overflow-x-auto scrollbar-hide">
              <TabsList className="inline-flex w-auto min-w-full">
                <TabsTrigger value="all">All</TabsTrigger>
                {categories.map(category => (
                  <TabsTrigger key={category} value={category} className="flex items-center gap-1">
                    {getCategoryIcon(category)}
                    <span className="hidden sm:inline capitalize">{category}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <TabsContent value={selectedCategory} className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                {filteredTemplates.map((template) => (
                  <button
                    key={template.type}
                    onClick={() => handleTemplateSelect(template)}
                    className="text-left p-4 border rounded-lg hover:bg-muted/50 transition-colors group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-muted">
                        {getTemplateIcon(template.defaultIcon)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm group-hover:text-accent transition-colors">
                            {template.name}
                          </h3>
                          {'generatedAt' in template && (
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                              Auto-generated
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {template.description}
                        </p>
                        <div className="flex gap-1 mt-2 flex-wrap">
                          <Badge variant="secondary" className="text-xs">
                            {template.entityDomain}
                          </Badge>
                          {template.supportedControls.slice(0, 2).map(control => (
                            <Badge key={control} variant="outline" className="text-xs">
                              {control}
                            </Badge>
                          ))}
                          {template.supportedControls.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{template.supportedControls.length - 2}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {filteredTemplates.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No device templates found</p>
                  <p className="text-sm">Try adjusting your search or category filter</p>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Footer */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {filteredTemplates.length} of {allTemplates.length} templates
              {generatedTemplates.length > 0 && (
                <span className="ml-2 text-green-600">({generatedTemplates.length} auto-generated)</span>
              )}
            </div>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}