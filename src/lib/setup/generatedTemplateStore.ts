import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GeneratedTemplate } from './templateGenerationService';
import { DiscoveryResults } from './entityDiscoveryService';

interface GeneratedTemplateState {
  templates: GeneratedTemplate[];
  lastDiscovery: DiscoveryResults | null;

  // Actions
  addTemplates: (templates: GeneratedTemplate[]) => void;
  removeTemplate: (templateId: string) => void;
  updateLastDiscovery: (discovery: DiscoveryResults) => void;
  clearAll: () => void;

  // Getters
  getTemplateById: (id: string) => GeneratedTemplate | undefined;
  getTemplatesByCategory: (category: string) => GeneratedTemplate[];
  getAllCategories: () => string[];
}

export const useGeneratedTemplateStore = create<GeneratedTemplateState>()(
  persist(
    (set, get) => ({
      templates: [],
      lastDiscovery: null,

      addTemplates: (newTemplates: GeneratedTemplate[]) => {
        set(state => {
          // Merge with existing templates, replacing duplicates
          const existingIds = new Set(state.templates.map(t => t.id));
          const filteredNew = newTemplates.filter(t => !existingIds.has(t.id));

          return {
            templates: [...state.templates, ...filteredNew]
          };
        });
      },

      removeTemplate: (templateId: string) => {
        set(state => ({
          templates: state.templates.filter(t => t.id !== templateId)
        }));
      },

      updateLastDiscovery: (discovery: DiscoveryResults) => {
        set({ lastDiscovery: discovery });
      },

      clearAll: () => {
        set({ templates: [], lastDiscovery: null });
      },

      // Getters
      getTemplateById: (id: string) => {
        return get().templates.find(t => t.id === id);
      },

      getTemplatesByCategory: (category: string) => {
        return get().templates.filter(t => t.category === category);
      },

      getAllCategories: () => {
        const templates = get().templates;
        const categories = new Set(templates.map(t => t.category));
        return Array.from(categories).sort();
      },
    }),
    {
      name: 'generated-templates-storage',
      partialize: (state) => ({
        templates: state.templates,
        lastDiscovery: state.lastDiscovery,
      }),
    }
  )
);