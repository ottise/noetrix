import React, { useState } from 'react';
import { createId } from '../../db/database';
import { useToast } from '../../components/ui/Primitives';
import {
  NET_COMMAND_LIBRARY,
  NET_PACKET_SAMPLES,
  type NetDiagramArrow,
  type NetDiagramBox,
  type NetTopologyEdge,
  type NetTopologyNode,
} from './netKnowledgeData';

/**
 * Clean SVG diagram component for individual Networking Topic pages.
 */
export function NetTopicDiagramSvg({
  title,
  boxes,
  arrows,
}: {
  title: string;
  boxes: NetDiagramBox[];
  arrows: NetDiagramArrow[];
}) {
  return (
    <div
      className="rounded-[10px] p-4 space-y-2.5 overflow-x-auto"
      style={{
        backgroundColor: '#0E1014',
        border: '1px solid rgba(217, 213, 203, 0.08)',
      }}
    >
      <span className="metadata text-[10px] uppercase tracking-[0.12em] block" style={{ color: '#B99B79' }}>
        NETWORK DIAGRAM // {title}
      </span>
      <svg viewBox="0 0 710 175" className="w-full min-w-[540px] max-h-[190px]" role="img" aria-label={title}>
        <defs>
          <marker id="net-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M0,1 L7,4 L0,7 z" fill="#A7B6D2" />
          </marker>
        </defs>

        {arrows.map((arr, idx) => (
          <g key={idx}>
            <line
              x1={arr.fromX}
              y1={arr.fromY}
              x2={arr.toX}
              y2={arr.toY}
              stroke="#A7B6D2"
              strokeWidth="1.6"
              markerEnd="url(#net-arrow)"
            />
            {arr.label && (
              <text
                x={(arr.fromX + arr.toX) / 2}
                y={(arr.fromY + arr.toY) / 2 - 8}
                textAnchor="middle"
                fill="#B99B79"
                fontSize="10.5"
                fontFamily="ui-monospace, monospace"
              >
                {arr.label}
              </text>
            )}
          </g>
        ))}

        {boxes.map((box) => (
          <g key={box.id}>
            <rect
              x={box.x}
              y={box.y}
              width={box.w}
              height={box.h}
              rx="9"
              fill="#16181F"
              stroke={box.accent || '#A7B6D2'}
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
        ))}
      </svg>
    </div>
  );
}

/**
 * Packet Analyzer & Command Laboratory View
 */
export function PacketAndCommandLabView() {
  const { showToast } = useToast();
  const [sampleId, setSampleId] = useState(NET_PACKET_SAMPLES[0].id);
  const [selectedFrameNo, setSelectedFrameNo] = useState(1);
  const [cmdCatFilter, setCmdCatFilter] = useState<string>('All');
  const [cmdSearch, setCmdSearch] = useState('');

  const sample = NET_PACKET_SAMPLES.find((s) => s.id === sampleId) || NET_PACKET_SAMPLES[0];
  const selectedPacket =
    sample.packets.find((p) => p.no === selectedFrameNo) || sample.packets[0];

  const categories = ['All', ...Array.from(new Set(NET_COMMAND_LIBRARY.map((c) => c.category)))];
  const filteredCommands = NET_COMMAND_LIBRARY.filter(
    (c) =>
      (cmdCatFilter === 'All' || c.category === cmdCatFilter) &&
      (cmdSearch.trim() === '' ||
        c.command.toLowerCase().includes(cmdSearch.toLowerCase()) ||
        c.purpose.toLowerCase().includes(cmdSearch.toLowerCase()))
  );

  return (
    <div className="space-y-8">
      {/* PACKET ANALYZER STUDIO */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="metadata text-[10px] uppercase tracking-[0.14em]" style={{ color: '#B99B79' }}>
              PACKET ANALYZER (WIRESHARK-STYLE INSPECTOR)
            </p>
            <h2 className="font-editorial text-[24px] mt-0.5" style={{ color: '#EDEAE2' }}>
              Giải phẫu từng Frame theo tầng OSI
            </h2>
          </div>

          <div className="flex gap-1.5 flex-wrap">
            {NET_PACKET_SAMPLES.map((s) => {
              const active = s.id === sample.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setSampleId(s.id);
                    setSelectedFrameNo(1);
                  }}
                  className="px-3 py-1.5 rounded-[7px] text-[12px] font-medium cursor-pointer"
                  style={{
                    backgroundColor: active ? '#22252F' : '#14161C',
                    color: active ? '#B99B79' : 'var(--os-ivory-muted)',
                    border: active
                      ? '1px solid rgba(185, 155, 121, 0.45)'
                      : '1px solid rgba(217, 213, 203, 0.08)',
                  }}
                >
                  {s.title}
                </button>
              );
            })}
          </div>
        </div>

        <div
          className="rounded-[12px] overflow-hidden"
          style={{
            backgroundColor: '#13151B',
            border: '1px solid rgba(217, 213, 203, 0.09)',
          }}
        >
          <div className="px-4 py-2.5 border-b flex items-center justify-between" style={{ borderColor: 'rgba(217, 213, 203, 0.08)' }}>
            <span className="text-[12.5px]" style={{ color: 'var(--os-ivory-muted)' }}>
              {sample.description}
            </span>
            <span className="metadata text-[10px]" style={{ color: '#9BAA98' }}>
              {sample.protocol}
            </span>
          </div>

          {/* Frame List Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12px] font-mono border-collapse">
              <thead>
                <tr className="border-b" style={{ backgroundColor: '#101114', borderColor: 'rgba(217, 213, 203, 0.08)', color: 'var(--os-ivory-faint)' }}>
                  <th className="px-3 py-2">No.</th>
                  <th className="px-3 py-2">Time</th>
                  <th className="px-3 py-2">Source</th>
                  <th className="px-3 py-2">Destination</th>
                  <th className="px-3 py-2">Proto</th>
                  <th className="px-3 py-2">Len</th>
                  <th className="px-3 py-2">Info</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'rgba(217, 213, 203, 0.06)' }}>
                {sample.packets.map((pkt) => {
                  const selected = pkt.no === selectedPacket.no;
                  return (
                    <tr
                      key={pkt.no}
                      onClick={() => setSelectedFrameNo(pkt.no)}
                      className="cursor-pointer transition-colors hover:bg-white/5"
                      style={{
                        backgroundColor: selected ? 'rgba(185, 155, 121, 0.14)' : 'transparent',
                        color: selected ? '#EDEAE2' : 'var(--os-ivory-muted)',
                      }}
                    >
                      <td className="px-3 py-2">{pkt.no}</td>
                      <td className="px-3 py-2">{pkt.time}</td>
                      <td className="px-3 py-2">{pkt.src}</td>
                      <td className="px-3 py-2">{pkt.dst}</td>
                      <td className="px-3 py-2" style={{ color: '#A7B6D2' }}>{pkt.proto}</td>
                      <td className="px-3 py-2">{pkt.length}</td>
                      <td className="px-3 py-2">{pkt.info}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Decoded Packet Details Pane */}
          <div className="p-4 border-t space-y-2" style={{ backgroundColor: '#0E1014', borderColor: 'rgba(217, 213, 203, 0.08)' }}>
            <span className="metadata text-[10px] uppercase tracking-[0.12em]" style={{ color: '#B99B79' }}>
              FRAME #{selectedPacket.no} DECODED LAYERS
            </span>
            <div className="space-y-1.5 font-mono text-[12px]">
              {selectedPacket.decodedLayers.map((l, idx) => (
                <div
                  key={idx}
                  className="px-3 py-1.5 rounded-[6px]"
                  style={{ backgroundColor: '#151820', color: '#EDEAE2' }}
                >
                  ▸ {l}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* COMMAND LABORATORY */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="metadata text-[10px] uppercase tracking-[0.14em]" style={{ color: '#A7B6D2' }}>
              COMMAND LABORATORY
            </p>
            <h2 className="font-editorial text-[24px] mt-0.5" style={{ color: '#EDEAE2' }}>
              Thư viện CLI chẩn đoán & kiểm thử mạng
            </h2>
          </div>

          <input
            type="text"
            value={cmdSearch}
            onChange={(e) => setCmdSearch(e.target.value)}
            placeholder="Lọc lệnh (ping, ss, dig, tcpdump...)"
            className="px-3 py-1.5 rounded-[8px] text-[12.5px] w-full sm:w-64"
            style={{
              backgroundColor: '#14161C',
              color: '#EDEAE2',
              border: '1px solid rgba(217, 213, 203, 0.12)',
            }}
          />
        </div>

        <div className="flex gap-1.5 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCmdCatFilter(cat)}
              className="px-2.5 py-1 rounded-[6px] text-[11.5px] cursor-pointer"
              style={{
                backgroundColor: cmdCatFilter === cat ? '#22252F' : '#14161C',
                color: cmdCatFilter === cat ? '#A7B6D2' : 'var(--os-ivory-faint)',
                border:
                  cmdCatFilter === cat
                    ? '1px solid rgba(167, 182, 210, 0.4)'
                    : '1px solid rgba(217, 213, 203, 0.08)',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredCommands.map((cmd) => (
            <div
              key={cmd.id}
              className="p-4 rounded-[11px] space-y-2.5"
              style={{
                backgroundColor: '#14161C',
                border: '1px solid rgba(217, 213, 203, 0.08)',
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <code className="font-mono text-[15px] font-semibold" style={{ color: '#B99B79' }}>
                  $ {cmd.command}
                </code>
                <span className="metadata text-[9.5px] uppercase px-2 py-0.5 rounded-[4px]" style={{ backgroundColor: 'rgba(167, 182, 210, 0.12)', color: '#A7B6D2' }}>
                  {cmd.category}
                </span>
              </div>
              <p className="text-[12.5px]" style={{ color: 'var(--os-ivory-muted)' }}>
                {cmd.purpose}
              </p>
              <div className="space-y-1.5">
                {cmd.examples.map((ex, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-[6px] font-mono text-[11.5px]"
                    style={{ backgroundColor: '#0E1014', color: '#EDEAE2' }}
                  >
                    <span className="truncate">{ex}</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(ex.split('#')[0].trim());
                        showToast(`Đã copy: ${cmd.command}`);
                      }}
                      className="text-[10.5px] shrink-0 hover:underline cursor-pointer"
                      style={{ color: '#9BAA98' }}
                    >
                      Copy
                    </button>
                  </div>
                ))}
              </div>
              <p className="metadata text-[11px]" style={{ color: 'var(--os-ivory-faint)' }}>
                Flags: {cmd.keyFlags}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/**
 * Interactive Network Topology Designer & Packet Simulator
 */
export function TopologySimulatorView({
  nodes,
  edges,
  onAddNode,
  onAddEdge,
  onDeleteNode,
}: {
  nodes: NetTopologyNode[];
  edges: NetTopologyEdge[];
  onAddNode: (node: NetTopologyNode) => void;
  onAddEdge: (edge: NetTopologyEdge) => void;
  onDeleteNode: (nodeId: string) => void;
}) {
  const [selectedNodeId, setSelectedNodeId] = useState<string>(nodes[0]?.id || '');
  const [newKind, setNewKind] = useState<NetTopologyNode['kind']>('Server');
  const [newLabel, setNewLabel] = useState('');
  const [newIp, setNewIp] = useState('10.0.4.10/24');

  const [connectFrom, setConnectFrom] = useState(nodes[0]?.id || '');
  const [connectTo, setConnectTo] = useState(nodes[1]?.id || '');
  const [simResult, setSimResult] = useState<string | null>(null);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || nodes[0];

  const handleCreateNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;
    const x = 110 + ((nodes.length * 135) % 560);
    const y = 90 + (Math.floor((nodes.length * 135) / 560) * 110) % 210;
    const node: NetTopologyNode = {
      id: createId('tn'),
      kind: newKind,
      label: newLabel.trim(),
      ip: newIp.trim() || '10.0.0.x/24',
      x,
      y,
    };
    onAddNode(node);
    setNewLabel('');
    setSelectedNodeId(node.id);
  };

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!connectFrom || !connectTo || connectFrom === connectTo) return;
    onAddEdge({
      id: createId('te'),
      fromId: connectFrom,
      toId: connectTo,
      bandwidth: '10 Gbps',
      latencyMs: 2,
    });
  };

  const runPathSimulation = () => {
    if (nodes.length < 2) return;
    // BFS shortest hop path between first node and last selected node
    const startId = nodes[0].id;
    const targetId = selectedNode?.id && selectedNode.id !== startId ? selectedNode.id : nodes[nodes.length - 1].id;
    const queue: { id: string; path: string[]; rtt: number }[] = [{ id: startId, path: [startId], rtt: 0 }];
    const visited = new Set<string>([startId]);

    while (queue.length > 0) {
      const curr = queue.shift()!;
      if (curr.id === targetId) {
        const names = curr.path.map((id) => nodes.find((n) => n.id === id)?.label || id);
        setSimResult(
          `Trace thành công (${curr.path.length - 1} hops · One-way ${curr.rtt}ms / RTT ${curr.rtt * 2}ms): ${names.join(' → ')}`
        );
        return;
      }
      for (const ed of edges) {
        const nextId = ed.fromId === curr.id ? ed.toId : ed.toId === curr.id ? ed.fromId : null;
        if (nextId && !visited.has(nextId)) {
          visited.add(nextId);
          queue.push({ id: nextId, path: [...curr.path, nextId], rtt: curr.rtt + ed.latencyMs });
        }
      }
    }
    setSimResult(`Không tìm thấy đường đi giữa ${nodes[0].label} và ${selectedNode?.label}! Hãy kiểm tra kết nối link.`);
  };

  const kindColor = (kind: NetTopologyNode['kind']) => {
    if (kind === 'Client') return '#A7B6D2';
    if (kind === 'Firewall') return '#C98A82';
    if (kind === 'LoadBalancer' || kind === 'Router') return '#B99B79';
    return '#9BAA98';
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="metadata text-[10px] uppercase tracking-[0.14em]" style={{ color: '#B99B79' }}>
            NETWORK SIMULATOR & TOPOLOGY DESIGNER
          </p>
          <h2 className="font-editorial text-[24px] mt-0.5" style={{ color: '#EDEAE2' }}>
            Thiết kế sơ đồ kết nối và mô phỏng đường đi gói tin
          </h2>
        </div>

        <button
          type="button"
          onClick={runPathSimulation}
          className="px-4 py-2 rounded-[8px] text-[12.5px] font-semibold cursor-pointer"
          style={{ backgroundColor: '#9BAA98', color: '#101114' }}
        >
          ▶ Mô phỏng Packet Trace tới node đang chọn
        </button>
      </div>

      {simResult && (
        <div
          className="px-4 py-2.5 rounded-[8px] font-mono text-[12px]"
          style={{
            backgroundColor: 'rgba(155, 170, 152, 0.12)',
            border: '1px solid rgba(155, 170, 152, 0.35)',
            color: '#EDEAE2',
          }}
        >
          {simResult}
        </div>
      )}

      {/* Interactive Topology SVG */}
      <div
        className="rounded-[12px] p-4 overflow-x-auto"
        style={{ backgroundColor: '#111318', border: '1px solid rgba(217, 213, 203, 0.09)' }}
      >
        <svg viewBox="0 0 760 340" className="w-full min-w-[640px]">
          {edges.map((ed) => {
            const a = nodes.find((n) => n.id === ed.fromId);
            const b = nodes.find((n) => n.id === ed.toId);
            if (!a || !b) return null;
            return (
              <g key={ed.id}>
                <line
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke="rgba(167, 182, 210, 0.45)"
                  strokeWidth="2"
                />
                <text
                  x={(a.x + b.x) / 2}
                  y={(a.y + b.y) / 2 - 7}
                  textAnchor="middle"
                  fill="#B99B79"
                  fontSize="9.5"
                  fontFamily="ui-monospace, monospace"
                >
                  {ed.bandwidth} · {ed.latencyMs}ms
                </text>
              </g>
            );
          })}

          {nodes.map((node) => {
            const selected = node.id === selectedNode?.id;
            const accent = kindColor(node.kind);
            return (
              <g
                key={node.id}
                onClick={() => setSelectedNodeId(node.id)}
                style={{ cursor: 'pointer' }}
              >
                <rect
                  x={node.x - 68}
                  y={node.y - 30}
                  width={136}
                  height={60}
                  rx="9"
                  fill={selected ? '#232631' : '#171920'}
                  stroke={selected ? '#EDEAE2' : accent}
                  strokeWidth={selected ? 2 : 1.3}
                />
                <text
                  x={node.x}
                  y={node.y - 9}
                  textAnchor="middle"
                  fill={accent}
                  fontSize="9.5"
                  fontFamily="ui-monospace, monospace"
                >
                  {node.kind.toUpperCase()}
                </text>
                <text
                  x={node.x}
                  y={node.y + 8}
                  textAnchor="middle"
                  fill="#EDEAE2"
                  fontSize="11.5"
                  fontWeight="600"
                >
                  {node.label}
                </text>
                <text
                  x={node.x}
                  y={node.y + 22}
                  textAnchor="middle"
                  fill="rgba(217, 213, 203, 0.55)"
                  fontSize="9.5"
                  fontFamily="ui-monospace, monospace"
                >
                  {node.ip}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Add Device & Link Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <form
          onSubmit={handleCreateNode}
          className="p-4 rounded-[10px] space-y-2.5"
          style={{ backgroundColor: '#14161C', border: '1px solid rgba(217, 213, 203, 0.08)' }}
        >
          <span className="metadata text-[10px] uppercase tracking-[0.12em] block" style={{ color: '#B99B79' }}>
            + THÊM THIẾT BỊ VÀO TOPOLOGY
          </span>
          <div className="grid grid-cols-3 gap-2">
            <select
              value={newKind}
              onChange={(e) => setNewKind(e.target.value as NetTopologyNode['kind'])}
              className="px-2.5 py-1.5 rounded-[6px] text-[12px]"
              style={{ backgroundColor: '#101114', color: '#EDEAE2', border: '1px solid rgba(217, 213, 203, 0.1)' }}
            >
              <option value="Client">Client</option>
              <option value="Router">Router</option>
              <option value="Switch">Switch</option>
              <option value="Firewall">Firewall</option>
              <option value="LoadBalancer">Load Balancer</option>
              <option value="Server">Server / Pod</option>
            </select>
            <input
              type="text"
              required
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Tên nút (VD: Redis Cache)"
              className="col-span-2 px-2.5 py-1.5 rounded-[6px] text-[12.5px]"
              style={{ backgroundColor: '#101114', color: '#EDEAE2', border: '1px solid rgba(217, 213, 203, 0.1)' }}
            />
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newIp}
              onChange={(e) => setNewIp(e.target.value)}
              placeholder="IP / CIDR"
              className="flex-1 px-2.5 py-1.5 rounded-[6px] text-[12px]"
              style={{ backgroundColor: '#101114', color: '#EDEAE2', border: '1px solid rgba(217, 213, 203, 0.1)' }}
            />
            <button
              type="submit"
              className="px-3.5 py-1.5 rounded-[6px] text-[12px] font-semibold cursor-pointer"
              style={{ backgroundColor: '#B99B79', color: '#101114' }}
            >
              Thêm Node
            </button>
          </div>
        </form>

        <form
          onSubmit={handleConnect}
          className="p-4 rounded-[10px] space-y-2.5"
          style={{ backgroundColor: '#14161C', border: '1px solid rgba(217, 213, 203, 0.08)' }}
        >
          <span className="metadata text-[10px] uppercase tracking-[0.12em] block" style={{ color: '#A7B6D2' }}>
            + NỐI DÂY GIỮA HAI THIẾT BỊ
          </span>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={connectFrom}
              onChange={(e) => setConnectFrom(e.target.value)}
              className="px-2.5 py-1.5 rounded-[6px] text-[12px]"
              style={{ backgroundColor: '#101114', color: '#EDEAE2', border: '1px solid rgba(217, 213, 203, 0.1)' }}
            >
              {nodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.label}
                </option>
              ))}
            </select>
            <select
              value={connectTo}
              onChange={(e) => setConnectTo(e.target.value)}
              className="px-2.5 py-1.5 rounded-[6px] text-[12px]"
              style={{ backgroundColor: '#101114', color: '#EDEAE2', border: '1px solid rgba(217, 213, 203, 0.1)' }}
            >
              {nodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center justify-between gap-2">
            {selectedNode && nodes.length > 2 && (
              <button
                type="button"
                onClick={() => onDeleteNode(selectedNode.id)}
                className="text-[11.5px] hover:underline cursor-pointer"
                style={{ color: '#C98A82' }}
              >
                Xóa node đang chọn ({selectedNode.label})
              </button>
            )}
            <button
              type="submit"
              className="px-3.5 py-1.5 rounded-[6px] text-[12px] font-semibold cursor-pointer ml-auto"
              style={{ backgroundColor: '#A7B6D2', color: '#101114' }}
            >
              Nối Link
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
