import { useState, useEffect, useCallback } from 'react';
import { GripVertical, Eye, EyeOff, RotateCcw, Save, X, LayoutGrid } from 'lucide-react';
import { toast } from 'sonner';

const DEFAULT_WIDGETS = [
  { id: 'kpi', label: 'KPI Metrics', visible: true, order: 0 },
  { id: 'timeline', label: 'Attack Timeline', visible: true, order: 1 },
  { id: 'distribution', label: 'Risk Distribution', visible: true, order: 2 },
  { id: 'targets', label: 'Investigative Targets', visible: true, order: 4 },
  { id: 'stream', label: 'Live Vector Stream', visible: true, order: 5 },
];

const STORAGE_KEY = 'cybershield_dashboard_layout';

function loadLayout() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Merge with defaults in case new widgets were added
      return DEFAULT_WIDGETS.map(dw => {
        const found = parsed.find(p => p.id === dw.id);
        return found ? { ...dw, ...found } : dw;
      }).sort((a, b) => a.order - b.order);
    }
  } catch { /* ignore */ }
  return [...DEFAULT_WIDGETS];
}

function saveLayout(widgets) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets));
}

export function useDashboardLayout() {
  const [widgets, setWidgets] = useState(loadLayout);
  const [isCustomizing, setIsCustomizing] = useState(false);

  const toggleWidget = useCallback((id) => {
    setWidgets(prev => {
      const updated = prev.map(w => w.id === id ? { ...w, visible: !w.visible } : w);
      saveLayout(updated);
      return updated;
    });
  }, []);

  const reorderWidgets = useCallback((fromIndex, toIndex) => {
    setWidgets(prev => {
      const items = [...prev];
      const [moved] = items.splice(fromIndex, 1);
      items.splice(toIndex, 0, moved);
      const reordered = items.map((w, i) => ({ ...w, order: i }));
      saveLayout(reordered);
      return reordered;
    });
  }, []);

  const resetLayout = useCallback(() => {
    const defaults = [...DEFAULT_WIDGETS];
    setWidgets(defaults);
    saveLayout(defaults);
    toast.success('Dashboard layout reset to default');
  }, []);

  const isVisible = useCallback((id) => {
    return widgets.find(w => w.id === id)?.visible !== false;
  }, [widgets]);

  const getOrderedWidgetIds = useCallback(() => {
    return widgets.filter(w => w.visible).map(w => w.id);
  }, [widgets]);

  return {
    widgets,
    isCustomizing,
    setIsCustomizing,
    toggleWidget,
    reorderWidgets,
    resetLayout,
    isVisible,
    getOrderedWidgetIds,
  };
}

/** Customization panel UI */
export const DashboardCustomizer = ({ widgets, toggleWidget, reorderWidgets, resetLayout, onClose }) => {
  const [dragIndex, setDragIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const handleDragStart = (e, idx) => {
    setDragIndex(idx);
    e.dataTransfer.effectAllowed = 'move';
    // Ghost image
    e.dataTransfer.setDragImage(e.target, 20, 20);
  };

  const handleDragOver = (e, idx) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(idx);
  };

  const handleDrop = (e, idx) => {
    e.preventDefault();
    if (dragIndex !== null && dragIndex !== idx) {
      reorderWidgets(dragIndex, idx);
    }
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="card border-primary/30 bg-surface-container-low relative overflow-hidden animate-fade-in">
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-primary to-tertiary opacity-80" />
      
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <LayoutGrid size={14} className="text-primary" />
          <h3 className="text-xs font-bold text-on-surface uppercase tracking-widest">Customize Dashboard</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={resetLayout}
            className="flex items-center gap-1 text-[10px] text-on-surface-variant hover:text-primary transition-colors px-2 py-1 rounded border border-on-surface/10 hover:border-primary/30"
          >
            <RotateCcw size={10} /> Reset
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-on-surface/10 transition-all"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <p className="text-[10px] text-on-surface-variant mb-4 leading-relaxed">
        Drag to reorder widgets. Toggle visibility with the eye icon. Layout is saved automatically.
      </p>

      <div className="space-y-1.5">
        {widgets.map((widget, idx) => (
          <div
            key={widget.id}
            draggable
            onDragStart={(e) => handleDragStart(e, idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDrop={(e) => handleDrop(e, idx)}
            onDragEnd={handleDragEnd}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all cursor-grab active:cursor-grabbing select-none group
              ${dragOverIndex === idx ? 'border-primary bg-primary/10 scale-[1.02]' : 'border-on-surface/5 bg-on-surface/5 hover:bg-on-surface/8'}
              ${dragIndex === idx ? 'opacity-40 scale-95' : 'opacity-100'}
              ${!widget.visible ? 'opacity-50' : ''}
            `}
          >
            <GripVertical size={14} className="text-on-surface-variant/40 group-hover:text-on-surface-variant shrink-0" />
            
            <span className={`text-xs font-bold flex-1 ${widget.visible ? 'text-on-surface' : 'text-on-surface-variant line-through'}`}>
              {widget.label}
            </span>

            <button
              onClick={(e) => { e.stopPropagation(); toggleWidget(widget.id); }}
              className={`p-1.5 rounded transition-all ${widget.visible ? 'text-tertiary hover:bg-tertiary/10' : 'text-on-surface-variant/40 hover:bg-on-surface/10'}`}
            >
              {widget.visible ? <Eye size={14} /> : <EyeOff size={14} />}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
