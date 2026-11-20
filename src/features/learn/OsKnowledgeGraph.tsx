import React, { useMemo, useState } from 'react';
import {
  OS_MODULES,
  type OsTopic,
  type OsTopicDiagram,
} from './osKnowledgeData';

/**
 * Renders an interactive clean SVG Diagram inside a Topic's "Architecture & Diagrams" block.
 */
export function OsTopicDiagramSvg({ diagram }: { diagram: OsTopicDiagram }) {
  return (
    <div
      className="rounded-[10px] p-4 space-y-2.5 overflow-x-auto"
      style={{
        backgroundColor: '#0E1014',
        border: '1px solid rgba(217, 213, 203, 0.08)',
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="metadata text-[10px] uppercase tracking-[0.12em]" style={{ color: '#B99B79' }}>
          ARCHITECTURE DIAGRAM // {diagram.title}
        </span>
      </div>
      <svg
        viewBox="0 0 710 175"
        className="w-full min-w-[540px] max-h-[190px]"
        role="img"
        aria-label={diagram.title}
      >
        <defs>
          <marker id="os-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M0,1 L7,4 L0,7 z" fill="#B99B79" />
          </marker>
        </defs>

        {diagram.arrows.map((arr, idx) => {
          const midX = (arr.fromX + arr.toX) / 2;
          const midY = (arr.fromY + arr.toY) / 2 - 8;
          return (
            <g key={idx}>
              <line
                x1={arr.fromX}
                y1={arr.fromY}
                x2={arr.toX}
                y2={arr.toY}
                stroke="#B99B79"
                strokeWidth="1.6"
                markerEnd="url(#os-arrow)"
              />
              {arr.label && (
                <text
                  x={midX}
                  y={midY}
                  textAnchor="middle"
                  fill="#A7B6D2"
                  fontSize="10.5"
                  fontFamily="ui-monospace, monospace"
                >
                  {arr.label}
                </text>
              )}
            </g>
          );
        })}

        {diagram.boxes.map((box) => {
          const stroke = box.accent || '#EDEAE2';
          return (
            <g key={box.id}>
              <rect
                x={box.x}
                y={box.y}
                width={box.w}
                height={box.h}
                rx="9"
                fill="#16181F"
                stroke={stroke}
                strokeOpacity="0.55"
                strokeWidth="1.4"
              />
              <text
                x={box.x + box.w / 2}
                y={box.y + (box.sub ? 29 : 38)}
                textAnchor="middle"
                fill="#EDEAE2"
                fontSize="12.5"
                fontWeight="600"
              >
                {box.label}
              </text>
              {box.sub && (
                <text
                  x={box.x + box.w / 2}
                  y={box.y + 49}
                  textAnchor="middle"
                  fill="rgba(217, 213, 203, 0.62)"
                  fontSize="10"
                  fontFamily="ui-monospace, monospace"
                >
                  {box.sub}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/**
 * Interactive Cross-Module OS Knowledge Graph & Concept Map
 */
export function OsKnowledgeGraphView({
  topics,
  activeTopicId,
  onSelectTopic,
}: {
  topics: OsTopic[];
  activeTopicId: string;
  onSelectTopic: (topicId: string) => void;
}) {
  const [selectedModuleFilter, setSelectedModuleFilter] = useState<string>('all');
  const activeTopic = topics.find((t) => t.id === activeTopicId) || topics[0];

  // Radial/grid coordinates for 12 OS modules so cross-links stay super legible
  const modulePositions: Record<string, { x: number; y: number }> = {
    os_m01: { x: 110, y: 80 },
    os_m02: { x: 320, y: 70 },
    os_m03: { x: 540, y: 75 },
    os_m04: { x: 750, y: 90 },
    os_m05: { x: 760, y: 235 },
    os_m06: { x: 550, y: 235 },
    os_m07: { x: 320, y: 230 },
    os_m08: { x: 110, y: 235 },
    os_m09: { x: 135, y: 385 },
    os_m10: { x: 345, y: 390 },
    os_m11: { x: 555, y: 390 },
    os_m12: { x: 755, y: 385 },
  };

  // Aggregate unique module-to-module edges from topic `relatedTopicIds`
  const moduleEdges = useMemo(() => {
    const seen = new Set<string>();
    const edges: { from: string; to: string; count: number }[] = [];
    const counts = new Map<string, number>();

    topics.forEach((t) => {
      t.relatedTopicIds.forEach((relId) => {
        const target = topics.find((x) => x.id === relId);
        if (!target || target.moduleId === t.moduleId) return;
        const pair = [t.moduleId, target.moduleId].sort().join('__');
        counts.set(pair, (counts.get(pair) || 0) + 1);
      });
    });

    counts.forEach((count, pair) => {
      if (seen.has(pair)) return;
      seen.add(pair);
      const [from, to] = pair.split('__');
      edges.push({ from, to, count });
    });

    return edges;
  }, [topics]);

  const relatedTopics = useMemo(
    () =>
      activeTopic.relatedTopicIds
        .map((id) => topics.find((t) => t.id === id))
        .filter((t): t is OsTopic => Boolean(t)),
    [activeTopic, topics]
  );

  const incomingTopics = useMemo(
    () =>
      topics.filter(
        (t) =>
          t.id !== activeTopic.id &&
          t.relatedTopicIds.includes(activeTopic.id) &&
          !activeTopic.relatedTopicIds.includes(t.id)
      ),
    [activeTopic, topics]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="metadata text-[10px] uppercase tracking-[0.14em]" style={{ color: '#B99B79' }}>
            CONCEPT MAP & KNOWLEDGE GRAPH
          </p>
          <h2 className="font-editorial text-[24px] mt-0.5" style={{ color: 'var(--os-ivory-bright)' }}>
            Mạng lưới liên kết chéo giữa 12 chương Hệ Điều Hành
          </h2>
          <p className="text-[13px] mt-0.5" style={{ color: 'var(--os-ivory-muted)' }}>
            Bấm vào bất kỳ module nào trên đồ thị để xem các khái niệm liên thông với Backend, Database & Distributed Systems.
          </p>
        </div>

        <select
          value={selectedModuleFilter}
          onChange={(e) => setSelectedModuleFilter(e.target.value)}
          className="px-3 py-2 rounded-[8px] text-[12.5px]"
          style={{
            backgroundColor: '#16181E',
            color: 'var(--os-ivory-bright)',
            border: '1px solid rgba(217, 213, 203, 0.12)',
          }}
        >
          <option value="all">Hiển thị toàn bộ 12 Modules</option>
          {OS_MODULES.map((m) => (
            <option key={m.id} value={m.id}>
              Tập trung vào {m.code} · {m.title}
            </option>
          ))}
        </select>
      </div>

      {/* Interactive Module-Level Knowledge Graph */}
      <div
        className="rounded-[12px] p-4 overflow-x-auto"
        style={{
          backgroundColor: '#111318',
          border: '1px solid rgba(217, 213, 203, 0.09)',
        }}
      >
        <svg viewBox="0 0 880 465" className="w-full min-w-[680px]">
          {moduleEdges.map((edge, idx) => {
            const p1 = modulePositions[edge.from];
            const p2 = modulePositions[edge.to];
            if (!p1 || !p2) return null;
            const highlighted =
              selectedModuleFilter === 'all' ||
              edge.from === selectedModuleFilter ||
              edge.to === selectedModuleFilter;
            return (
              <line
                key={idx}
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke={
                  selectedModuleFilter !== 'all' && highlighted
                    ? '#B99B79'
                    : 'rgba(167, 182, 210, 0.24)'
                }
                strokeWidth={highlighted ? 1.8 : 0.8}
                strokeOpacity={highlighted ? 0.85 : 0.25}
                strokeDasharray={edge.count > 1 ? undefined : '4 3'}
              />
            );
          })}

          {OS_MODULES.map((mod) => {
            const pos = modulePositions[mod.id];
            const modTopics = topics.filter((t) => t.moduleId === mod.id);
            const completed = modTopics.filter((t) => t.status === 'completed').length;
            const isSelected = selectedModuleFilter === mod.id;
            const isActiveTopicMod = activeTopic.moduleId === mod.id;

            return (
              <g
                key={mod.id}
                onClick={() => setSelectedModuleFilter(isSelected ? 'all' : mod.id)}
                style={{ cursor: 'pointer' }}
              >
                <rect
                  x={pos.x - 86}
                  y={pos.y - 30}
                  width={172}
                  height={60}
                  rx={10}
                  fill={isSelected ? '#232631' : '#171920'}
                  stroke={isSelected || isActiveTopicMod ? '#B99B79' : mod.accent}
                  strokeWidth={isSelected ? 2 : 1.1}
                  strokeOpacity={isSelected || isActiveTopicMod ? 0.95 : 0.45}
                />
                <text
                  x={pos.x - 74}
                  y={pos.y - 9}
                  fill={mod.accent}
                  fontSize="10"
                  fontFamily="ui-monospace, monospace"
                >
                  {mod.code} · {completed}/{modTopics.length} DONE
                </text>
                <text
                  x={pos.x - 74}
                  y={pos.y + 12}
                  fill="#EDEAE2"
                  fontSize="11.5"
                  fontWeight="600"
                >
                  {mod.title.length > 22 ? `${mod.title.slice(0, 21)}…` : mod.title}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Topic-level Cross-Link Explorer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div
          className="lg:col-span-5 rounded-[12px] p-4 space-y-3"
          style={{
            backgroundColor: '#14161C',
            border: '1px solid rgba(217, 213, 203, 0.08)',
          }}
        >
          <p className="metadata text-[10px] uppercase tracking-[0.12em]" style={{ color: '#A7B6D2' }}>
            {selectedModuleFilter === 'all'
              ? `CHỦ ĐỀ TRUNG TÂM (${activeTopic.code})`
              : `TOPICS TRONG MODULE ${OS_MODULES.find((m) => m.id === selectedModuleFilter)?.code}`}
          </p>
          <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
            {(selectedModuleFilter === 'all'
              ? topics
              : topics.filter((t) => t.moduleId === selectedModuleFilter)
            ).map((t) => {
              const current = t.id === activeTopic.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onSelectTopic(t.id)}
                  className="w-full px-3 py-2 rounded-[8px] text-left flex items-center justify-between gap-2 cursor-pointer"
                  style={{
                    backgroundColor: current ? '#1E2129' : '#101114',
                    border: current
                      ? '1px solid rgba(185, 155, 121, 0.45)'
                      : '1px solid rgba(217, 213, 203, 0.06)',
                  }}
                >
                  <span className="text-[12.5px] truncate" style={{ color: 'var(--os-ivory-bright)' }}>
                    <span className="metadata text-[10.5px] mr-2" style={{ color: '#B99B79' }}>
                      {t.code}
                    </span>
                    {t.title}
                  </span>
                  <span className="metadata text-[10px]" style={{ color: 'var(--os-ivory-faint)' }}>
                    {t.relatedTopicIds.length} links
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div
          className="lg:col-span-7 rounded-[12px] p-5 space-y-4"
          style={{
            backgroundColor: '#14161C',
            border: '1px solid rgba(217, 213, 203, 0.08)',
          }}
        >
          <div>
            <span className="metadata text-[10px] uppercase tracking-[0.12em]" style={{ color: '#9BAA98' }}>
              ĐANG XEM MẠNG LIÊN KẾT CỦA {activeTopic.code}
            </span>
            <h3 className="font-editorial text-[22px] mt-1" style={{ color: 'var(--os-ivory-bright)' }}>
              {activeTopic.title}
            </h3>
            <p className="text-[12.5px] mt-1" style={{ color: 'var(--os-ivory-muted)' }}>
              {activeTopic.overview}
            </p>
          </div>

          <div className="space-y-2">
            <p className="metadata text-[10px] uppercase tracking-[0.1em]" style={{ color: '#B99B79' }}>
              LIÊN KẾT TRỰC TIẾP ({relatedTopics.length + incomingTopics.length})
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[...relatedTopics, ...incomingTopics].map((rel) => (
                <button
                  key={rel.id}
                  type="button"
                  onClick={() => onSelectTopic(rel.id)}
                  className="p-3 rounded-[9px] text-left cursor-pointer hover:bg-white/5 transition-colors"
                  style={{
                    backgroundColor: '#101114',
                    border: '1px solid rgba(185, 155, 121, 0.25)',
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="metadata text-[10px]" style={{ color: '#B99B79' }}>
                      {rel.code}
                    </span>
                    <span className="metadata text-[10px]" style={{ color: 'var(--os-ivory-faint)' }}>
                      Mở Topic →
                    </span>
                  </div>
                  <p className="text-[13px] font-medium mt-1" style={{ color: 'var(--os-ivory-bright)' }}>
                    {rel.title}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
