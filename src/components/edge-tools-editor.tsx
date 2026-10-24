"use client";

import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { Check, Copy, Eye, EyeOff, GripVertical, Heart, MessageCircle, PhoneCall, Share2, MessageSquareWarning } from "lucide-react";
import { getCategory, initialCategories, providerEdgeToolLabels, type ProviderEdgeToolId, type ServiceRecord } from "@/lib/catalog";
import ProviderCard from "@/components/provider-card";

type Props = {
  order: ProviderEdgeToolId[];
  visible: ProviderEdgeToolId[];
  onChange: (order: ProviderEdgeToolId[], visible: ProviderEdgeToolId[]) => void;
};

const toolIcons: Record<ProviderEdgeToolId, typeof PhoneCall> = { call: PhoneCall, whatsapp: MessageCircle, share: Share2, favorite: Heart, copy: Copy, suggest: MessageSquareWarning };

// Sample provider for the live preview — never saved anywhere.
const sampleService: ServiceRecord = {
  id: "preview-sample", name: "أسطى محمد — كهربائي منازل", category: "electricity", area: "جنزور", address: "شارع المحطة بجوار الصيدلية", phone: "01000000000", phoneSecondary: "",
  description: "معاينة حيّة لكارت مقدم الخدمة", status: "approved", verified: true, featured: false, demo: true, emergency: false, availableNow: true, availableUntil: null,
  workingHours: [], serviceItems: [], subSpecialties: [], neededRank: 0, hours: "", menuUrl: "", menuWhatsapp: "", rating: "4.8", reviews: 12, createdAt: "2024-01-01T00:00:00.000Z",
};

function reorder<T>(list: T[], from: number, to: number): T[] {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

// Drag-and-drop (pointer events → works with mouse and touch) + keyboard (↑/↓ on the grip)
// ordering of the provider-card edge tools, with a live ProviderCard preview underneath.
export default function EdgeToolsEditor({ order, visible, onChange }: Props) {
  const listRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<ProviderEdgeToolId | null>(null);
  const [previewFavorite, setPreviewFavorite] = useState(false);
  const [previewNote, setPreviewNote] = useState("");
  const [now] = useState(() => Date.now());

  function indexAt(clientY: number): number {
    const rows = Array.from(listRef.current?.querySelectorAll<HTMLElement>("[data-tool-row]") ?? []);
    for (let i = 0; i < rows.length; i += 1) {
      const rect = rows[i].getBoundingClientRect();
      if (clientY < rect.top + rect.height / 2) return i;
    }
    return Math.max(0, rows.length - 1);
  }

  function onGripPointerDown(event: PointerEvent<HTMLButtonElement>, tool: ProviderEdgeToolId) {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(tool);
  }
  function onGripPointerMove(event: PointerEvent<HTMLButtonElement>, tool: ProviderEdgeToolId) {
    if (dragging !== tool) return;
    const from = order.indexOf(tool);
    const to = indexAt(event.clientY);
    if (from !== -1 && to !== from) onChange(reorder(order, from, to), visible);
  }
  function onGripPointerUp(event: PointerEvent<HTMLButtonElement>) {
    try { event.currentTarget.releasePointerCapture(event.pointerId); } catch { /* already released */ }
    setDragging(null);
  }
  function onGripKeyDown(event: KeyboardEvent<HTMLButtonElement>, tool: ProviderEdgeToolId) {
    const from = order.indexOf(tool);
    if (event.key === "ArrowUp" && from > 0) { event.preventDefault(); onChange(reorder(order, from, from - 1), visible); }
    if (event.key === "ArrowDown" && from < order.length - 1) { event.preventDefault(); onChange(reorder(order, from, from + 1), visible); }
  }
  function toggle(tool: ProviderEdgeToolId) {
    onChange(order, visible.includes(tool) ? visible.filter((id) => id !== tool) : [...visible, tool]);
  }

  const activeTools = order.filter((tool) => visible.includes(tool));
  const category = getCategory(sampleService.category, initialCategories);

  return (
    <div className="edge-tools-studio">
      <div className="edge-tools-editor" ref={listRef} role="list" aria-label="ترتيب الأدوات الدائرية — اسحب من المقبض لإعادة الترتيب">
        {order.map((tool, index) => {
          const Icon = toolIcons[tool];
          const isVisible = visible.includes(tool);
          return (
            <div className={`edge-tool-row ${isVisible ? "" : "is-hidden"} ${dragging === tool ? "is-dragging" : ""}`} key={tool} data-tool-row role="listitem">
              <button
                type="button"
                className="edge-tool-grip"
                aria-label={`اسحب لتحريك ${providerEdgeToolLabels[tool]} (الموضع ${index + 1} من ${order.length}) — أو استخدم الأسهم`}
                onPointerDown={(event) => onGripPointerDown(event, tool)}
                onPointerMove={(event) => onGripPointerMove(event, tool)}
                onPointerUp={onGripPointerUp}
                onPointerCancel={onGripPointerUp}
                onKeyDown={(event) => onGripKeyDown(event, tool)}
                data-no-feedback
              >
                <GripVertical size={16}/>
              </button>
              <span className="edge-tool-row-index">{index + 1}</span>
              <span className={`edge-tool-row-icon is-${tool}`}><Icon size={15}/></span>
              <strong>{providerEdgeToolLabels[tool]}{(tool === "copy" || tool === "suggest") && <small> — اختيارية</small>}</strong>
              <span className="edge-tool-row-actions">
                <button type="button" className={`icon-button ${isVisible ? "" : "is-off"}`} onClick={() => toggle(tool)} aria-pressed={isVisible} aria-label={isVisible ? `إخفاء ${providerEdgeToolLabels[tool]}` : `إظهار ${providerEdgeToolLabels[tool]}`}>{isVisible ? <Eye size={14}/> : <EyeOff size={14}/>}</button>
              </span>
            </div>
          );
        })}
      </div>

      <div className="edge-tools-preview" aria-label="معاينة حية لكارت مقدم الخدمة">
        <div className="edge-tools-preview-head">
          <span><Check size={13}/> معاينة حية — الدوائر ظاهرة دائمًا هنا، وفي التطبيق تظهر عند المرور</span>
          {previewNote && <em>{previewNote}</em>}
        </div>
        <div className="provider-grid edge-tools-preview-grid">
          <ProviderCard
            service={sampleService}
            category={category}
            favorite={previewFavorite}
            now={now}
            edgeTools={activeTools}
            preview
            onOpen={() => setPreviewNote("في التطبيق: يفتح صفحة مقدم الخدمة")}
            onShare={() => setPreviewNote("في التطبيق: تفتح نافذة المشاركة")}
            onToggleFavorite={() => { setPreviewFavorite((value) => !value); setPreviewNote(""); }}
          />
        </div>
        {!activeTools.length && <p className="edge-tools-preview-empty">كل الدوائر مخفية حاليًا — فعّل واحدة على الأقل من قائمة العين أعلاه.</p>}
      </div>
    </div>
  );
}
