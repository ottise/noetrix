import React, { useRef, useState } from 'react';
import { createId } from '../../db/database';
import { triggerHaptic } from '../../lib/haptics';
import type { DiagramEdge, DiagramNode, LessonDiagram } from './programmingData';

const NODE_COLORS = ['#EDEAE2', '#B99B79', '#A7B6D2', '#9BAA98', '#C27B76'];

const DIAGRAM_KINDS: LessonDiagram['kind'][] = [
  'Flowchart',
  'Architecture',
  'Sequence',
  'Memory',
  'Data Structure',
  'State',
];

export function LessonVisualizeCanvas({
  diagram,
  onChange,
}: {
  diagram: LessonDiagram;
  onChange: (next: LessonDiagram) => void;
}) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [connectFromId, setConnectFromId] = useState<string | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<{
    nodeId: string;
    startX: number;
    startY: number;
    initX: number;
    initY: number;
  } | null>(null);

  const selectedNode = diagram.nodes.find((n) => n.id === selectedNodeId) || null;
  const editingNode = diagram.nodes.find((n) => n.id === editingNodeId) || null;

  const getLocalCoords = (clientX: number, clientY: number) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return { x: clientX, y: clientY };
    return {
      x: Math.round(clientX - rect.left),
      y: Math.round(clientY - rect.top),
    };
  };

  const addNode = (type: DiagramNode['type'], label: string) => {
    triggerHaptic('light');
    const id = createId('dn');
    const offset = (diagram.nodes.length % 5) * 28;
    const node: DiagramNode = {
      id,
      type,
      x: 70 + offset,
      y: 70 + offset,
      w: type === 'note' ? 200 : 165,
      h: type === 'diamond' ? 78 : 64,
      label,
      color: type === 'diamond' ? '#B99B79' : type === 'note' ? '#9BAA98' : '#EDEAE2',
    };
    onChange({ ...diagram, nodes: [...diagram.nodes, node] });
    setSelectedNodeId(id);
  };

  const handleNodePointerDown = (e: React.PointerEvent, node: DiagramNode) => {
    e.stopPropagation();
    if (connectFromId && connectFromId !== node.id) {
      const from = diagram.nodes.find((n) => n.id === connectFromId);
      if (from) {
        const edge: DiagramEdge = {
          id: createId('de'),
          fromX: Math.round(from.x + from.w / 2),
          fromY: Math.round(from.y + from.h / 2),
          toX: Math.round(node.x + node.w / 2),
          toY: Math.round(node.y + node.h / 2),
          label: 'flow',
          color: '#B99B79',
        };
        onChange({ ...diagram, edges: [...diagram.edges, edge] });
      }
      setConnectFromId(null);
      return;
    }

    setSelectedNodeId(node.id);
    const pt = getLocalCoords(e.clientX, e.clientY);
    dragRef.current = {
      nodeId: node.id,
      startX: pt.x,
      startY: pt.y,
      initX: node.x,
      initY: node.y,
    };
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
  };

  const handleSvgPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!dragRef.current) return;
    const d = dragRef.current;
    const pt = getLocalCoords(e.clientX, e.clientY);
    const nx = Math.max(12, d.initX + (pt.x - d.startX));
    const ny = Math.max(12, d.initY + (pt.y - d.startY));
    onChange({
      ...diagram,
      nodes: diagram.nodes.map((n) => (n.id === d.nodeId ? { ...n, x: nx, y: ny } : n)),
    });
  };

  const handleSvgPointerUp = () => {
    dragRef.current = null;
  };

  const commitText = () => {
    if (!editingNodeId) return;
    onChange({
      ...diagram,
      nodes: diagram.nodes.map((n) =>
        n.id === editingNodeId ? { ...n, label: editingText } : n
      ),
    });
    setEditingNodeId(null);
  };

  const applyPreset = (preset: 'jvm' | 'hashmap') => {
    triggerHaptic('selection');
    if (preset === 'jvm') {
      onChange({
        title: 'JVM Memory Model · Runtime Data Areas',
        kind: 'Memory',
        nodes: [
          { id: 'p1', type: 'box', x: 45, y: 40, w: 225, h: 92, label: 'HEAP (Shared)\nObjects · Arrays', color: '#B99B79' },
          { id: 'p2', type: 'box', x: 45, y: 165, w: 225, h: 80, label: 'METHOD AREA\nClass Metadata · Bytecode', color: '#A7B6D2' },
          { id: 'p3', type: 'box', x: 345, y: 40, w: 235, h: 92, label: 'STACK (Per-Thread)\nFrames · Local Variables', color: '#9BAA98' },
          { id: 'p4', type: 'pill', x: 345, y: 165, w: 235, h: 72, label: 'PC REGISTER\nThread Execution Ptr', color: '#EDEAE2' },
        ],
        edges: [
          { id: 'pe1', fromX: 345, fromY: 86, toX: 270, toY: 86, label: 'ref', color: '#9BAA98' },
          { id: 'pe2', fromX: 158, fromY: 132, toX: 158, toY: 165, label: 'class', color: '#A7B6D2' },
        ],
      });
    } else {
      onChange({
        title: 'HashMap Collision & Treeify Architecture',
        kind: 'Data Structure',
        nodes: [
          { id: 'h1', type: 'box', x: 35, y: 45, w: 165, h: 66, label: 'key.hashCode()\n^(h >>> 16)', color: '#B99B79' },
          { id: 'h2', type: 'diamond', x: 245, y: 38, w: 160, h: 80, label: '(n - 1) & hash', color: '#A7B6D2' },
          { id: 'h3', type: 'box', x: 455, y: 44, w: 185, h: 68, label: 'Bucket[i]\nNode Linked List', color: '#EDEAE2' },
          { id: 'h4', type: 'box', x: 455, y: 168, w: 185, h: 70, label: 'Red-Black Tree\n(Bucket len >= 8)', color: '#9BAA98' },
        ],
        edges: [
          { id: 'he1', fromX: 200, fromY: 78, toX: 245, toY: 78, label: 'hash', color: '#B99B79' },
          { id: 'he2', fromX: 405, fromY: 78, toX: 455, toY: 78, label: 'index', color: '#A7B6D2' },
          { id: 'he3', fromX: 547, fromY: 112, toX: 547, toY: 168, label: 'treeify', color: '#9BAA98' },
        ],
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & Kind selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--os-border)]">
        <div className="flex items-center gap-2.5 flex-wrap">
          <input
            type="text"
            value={diagram.title}
            onChange={(e) => onChange({ ...diagram, title: e.target.value })}
            className="bg-transparent font-editorial text-[18px] w-72 sm:w-96 border-b border-transparent focus:border-[var(--os-brass)]"
            style={{ color: 'var(--os-ivory-bright)' }}
          />
          <select
            value={diagram.kind}
            onChange={(e) => onChange({ ...diagram, kind: e.target.value as LessonDiagram['kind'] })}
            className="px-2.5 py-1 rounded-[7px] metadata text-[10.5px] uppercase cursor-pointer"
            style={{
              backgroundColor: 'var(--os-graphite)',
              color: 'var(--os-brass)',
              border: '1px solid var(--os-border)',
            }}
          >
            {DIAGRAM_KINDS.map((k) => (
              <option key={k} value={k}>
                {k} Diagram
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => applyPreset('jvm')}
            className="metadata text-[10.5px] px-2.5 py-1 rounded-[7px] hover:bg-[var(--os-stone)] cursor-pointer"
            style={{ backgroundColor: 'var(--os-graphite)', color: 'var(--os-dusty-blue)', border: '1px solid var(--os-border)' }}
          >
            Mẫu JVM Memory
          </button>
          <button
            type="button"
            onClick={() => applyPreset('hashmap')}
            className="metadata text-[10.5px] px-2.5 py-1 rounded-[7px] hover:bg-[var(--os-stone)] cursor-pointer"
            style={{ backgroundColor: 'var(--os-graphite)', color: 'var(--os-sage)', border: '1px solid var(--os-border)' }}
          >
            Mẫu HashMap
          </button>
        </div>
      </div>

      {/* Interactive Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => addNode('box', 'Component / Block')}
            className="px-3 py-1.5 rounded-[8px] text-[12px] font-medium cursor-pointer"
            style={{ backgroundColor: 'var(--os-graphite)', color: 'var(--os-ivory)', border: '1px solid var(--os-border)' }}
          >
            + Khối chữ nhật
          </button>
          <button
            type="button"
            onClick={() => addNode('diamond', 'Điều kiện / Rẽ nhánh')}
            className="px-3 py-1.5 rounded-[8px] text-[12px] font-medium cursor-pointer"
            style={{ backgroundColor: 'var(--os-graphite)', color: 'var(--os-brass)', border: '1px solid var(--os-border)' }}
          >
            + Hình thoi
          </button>
          <button
            type="button"
            onClick={() => addNode('pill', 'Memory / State')}
            className="px-3 py-1.5 rounded-[8px] text-[12px] font-medium cursor-pointer"
            style={{ backgroundColor: 'var(--os-graphite)', color: 'var(--os-dusty-blue)', border: '1px solid var(--os-border)' }}
          >
            + Trạng thái
          </button>
          <button
            type="button"
            onClick={() => addNode('note', 'Ghi chú cơ chế...')}
            className="px-3 py-1.5 rounded-[8px] text-[12px] font-medium cursor-pointer"
            style={{ backgroundColor: 'var(--os-graphite)', color: 'var(--os-sage)', border: '1px solid var(--os-border)' }}
          >
            + Note
          </button>
          {selectedNode && (
            <button
              type="button"
              onClick={() =>
                setConnectFromId(connectFromId === selectedNode.id ? null : selectedNode.id)
              }
              className="px-3 py-1.5 rounded-[8px] text-[12px] font-medium cursor-pointer"
              style={{
                backgroundColor:
                  connectFromId === selectedNode.id ? 'var(--os-brass)' : 'var(--os-stone)',
                color: connectFromId === selectedNode.id ? '#101114' : 'var(--os-ivory)',
              }}
            >
              {connectFromId === selectedNode.id
                ? 'Chọn khối đích để nối mũi tên...'
                : '→ Nối mũi tên từ khối này'}
            </button>
          )}
        </div>

        {selectedNode && (
          <div className="flex items-center gap-2">
            {NODE_COLORS.map((col) => (
              <button
                key={col}
                type="button"
                onClick={() =>
                  onChange({
                    ...diagram,
                    nodes: diagram.nodes.map((n) =>
                      n.id === selectedNode.id ? { ...n, color: col } : n
                    ),
                  })
                }
                className="w-4 h-4 rounded-full cursor-pointer"
                style={{
                  backgroundColor: col,
                  boxShadow: selectedNode.color === col ? '0 0 0 2px #101114, 0 0 0 3px #B99B79' : 'none',
                }}
              />
            ))}
            <button
              type="button"
              onClick={() => {
                onChange({
                  ...diagram,
                  nodes: diagram.nodes.filter((n) => n.id !== selectedNode.id),
                });
                setSelectedNodeId(null);
              }}
              className="metadata text-[11px] ml-2 hover:underline cursor-pointer"
              style={{ color: 'var(--os-crimson)' }}
            >
              Xóa khối
            </button>
          </div>
        )}
      </div>

      {/* Vector Mechanism Canvas */}
      <div
        className="relative w-full h-[380px] rounded-[12px] overflow-hidden select-none"
        style={{
          backgroundColor: '#0D0E11',
          border: '1px solid var(--os-border)',
        }}
      >
        {editingNode && (
          <div
            className="absolute z-20"
            style={{
              left: editingNode.x,
              top: editingNode.y,
              width: editingNode.w,
              height: editingNode.h,
            }}
          >
            <textarea
              autoFocus
              value={editingText}
              onChange={(e) => setEditingText(e.target.value)}
              onBlur={commitText}
              onKeyDown={(e) => {
                if (e.key === 'Escape' || (e.key === 'Enter' && (e.ctrlKey || e.metaKey))) {
                  e.preventDefault();
                  commitText();
                }
              }}
              className="w-full h-full p-2 rounded-[8px] text-[12px] text-center resize-none"
              style={{
                backgroundColor: '#1B1D22',
                border: '2px solid #B99B79',
                color: '#EDEAE2',
              }}
            />
          </div>
        )}

        <svg
          ref={svgRef}
          onPointerMove={handleSvgPointerMove}
          onPointerUp={handleSvgPointerUp}
          onClick={() => {
            setSelectedNodeId(null);
            setConnectFromId(null);
          }}
          className="w-full h-full block touch-none"
        >
          <defs>
            <pattern id="lesson-dots" width="22" height="22" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="rgba(217,213,203,0.14)" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#lesson-dots)" />

          {/* Edges */}
          {diagram.edges.map((ed) => {
            const angle = Math.atan2(ed.toY - ed.fromY, ed.toX - ed.fromX);
            const hl = 9;
            const hx1 = ed.toX - hl * Math.cos(angle - Math.PI / 6);
            const hy1 = ed.toY - hl * Math.sin(angle - Math.PI / 6);
            const hx2 = ed.toX - hl * Math.cos(angle + Math.PI / 6);
            const hy2 = ed.toY - hl * Math.sin(angle + Math.PI / 6);
            return (
              <g
                key={ed.id}
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm('Xóa đường nối này?')) {
                    onChange({
                      ...diagram,
                      edges: diagram.edges.filter((x) => x.id !== ed.id),
                    });
                  }
                }}
                className="cursor-pointer"
              >
                <line
                  x1={ed.fromX}
                  y1={ed.fromY}
                  x2={ed.toX}
                  y2={ed.toY}
                  stroke={ed.color}
                  strokeWidth={2}
                />
                <polyline
                  points={`${hx1},${hy1} ${ed.toX},${ed.toY} ${hx2},${hy2}`}
                  fill="none"
                  stroke={ed.color}
                  strokeWidth={2}
                />
                {ed.label && (
                  <text
                    x={(ed.fromX + ed.toX) / 2}
                    y={(ed.fromY + ed.toY) / 2 - 7}
                    textAnchor="middle"
                    fill={ed.color}
                    fontSize={11}
                    fontFamily='"SF Mono", monospace'
                  >
                    {ed.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* Nodes */}
          {diagram.nodes.map((node) => {
            const isSel = node.id === selectedNodeId;
            const lines = node.label.split('\n');
            return (
              <g
                key={node.id}
                onPointerDown={(e) => handleNodePointerDown(e, node)}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setEditingNodeId(node.id);
                  setEditingText(node.label);
                }}
                className="cursor-grab active:cursor-grabbing"
              >
                {node.type === 'diamond' ? (
                  <polygon
                    points={`${node.x + node.w / 2},${node.y} ${node.x + node.w},${node.y + node.h / 2} ${node.x + node.w / 2},${node.y + node.h} ${node.x},${node.y + node.h / 2}`}
                    fill="rgba(27,29,34,0.92)"
                    stroke={isSel ? '#EDEAE2' : node.color}
                    strokeWidth={isSel ? 2.5 : 1.75}
                  />
                ) : (
                  <rect
                    x={node.x}
                    y={node.y}
                    width={node.w}
                    height={node.h}
                    rx={node.type === 'pill' ? 24 : node.type === 'note' ? 4 : 9}
                    fill={node.type === 'note' ? '#1E1C17' : 'rgba(27,29,34,0.92)'}
                    stroke={isSel ? '#EDEAE2' : node.color}
                    strokeWidth={isSel ? 2.5 : 1.75}
                    strokeDasharray={node.type === 'note' ? '4 3' : undefined}
                  />
                )}

                {editingNodeId !== node.id && (
                  <text
                    x={node.x + node.w / 2}
                    y={node.y + node.h / 2 - ((lines.length - 1) * 15) / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#EDEAE2"
                    fontSize={12.5}
                    fontWeight="500"
                    fontFamily='"SF Pro Text", sans-serif'
                  >
                    {lines.map((ln, idx) => (
                      <tspan key={idx} x={node.x + node.w / 2} dy={idx === 0 ? 0 : 16}>
                        {ln}
                      </tspan>
                    ))}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        <span
          className="absolute bottom-2.5 right-3 metadata text-[10px] pointer-events-none"
          style={{ color: 'rgba(217,213,203,0.4)' }}
        >
          Kéo thả tự do · Nhấp đúp vào khối để sửa chữ
        </span>
      </div>
    </div>
  );
}
