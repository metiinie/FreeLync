import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AlertTriangle,
    CheckCircle,
    XCircle,
    Clock,
    Search,
    MessageSquare,
    FileText,
    User,
    ArrowRight,
    Shield,
    Scale,
    Gavel,
    History,
    RefreshCw,
    MoreVertical,
    Check
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { DisputesService, Dispute } from '../services/disputes';
import { toast } from 'sonner';
import { formatCurrency } from '../lib/utils';

interface DisputeManagementProps {
    loading?: boolean;
}

const DisputeManagement: React.FC<DisputeManagementProps> = ({ loading: initialLoading = false }) => {
    const [disputes, setDisputes] = useState<Dispute[]>([]);
    const [loading, setLoading] = useState(initialLoading);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');
    const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
    const [isResolving, setIsResolving] = useState(false);
    const [resolutionNotes, setResolutionNotes] = useState('');
    const [resolutionType, setResolutionType] = useState('DISMISSED');

    useEffect(() => {
        loadDisputes();
    }, []);

    const loadDisputes = async () => {
        try {
            setLoading(true);
            const data = await DisputesService.getAllDisputesAsAdmin();
            setDisputes(data);
        } catch (error) {
            console.error('Error loading disputes:', error);
            toast.error('Failed to load disputes');
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = async (dispute: Dispute) => {
        try {
            const data = await DisputesService.getDisputeByIdAsAdmin(dispute.id);
            setSelectedDispute(data);
        } catch (error) {
            toast.error('Failed to load dispute details');
        }
    };

    const handleAssignToMe = async (disputeId: string) => {
        try {
            await DisputesService.assignDispute(disputeId);
            toast.success('Dispute assigned to you');
            loadDisputes();
            if (selectedDispute && selectedDispute.id === disputeId) {
                handleViewDetails(selectedDispute);
            }
        } catch (error) {
            toast.error('Failed to assign dispute');
        }
    };

    const handleResolve = async () => {
        if (!selectedDispute) return;
        if (!resolutionNotes) {
            toast.error('Please provide resolution notes');
            return;
        }

        try {
            setIsResolving(true);
            await DisputesService.resolveDispute(selectedDispute.id, {
                resolution: resolutionType,
                notes: resolutionNotes
            });
            toast.success('Dispute resolved successfully');
            setSelectedDispute(null);
            loadDisputes();
        } catch (error) {
            toast.error('Failed to resolve dispute');
        } finally {
            setIsResolving(false);
        }
    };

    const filteredDisputes = disputes.filter(d => {
        const matchesSearch = d.id.toLowerCase().includes(search.toLowerCase()) ||
            d.reason.toLowerCase().includes(search.toLowerCase()) ||
            d.initiator?.full_name.toLowerCase().includes(search.toLowerCase());

        if (filter === 'all') return matchesSearch;
        return matchesSearch && d.status === filter;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'OPEN': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            case 'UNDER_REVIEW': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
            case 'RESOLVED': return 'bg-green-500/10 text-green-500 border-green-500/20';
            case 'CLOSED': return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
            default: return 'bg-red-500/10 text-red-500 border-red-500/20';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                        Dispute Management
                    </h2>
                    <p className="text-muted-foreground">Monitor and resolve platform conflicts</p>
                </div>
                <Button variant="outline" size="sm" onClick={loadDisputes} className="gap-2">
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="bg-background-soft border-primary/10">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Open Disputes</p>
                                <p className="text-2xl font-bold">{disputes.filter(d => d.status === 'OPEN').length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-background-soft border-primary/10">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-500">
                                <Clock className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Under Review</p>
                                <p className="text-2xl font-bold">{disputes.filter(d => d.status === 'UNDER_REVIEW').length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-background-soft border-primary/10">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-green-500/10 text-green-500">
                                <CheckCircle className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Resolved</p>
                                <p className="text-2xl font-bold">{disputes.filter(d => d.status === 'RESOLVED').length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-background-soft border-primary/10">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                <Scale className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Avg. Resolution</p>
                                <p className="text-2xl font-bold">2.4d</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by Dispute ID, Reason, or User..."
                        className="pl-10"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    {['all', 'OPEN', 'UNDER_REVIEW', 'RESOLVED'].map((f) => (
                        <Button
                            key={f}
                            variant={filter === f ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setFilter(f)}
                            className="capitalize"
                        >
                            {f.toLowerCase().replace('_', ' ')}
                        </Button>
                    ))}
                </div>
            </div>

            <Card className="border-primary/10 bg-background-soft overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-primary/10 bg-muted/30">
                                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dispute ID</th>
                                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Initiator</th>
                                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reason</th>
                                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Created At</th>
                                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Admin</th>
                                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-primary/10">
                            <AnimatePresence mode="popLayout">
                                {filteredDisputes.map((dispute) => (
                                    <motion.tr
                                        key={dispute.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="hover:bg-primary/5 transition-colors group"
                                    >
                                        <td className="px-6 py-4">
                                            <code className="text-xs font-mono text-primary">
                                                {dispute.id.substring(0, 8)}
                                            </code>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold">
                                                    {dispute.initiator?.full_name.charAt(0)}
                                                </div>
                                                <span className="text-sm font-medium">{dispute.initiator?.full_name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant="outline" className="text-[10px] font-normal">
                                                {dispute.reason.replace(/_/g, ' ')}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-sm">
                                            {formatCurrency(dispute.amount_claimed)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge className={getStatusColor(dispute.status)}>
                                                {dispute.status.replace(/_/g, ' ')}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-muted-foreground">
                                            {new Date(dispute.created_at).toLocaleDateString()} {new Date(dispute.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="px-6 py-4">
                                            {dispute.assigned_admin ? (
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                    <Shield className="w-3 h-3 text-primary" />
                                                    {dispute.assigned_admin.full_name.split(' ')[0]}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-muted-foreground italic">Unassigned</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => handleViewDetails(dispute)}
                                            >
                                                View Details
                                            </Button>
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
                {filteredDisputes.length === 0 && !loading && (
                    <div className="py-20 flex flex-col items-center justify-center text-muted-foreground">
                        <Scale className="w-12 h-12 mb-4 opacity-20" />
                        <p>No disputes found matching your filters</p>
                    </div>
                )}
            </Card>

            {/* Dispute Details Modal */}
            <AnimatePresence>
                {selectedDispute && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="w-full max-w-4xl max-h-[90vh] overflow-hidden bg-background border border-primary/20 rounded-xl shadow-2xl flex flex-col"
                        >
                            <div className="p-6 border-b border-primary/10 flex justify-between items-center bg-muted/30">
                                <div className="flex items-center gap-3">
                                    <Scale className="w-6 h-6 text-primary" />
                                    <div>
                                        <h3 className="text-xl font-bold">Dispute Details</h3>
                                        <p className="text-xs text-muted-foreground font-mono">ID: {selectedDispute.id}</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => setSelectedDispute(null)}>
                                    <XCircle className="w-5 h-5" />
                                </Button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="md:col-span-2 space-y-6">
                                        <section className="space-y-3">
                                            <h4 className="text-sm font-semibold flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-primary" />
                                                Description
                                            </h4>
                                            <div className="p-4 rounded-lg bg-muted/50 text-sm italic">
                                                "{selectedDispute.description}"
                                            </div>
                                        </section>

                                        <section className="space-y-3">
                                            <h4 className="text-sm font-semibold flex items-center gap-2">
                                                <History className="w-4 h-4 text-primary" />
                                                Case History
                                            </h4>
                                            <div className="space-y-4">
                                                {selectedDispute.messages?.map((msg: any) => (
                                                    <div key={msg.id} className={`flex flex-col ${msg.is_internal ? 'bg-primary/5 border border-primary/10 ml-8' : 'bg-muted/30'} p-3 rounded-lg`}>
                                                        <div className="flex justify-between items-center mb-1">
                                                            <span className="text-xs font-bold flex items-center gap-1">
                                                                {msg.is_internal && <Shield className="w-3 h-3" />}
                                                                {msg.sender?.full_name}
                                                            </span>
                                                            <span className="text-[10px] text-muted-foreground">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                        </div>
                                                        <p className="text-sm">{msg.content}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    </div>

                                    <div className="space-y-6 border-l border-primary/10 pl-6">
                                        <section className="space-y-3">
                                            <h4 className="text-sm font-semibold">Participants</h4>
                                            <div className="space-y-2">
                                                <div className="text-xs">
                                                    <p className="text-muted-foreground mb-1 uppercase tracking-tighter">Initiator (Buyer)</p>
                                                    <p className="font-bold">{selectedDispute.initiator?.full_name}</p>
                                                    <p className="text-[10px] text-muted-foreground italic">{selectedDispute.initiator?.email}</p>
                                                </div>
                                                <div className="text-xs">
                                                    <p className="text-muted-foreground mb-1 uppercase tracking-tighter">Respondent (Seller)</p>
                                                    <p className="font-bold">{selectedDispute.respondent?.full_name}</p>
                                                    <p className="text-[10px] text-muted-foreground italic">{selectedDispute.respondent?.email}</p>
                                                </div>
                                            </div>
                                        </section>

                                        <section className="space-y-3">
                                            <h4 className="text-sm font-semibold">Financials</h4>
                                            <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                                                <p className="text-xs text-muted-foreground">Claimed Amount</p>
                                                <p className="text-xl font-bold font-mono text-primary">
                                                    {formatCurrency(selectedDispute.amount_claimed)}
                                                </p>
                                            </div>
                                        </section>

                                        <section className="space-y-3">
                                            <h4 className="text-sm font-semibold">Management</h4>
                                            {!selectedDispute.assigned_admin ? (
                                                <Button className="w-full gap-2" size="sm" onClick={() => handleAssignToMe(selectedDispute.id)}>
                                                    <Gavel className="w-4 h-4" />
                                                    Assign to Me
                                                </Button>
                                            ) : selectedDispute.assigned_admin.email === 'admin@freelync.com' ? (
                                                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-xs text-green-500 flex items-center gap-2">
                                                    <Check className="w-4 h-4" />
                                                    Assigned to You
                                                </div>
                                            ) : (
                                                <div className="text-xs text-muted-foreground">
                                                    Managed by <span className="font-bold">{selectedDispute.assigned_admin.full_name}</span>
                                                </div>
                                            )}
                                        </section>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-primary/10 bg-muted/50 flex flex-col md:flex-row gap-4">
                                <div className="flex-1 flex gap-2">
                                    <Input placeholder="Resolution notes or admin decision..." value={resolutionNotes} onChange={(e) => setResolutionNotes(e.target.value)} />
                                    <select
                                        className="bg-background border border-primary/10 rounded-md px-2 text-xs"
                                        value={resolutionType}
                                        onChange={(e) => setResolutionType(e.target.value)}
                                    >
                                        <option value="RELEASE_SELLER">Release to Seller</option>
                                        <option value="REFUND_BUYER">Refund Buyer</option>
                                        <option value="PARTIAL_REFUND">Partial Refund</option>
                                        <option value="DISMISSED">Dismissed</option>
                                    </select>
                                </div>
                                <Button
                                    disabled={!selectedDispute.assigned_admin || isResolving || selectedDispute.status === 'RESOLVED'}
                                    className="gap-2"
                                    onClick={handleResolve}
                                >
                                    {isResolving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Gavel className="w-4 h-4" />}
                                    Finalize Resolution
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DisputeManagement;
