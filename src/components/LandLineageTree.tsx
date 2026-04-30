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
import { ExternalLink, AlertCircle, MapPin, User, Hash, Info, History as HistoryIcon, Layers } from "lucide-react"

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

// Custom Node Component for Premium Feel
const LandParcelNode = memo(({ data }: { data: any }) => {
    const rec = data.record as TreeRecord
    const isActive = rec.is_active

    return (
        <div className={`group relative min-w-[280px] p-0 rounded-2xl border transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
            isActive 
                ? "bg-white border-emerald-500 shadow-emerald-200/50" 
                : "bg-slate-50/80 border-slate-200 shadow-slate-100"
        } shadow-lg border-2 overflow-hidden`}>
            
            {/* Header / Status Bar */}
            <div className={`px-4 py-2 flex items-center justify-between ${
                isActive ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-600"
            }`}>
                <div className="flex items-center gap-2">
                    {isActive ? <MapPin size={14} className="animate-pulse" /> : <HistoryIcon size={14} />}
                    <span className="text-[10px] font-black uppercase tracking-widest">
                        {isActive ? "Active Parcel" : "Historical Record"}
                    </span>
                </div>
                {rec.tx_hash && (
                    <a
                        href={`https://amoy.polygonscan.com/tx/${rec.tx_hash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 rounded-md bg-white/20 hover:bg-white/40 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <ExternalLink size={12} />
                    </a>
                )}
            </div>

            <div className="p-4 space-y-3">
                {/* Survey / Khasra No */}
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <h4 className="font-bold text-slate-900 text-base leading-tight">
                            {rec.survey_no || rec.khasra_no || "N/A"}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{rec.record_id}</p>
                    </div>
                    <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Area</span>
                        <span className="text-xs font-black text-slate-700">{rec.area} <span className="text-[10px] font-medium opacity-60 uppercase">sq.m</span></span>
                    </div>
                </div>

                {/* Owner Info */}
                <div className="flex items-center gap-3 py-2 border-y border-slate-100/50">
                    <div className={`p-2 rounded-lg ${isActive ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>
                        <User size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Recorded Owner</span>
                        <p className="text-xs font-bold text-slate-700 truncate">{rec.owner_name}</p>
                    </div>
                </div>

                {/* Metadata Footer */}
                <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5">
                        <Layers size={12} className="text-slate-400" />
                        <span className="text-[10px] font-semibold text-slate-500">{rec.doc_type || 'Inheritance'}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400">
                        <Hash size={10} />
                        <span>{new Date(rec.created_at).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>

            {/* Connection Handles */}
            <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-slate-300 border-2 !border-white shadow-sm" />
            <Handle type="source" position={Position.Bottom} className="w-3 h-3 !bg-slate-300 border-2 !border-white shadow-sm" />
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

            const records: TreeRecord[] = data.records || []

            const newNodes: Node[] = []
            const newEdges: Edge[] = []

            const g = new dagre.graphlib.Graph()
            g.setGraph({ rankdir: "TB", nodesep: 150, ranksep: 200 }) // More space for premium feel
            g.setDefaultEdgeLabel(() => ({}))

            // Create nodes
            records.forEach((rec) => {
                newNodes.push({
                    id: rec.record_id,
                    type: 'parcel',
                    data: { record: rec },
                    position: { x: 0, y: 0 },
                })

                g.setNode(rec.record_id, { width: 300, height: 180 })

                if (rec.parent_record_id) {
                    const parentExists = records.some(r => r.record_id === rec.parent_record_id)
                    if (parentExists) {
                        newEdges.push({
                            id: `e-${rec.parent_record_id}-${rec.record_id}`,
                            source: rec.parent_record_id,
                            target: rec.record_id,
                            animated: true,
                            type: 'smoothstep',
                            markerEnd: { 
                                type: MarkerType.ArrowClosed, 
                                width: 20, 
                                height: 20,
                                color: '#94a3b8'
                            },
                            style: { strokeWidth: 2, stroke: '#cbd5e1' }
                        })
                        g.setEdge(rec.parent_record_id, rec.record_id)
                    }
                }
            })

            dagre.layout(g)

            const finalNodes = newNodes.map((n) => {
                const nodeWithPos = g.node(n.id)
                return {
                    ...n,
                    position: { x: nodeWithPos.x - nodeWithPos.width / 2, y: nodeWithPos.y - nodeWithPos.height / 2 },
                }
            }) as Node[]

            setNodes(finalNodes)
            setEdges(newEdges as Edge[])
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
            <div className="h-[400px] flex flex-col items-center justify-center text-muted-foreground/60 w-full bg-slate-50/50 backdrop-blur-sm rounded-[2rem] border-2 border-dashed border-slate-200">
                <div className="relative">
                    <div className="h-16 w-16 rounded-full border-4 border-t-emerald-500 border-emerald-100 animate-spin" />
                    <Info className="absolute inset-0 m-auto h-6 w-6 text-emerald-500" />
                </div>
                <p className="mt-6 text-sm font-black uppercase tracking-[0.2em] text-slate-800">Constructing Lineage Hierarchy</p>
                <p className="text-[10px] text-slate-400 mt-2 font-medium">Fetching immutable history from ledger...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="h-[400px] flex flex-col items-center justify-center text-rose-500 gap-4 w-full bg-rose-50/50 rounded-[2rem] border-2 border-dashed border-rose-200">
                <div className="p-4 bg-white rounded-2xl shadow-xl shadow-rose-100/50">
                    <AlertCircle className="h-10 w-10 text-rose-500" />
                </div>
                <div className="text-center">
                    <p className="font-black text-slate-800 text-sm uppercase tracking-widest">Protocol Sync Failed</p>
                    <p className="text-xs font-medium mt-1 text-rose-600/80">{error}</p>
                </div>
                <button 
                    onClick={() => fetchTree()}
                    className="mt-2 px-6 py-2 bg-white border border-rose-200 text-rose-600 rounded-full text-xs font-bold hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                >
                    Retry Handshake
                </button>
            </div>
        )
    }

    if (!nodes.length) {
        return (
            <div className="h-[400px] flex flex-col items-center justify-center text-muted-foreground/60 gap-4 w-full bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-200">
                <div className="p-4 bg-white rounded-2xl shadow-xl shadow-slate-100/50">
                    <HistoryIcon className="h-10 w-10 text-slate-300" />
                </div>
                <div className="text-center">
                    <p className="font-black text-slate-800 text-sm uppercase tracking-[0.2em]">Zero-State Lineage</p>
                    <p className="text-xs font-medium mt-1">No historical parent or child nodes detected on ledger</p>
                </div>
            </div>
        )
    }

    return (
        <div className="relative group">
            {/* Visual Controls Layer */}
            <div className="absolute top-6 left-6 z-10 flex flex-col gap-3">
                <div className="flex flex-col gap-2 p-4 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200 shadow-2xl shadow-slate-200/50">
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Active Parcel</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-slate-300" />
                        <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Historical / Parent</span>
                    </div>
                </div>
            </div>

            <div className="h-[700px] w-full bg-[#f8fafc] rounded-[2rem] overflow-hidden border-2 border-slate-200/50 shadow-inner group-hover:border-emerald-500/20 transition-colors duration-500">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    nodeTypes={nodeTypes}
                    fitView
                    proOptions={{ hideAttribution: true }}
                    minZoom={0.2}
                    maxZoom={1.5}
                    nodesDraggable={true}
                >
                    <Background 
                        variant={BackgroundVariant.Lines} 
                        gap={40} 
                        size={1} 
                        color="#e2e8f0" 
                        className="opacity-50"
                    />
                    <Controls 
                        className="!bg-white !border-slate-200 !rounded-xl !shadow-2xl !bottom-6 !right-6" 
                        showInteractive={false} 
                    />
                </ReactFlow>
            </div>
            
            {/* Decorative Grid Corners */}
            <div className="absolute -top-1 -left-1 w-12 h-12 border-t-2 border-l-2 border-emerald-500/30 rounded-tl-[2rem] pointer-events-none" />
            <div className="absolute -bottom-1 -right-1 w-12 h-12 border-b-2 border-r-2 border-emerald-500/30 rounded-br-[2rem] pointer-events-none" />
        </div>
    )
}

