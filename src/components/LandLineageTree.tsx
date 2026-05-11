"use client"

import { useEffect, useState, memo, useCallback } from "react"
import {
    ReactFlow,
    Background,
    Controls,
    MarkerType,
    type Node,
    type Edge,
    BackgroundVariant,
    useNodesState,
    useEdgesState,
    Handle,
    Position,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import dagre from "dagre"
import { ExternalLink, AlertCircle, Info, History as HistoryIcon } from "lucide-react"

interface TreeRecord {
    record_id: string
    parent_land_id: string | null
    parent_record_id: string | null
    owner_name: string
    village_id: number
    survey_no: string
    khasra_no: string
    area: string
    doc_type: string
    status: string
    is_active: boolean
    sub_division_code: string | null
    hierarchy_path: string
    created_at: string
    tx_hash?: string
    khata_number?: string
}

// Custom Node Component to match the provided image exactly
const LandParcelNode = memo(({ data }: { data: any }) => {
    const rec = data.record as TreeRecord
    const isActive = rec.is_active
    const [isHovered, setIsHovered] = useState(false)

    // Precise colors from the design image
    const theme = isActive 
        ? {
            bg: "#f0fff4",
            border: "#c6f6d5",
            idText: "#22543d",
            ownerText: "#276749",
            areaBg: "#e6fffa",
            areaText: "#319795",
            iconColor: "#3182ce"
        }
        : {
            bg: "#fff5f5",
            border: "#fed7d7",
            idText: "#9b2c2c",
            ownerText: "#c53030",
            areaBg: "#edf2f7",
            areaText: "#4a5568",
            iconColor: "#3182ce"
        };

    return (
        <div 
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                position: 'relative',
                minWidth: 240,
                padding: '24px 32px',
                borderRadius: '2.5rem',
                border: `1.5px solid ${isHovered ? theme.idText : theme.border}`,
                background: theme.bg,
                boxShadow: isHovered ? '0 30px 60px -12px rgba(0, 0, 0, 0.25)' : '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                transform: isHovered ? 'translateY(-12px) scale(1.1)' : 'none',
                transition: 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                cursor: 'pointer',
                zIndex: isHovered ? 100 : 1
            }} 
            className="lineage-node-premium"
        >
            
            {/* External Link Icon - Positioned exactly as in the image */}
            {rec.tx_hash && (
                <div style={{ position: 'absolute', top: 18, right: 18 }}>
                    <a
                        href={`https://amoy.polygonscan.com/tx/${rec.tx_hash}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: theme.iconColor,
                            transition: 'transform 0.2s',
                        }}
                        onClick={(e) => e.stopPropagation()}
                        title="View on Ledger"
                    >
                        <ExternalLink size={18} strokeWidth={2.5} />
                    </a>
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                {/* Large Bold ID */}
                <h3 style={{ 
                    fontSize: '1.5rem', 
                    fontWeight: 900, 
                    letterSpacing: '-0.025em', 
                    color: theme.idText,
                    margin: 0
                }}>
                    {rec.survey_no || rec.khasra_no || "N/A"}
                </h3>
                
                {/* Owner Name - Slightly smaller and muted */}
                <p style={{ 
                    fontSize: '0.95rem', 
                    fontWeight: 600, 
                    color: theme.ownerText,
                    margin: 0,
                    opacity: 0.9
                }}>
                    {rec.owner_name}
                </p>

                {/* Area Badge - Pill style at bottom */}
                <div style={{ 
                    marginTop: 14, 
                    padding: '6px 16px', 
                    borderRadius: '9999px', 
                    fontSize: '11px', 
                    fontWeight: 800, 
                    letterSpacing: '0.05em', 
                    textTransform: 'uppercase', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 6, 
                    background: theme.areaBg, 
                    color: theme.areaText,
                    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)'
                }}>
                    <span>{rec.area || '0'}</span>
                    <span style={{ opacity: 0.6, fontWeight: 500 }}>Sq.m</span>
                </div>
            </div>

            {/* Hover Tooltip (Glassmorphism) - Enlarged */}
            {isHovered && (
                <div style={{
                    position: 'absolute',
                    top: '115%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'rgba(255, 255, 255, 0.98)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(226, 232, 240, 1)',
                    borderRadius: '2rem',
                    padding: '24px 32px',
                    width: 'max-content',
                    minWidth: '340px',
                    boxShadow: '0 40px 80px -12px rgba(0, 0, 0, 0.3)',
                    zIndex: 200,
                    textAlign: 'left',
                    pointerEvents: 'none',
                    opacity: 1,
                    transition: 'all 0.3s ease-out'
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: 12, marginBottom: 4 }}>
                            <span style={{ fontSize: '13px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Blockchain Record Details</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: 14, fontSize: '15px' }}>
                            <span style={{ color: '#64748b', fontWeight: 600 }}>Status:</span>
                            <span style={{ color: theme.idText, fontWeight: 800, fontSize: '16px' }}>{rec.status || 'Verified'}</span>
                            
                            <span style={{ color: '#64748b', fontWeight: 600 }}>Mutation:</span>
                            <span style={{ color: '#1e293b', fontWeight: 700 }}>{rec.doc_type || 'Direct Entry'}</span>
                            
                            <span style={{ color: '#64748b', fontWeight: 600 }}>Anchored:</span>
                            <span style={{ color: '#1e293b', fontWeight: 700 }}>{new Date(rec.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>

                            <span style={{ color: '#64748b', fontWeight: 600 }}>Village:</span>
                            <span style={{ color: '#1e293b', fontWeight: 700 }}>{rec.village_id || 'N/A'}</span>

                            <span style={{ color: '#64748b', fontWeight: 600 }}>Khasra:</span>
                            <span style={{ color: '#1e293b', fontWeight: 700, fontFamily: 'monospace' }}>{rec.khasra_no || 'N/A'}</span>

                            <span style={{ color: '#64748b', fontWeight: 600 }}>Record ID:</span>
                            <span style={{ color: '#94a3b8', fontSize: '12px', wordBreak: 'break-all' }}>{rec.record_id}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Connection Handles - Subtle styling */}
            <Handle 
                type="target" 
                position={Position.Top} 
                style={{ width: 6, height: 6, background: '#a0aec0', border: 'none', top: -3 }} 
            />
            <Handle 
                type="source" 
                position={Position.Bottom} 
                style={{ width: 6, height: 6, background: '#a0aec0', border: 'none', bottom: -3 }} 
            />
        </div>
    )
})

LandParcelNode.displayName = "LandParcelNode"

const nodeTypes = {
    parcel: LandParcelNode,
}

export function LandLineageTree({
    apiUrl,
    recordId,
    villageId,
    surveyKey,
}: {
    apiUrl: string
    recordId?: string
    villageId?: string
    surveyKey?: string
}) {
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const fetchTree = useCallback(async () => {
        if (!recordId && !(villageId && surveyKey)) return

        setLoading(true)
        setError("")
        try {
            const queryParams = new URLSearchParams()
            if (recordId) queryParams.append("record_id", recordId)
            if (villageId) queryParams.append("village_id", villageId)
            if (surveyKey) queryParams.append("survey", surveyKey)

            const res = await fetch(`${apiUrl}/api/records/tree?${queryParams.toString()}`)
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Failed to fetch tree")

            const rawRecords: TreeRecord[] = data.records || []

            // Use a unique key for each record state (ID + Owner) to prevent deduplication of history
            const uniqueRecords = rawRecords.map(r => ({
                ...r,
                // Generate a unique node ID that includes owner to distinguish history
                nodeId: `${r.record_id}-${r.owner_name}`.replace(/\s+/g, '_')
            }));

            const newNodes: Node[] = []
            const newEdges: Edge[] = []

            const g = new dagre.graphlib.Graph()
            g.setGraph({ rankdir: "TB", nodesep: 220, ranksep: 280 })
            g.setDefaultEdgeLabel(() => ({}))

            uniqueRecords.forEach((rec: any) => {
                newNodes.push({
                    id: rec.nodeId,
                    type: 'parcel',
                    data: { record: rec },
                    position: { x: 0, y: 0 },
                })

                g.setNode(rec.nodeId, { width: 260, height: 140 })

                // 1. Spatial Parent (Splits/Subdivisions)
                const possibleParentIds = [
                    rec.parent_record_id,
                    rec.parent_land_id,
                ].filter(Boolean) as string[]

                for (const pId of possibleParentIds) {
                    // Find the latest version of the parent record
                    const parent = uniqueRecords.filter(r => 
                        r.record_id === pId || 
                        r.record_id.replace(/^REC-/, '') === pId.replace(/^REC-/, '')
                    ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

                    if (parent && parent.nodeId !== rec.nodeId) {
                        newEdges.push({
                            id: `e-spatial-${parent.nodeId}-${rec.nodeId}`,
                            source: parent.nodeId,
                            target: rec.nodeId,
                            animated: false,
                            type: 'bezier',
                            style: { strokeWidth: 2, stroke: '#cbd5e1', strokeDasharray: '6,4' },
                            markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20, color: '#94a3b8' }
                        })
                        g.setEdge(parent.nodeId, rec.nodeId)
                        break
                    }
                }

                // 2. Temporal Parent (Ownership History for the SAME record ID)
                const sameIdRecords = uniqueRecords
                    .filter((r: any) => r.record_id === rec.record_id)
                    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
                
                const myIndex = sameIdRecords.findIndex((r: any) => r.nodeId === rec.nodeId);
                if (myIndex > 0) {
                    const prevVersion = sameIdRecords[myIndex - 1];
                    newEdges.push({
                        id: `e-temporal-${prevVersion.nodeId}-${rec.nodeId}`,
                        source: prevVersion.nodeId,
                        target: rec.nodeId,
                        animated: true, // Animated for history flow
                        type: 'smoothstep',
                        style: { strokeWidth: 3, stroke: '#3b82f6' },
                        markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16, color: '#3b82f6' }
                    })
                    g.setEdge(prevVersion.nodeId, rec.nodeId)
                }
            })

            // 1. Find all roots (nodes with no parents in the edges list)
            const nodeIdsWithParents = new Set(newEdges.map(e => e.target))
            const roots = newNodes.filter(n => !nodeIdsWithParents.has(n.id))
            
            // 2. If multiple roots exist, find the one most relevant to the user's request
            let targetRootId = roots[0]?.id
            if (roots.length > 1) {
                // Try to find root that matches recordId or surveyKey
                const matchingRoot = roots.find(r => 
                    r.id === recordId || 
                    (r.data.record as TreeRecord).survey_no === surveyKey
                )
                if (matchingRoot) targetRootId = matchingRoot.id
            }

            // 3. Keep only nodes/edges reachable from the target root (or all if we want to be safe)
            // For now, let's just pick the first root's entire connected component to satisfy "Give only 1 tree"
            const connectedNodeIds = new Set<string>()
            if (targetRootId) {
                const stack = [targetRootId]
                connectedNodeIds.add(targetRootId)
                while (stack.length > 0) {
                    const currentId = stack.pop()!
                    newEdges.forEach(edge => {
                        if (edge.source === currentId && !connectedNodeIds.has(edge.target)) {
                            connectedNodeIds.add(edge.target)
                            stack.push(edge.target)
                        }
                    })
                }
            }

            // Filter final set
            const filteredNodes = targetRootId ? newNodes.filter(n => connectedNodeIds.has(n.id)) : newNodes
            const filteredEdges = targetRootId ? newEdges.filter(e => connectedNodeIds.has(e.source) && connectedNodeIds.has(e.target)) : newEdges

            dagre.layout(g)

            const finalNodes = filteredNodes.map((n) => {
                const nodeWithPos = g.node(n.id)
                return {
                    ...n,
                    position: { x: nodeWithPos.x - nodeWithPos.width / 2, y: nodeWithPos.y - nodeWithPos.height / 2 },
                }
            }) as Node[]

            setNodes(finalNodes)
            setEdges(filteredEdges as Edge[])
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [apiUrl, recordId, villageId, surveyKey])

    useEffect(() => {
        fetchTree()
    }, [fetchTree])

    if (loading) {
        return (
            <div style={{
                height: 500,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                background: 'rgba(248, 250, 252, 0.3)',
                borderRadius: '2.5rem',
                border: '2px dashed #e2e8f0'
            }}>
                <div style={{ position: 'relative' }}>
                    <div style={{ 
                        height: 56, 
                        width: 56, 
                        borderRadius: '50%', 
                        border: '4px solid #dbeafe', 
                        borderTopColor: '#3b82f6'
                    }} className="animate-spin" />
                </div>
                <p style={{ 
                    marginTop: 24, 
                    fontSize: '0.875rem', 
                    fontWeight: 700, 
                    color: '#64748b', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.1em' 
                }}>Generating Hierarchy...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div style={{
                height: 500,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 16,
                width: '100%',
                background: 'rgba(254, 242, 242, 0.3)',
                borderRadius: '2.5rem',
                border: '2px dashed #fecaca'
            }}>
                <div style={{ padding: 16, background: '#fff', borderRadius: '1rem', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
                    <AlertCircle size={32} color="#f87171" />
                </div>
                <div style={{ textAlign: 'center' }}>
                    <p style={{ fontWeight: 700, color: '#334155' }}>Hierarchy Sync Failed</p>
                    <p style={{ fontSize: '0.75rem', color: '#ef4444', opacity: 0.8, marginTop: 4 }}>{error}</p>
                </div>
                <button 
                    onClick={() => fetchTree()}
                    style={{
                        marginTop: 8,
                        padding: '8px 24px',
                        background: '#fff',
                        border: '1px solid #e2e8f0',
                        color: '#475569',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                        transition: 'all 0.2s'
                    }}
                >
                    Retry
                </button>
            </div>
        )
    }

    if (!nodes.length) {
        return (
            <div style={{
                height: 500,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 16,
                width: '100%',
                background: 'rgba(248, 250, 252, 0.3)',
                borderRadius: '2.5rem',
                border: '2px dashed #e2e8f0'
            }}>
                <HistoryIcon size={40} color="#cbd5e1" style={{ opacity: 0.2 }} />
                <div style={{ textAlign: 'center' }}>
                    <p style={{ fontWeight: 700, color: '#64748b' }}>No Lineage History</p>
                    <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 4 }}>This record appears to be a primary parent record</p>
                </div>
            </div>
        )
    }

    return (
        <div style={{ position: 'relative' }}>
            {/* Visual Legend */}
            <div style={{ 
                position: 'absolute', 
                top: 32, 
                left: 32, 
                zIndex: 10,
                display: 'block'
            }}>
                <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: 12, 
                    padding: 20, 
                    background: 'rgba(255, 255, 255, 0.8)', 
                    backdropFilter: 'blur(8px)', 
                    borderRadius: '1.5rem', 
                    border: '1px solid rgba(226, 232, 240, 0.6)', 
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' 
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ 
                            width: 14, 
                            height: 14, 
                            borderRadius: '50%', 
                            background: '#48bb78', 
                            boxShadow: '0 0 10px rgba(72, 187, 120, 0.4)' 
                        }} />
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Parcel</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ 
                            width: 14, 
                            height: 14, 
                            borderRadius: '50%', 
                            background: '#feb2b2', 
                            boxShadow: '0 0 10px rgba(254, 178, 178, 0.4)' 
                        }} />
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Historical / Parent</span>
                    </div>
                </div>
            </div>

            <div style={{ 
                height: 750, 
                width: '100%', 
                background: '#fdfdfd', 
                borderRadius: '3rem', 
                overflow: 'hidden', 
                border: '1px solid #f1f5f9', 
                boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.02)' 
            }}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    nodeTypes={nodeTypes}
                    fitView
                    fitViewOptions={{ padding: 0.4 }}
                    proOptions={{ hideAttribution: true }}
                    minZoom={0.1}
                    maxZoom={1.5}
                    nodesDraggable={true}
                    zoomOnScroll={true}
                    panOnDrag={true}
                >
                    <Background 
                        variant={BackgroundVariant.Dots} 
                        gap={24} 
                        size={1.5} 
                        color="#e2e8f0" 
                    />
                    <Controls 
                        style={{ 
                            background: 'rgba(255, 255, 255, 0.8)', 
                            backdropFilter: 'blur(8px)', 
                            border: '1px solid #e2e8f0', 
                            borderRadius: '1rem', 
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                            margin: 32 
                        }} 
                        showInteractive={false} 
                    />
                </ReactFlow>
            </div>
        </div>
    )
}

