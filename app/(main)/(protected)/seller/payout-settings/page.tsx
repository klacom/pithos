'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, CheckCircle2, AlertCircle, Loader2, Wallet, CreditCard, Landmark } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { getPayoutMethods, savePayoutMethod, deletePayoutMethod, PayoutMethod } from '@/app/seller/payout-actions'

function payoutDeleteBlockedMessage(raw: string): string {
    const m = raw.toLowerCase()
    if (
        m.includes('row-level security') ||
        m.includes('rls') ||
        m.includes('permission denied') ||
        m.includes('42501')
    ) {
        return 'This payout method cannot be removed under your current account rules. If you use primary GCash, you may need to archive or remove draft and published product listings first, or set another payout method as primary before removing this one.'
    }
    return raw
}

export default function PayoutSettingsPage() {
    const [methods, setMethods] = useState<PayoutMethod[]>([])
    const [loading, setLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [showAddForm, setShowAddForm] = useState(false)
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const [removeBlockedOpen, setRemoveBlockedOpen] = useState(false)
    const [removeBlockedDetail, setRemoveBlockedDetail] = useState('')
    const [newMethod, setNewMethod] = useState<PayoutMethod>({
        method_type: 'gcash',
        account_name: '',
        account_number: '',
        is_primary: false
    })

    useEffect(() => {
        loadMethods()
    }, [])

    async function loadMethods() {
        setLoading(true)
        try {
            const data = await getPayoutMethods()
            console.log('Loaded payout methods:', data)
            setMethods(data)
        } catch (error) {
            console.error('Failed to load payout methods:', error)
            toast.error('Failed to load payout methods')
        } finally {
            setLoading(false)
        }
    }

    async function handleAdd() {
        if (!newMethod.account_name || !newMethod.account_number) {
            toast.error('Please fill in all fields')
            return
        }

        setIsSaving(true)
        try {
            await savePayoutMethod(newMethod)
            toast.success('Payout method added successfully')
            setShowAddForm(false)
            setNewMethod({
                method_type: 'gcash',
                account_name: '',
                account_number: '',
                is_primary: false
            })
            loadMethods()
        } catch (error) {
            console.error('Failed to save:', error)
            console.log('Failed to save:', error)
            toast.error('Failed to save payout method')
        } finally {
            setIsSaving(false)
        }
    }

    function requestDelete(id: string) {
        setDeleteTargetId(id)
        setDeleteConfirmOpen(true)
    }

    async function handleDeleteConfirmed() {
        if (!deleteTargetId) return
        const targetId = deleteTargetId
        setIsDeleting(true)
        try {
            const result = await deletePayoutMethod(targetId)
            if (!result.success) {
                setRemoveBlockedDetail(result.error || 'This payout method could not be removed.')
                setRemoveBlockedOpen(true)
                setDeleteConfirmOpen(false)
                setDeleteTargetId(null)
                return
            }
            setDeleteConfirmOpen(false)
            setDeleteTargetId(null)
            toast.success('Payout method deleted')
            loadMethods()
        } finally {
            setIsDeleting(false)
        }
    }

    async function handleSetPrimary(method: PayoutMethod) {
        try {
            await savePayoutMethod({ ...method, is_primary: true })
            toast.success('Primary payout method updated')
            loadMethods()
        } catch (error) {
            toast.error('Failed to update primary method')
        }
    }

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="p-8 flex flex-col gap-8 mx-auto">
            <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete payout method?</AlertDialogTitle>
                        <AlertDialogDescription className="text-left">
                            This action cannot be undone. If this payout method is blocked by account rules, deletion will be refused.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteConfirmed} disabled={isDeleting}>
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={removeBlockedOpen} onOpenChange={setRemoveBlockedOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Cannot remove payout method</AlertDialogTitle>
                        <AlertDialogDescription className="text-left whitespace-pre-wrap">
                            {payoutDeleteBlockedMessage(removeBlockedDetail)}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction>OK</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <div className="flex justify-between items-center">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-bold tracking-tight">Payout Settings</h1>
                    <p className="text-muted-foreground">Manage where you receive your 80% share of sales.</p>
                </div>
                {!showAddForm && (
                    <Button onClick={() => setShowAddForm(true)} variant="red_default">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Method
                    </Button>
                )}
            </div>

            {showAddForm && (
                <Card className="p-6 border-2 border-primary/20 shadow-lg bg-primary/5">
                    <div className="flex flex-col gap-6">
                        <h2 className="text-xl font-bold">New Payout Method</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col gap-2">
                                <Label>Method Type</Label>
                                <div className="grid grid-cols-3 gap-2">
                                    <Button
                                        type="button"
                                        variant={newMethod.method_type === 'gcash' ? 'red_default' : 'outline'}
                                        onClick={() => setNewMethod(m => ({ ...m, method_type: 'gcash' }))}
                                        className="flex flex-col gap-1 h-auto py-3"
                                    >
                                        <Wallet className="w-5 h-5" />
                                        <span className="text-xs">GCash</span>
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={newMethod.method_type === 'maya' ? 'red_default' : 'outline'}
                                        onClick={() => setNewMethod(m => ({ ...m, method_type: 'maya' }))}
                                        className="flex flex-col gap-1 h-auto py-3"
                                    >
                                        <CreditCard className="w-5 h-5" />
                                        <span className="text-xs">Maya</span>
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={newMethod.method_type === 'bank' ? 'red_default' : 'outline'}
                                        onClick={() => setNewMethod(m => ({ ...m, method_type: 'bank' }))}
                                        className="flex flex-col gap-1 h-auto py-3"
                                    >
                                        <Landmark className="w-5 h-5" />
                                        <span className="text-xs">Bank</span>
                                    </Button>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <Label htmlFor="accName">Account Name</Label>
                                <Input
                                    id="accName"
                                    placeholder="Full Name"
                                    value={newMethod.account_name}
                                    onChange={e => setNewMethod(m => ({ ...m, account_name: e.target.value }))}
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <Label htmlFor="accNum">
                                    {newMethod.method_type === 'bank' ? 'Account Number' : 'Mobile Number'}
                                </Label>
                                <Input
                                    id="accNum"
                                    placeholder={newMethod.method_type === 'bank' ? '1234567890' : '09171234567'}
                                    value={newMethod.account_number}
                                    onChange={e => setNewMethod(m => ({ ...m, account_number: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" onClick={() => setShowAddForm(false)}>Cancel</Button>
                            <Button variant="red_default" onClick={handleAdd} disabled={isSaving}>
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                                Save Method
                            </Button>
                        </div>
                    </div>
                </Card>
            )}

            <div className="flex flex-col gap-4">
                {methods.length > 0 ? (
                    methods.map((method) => (

                        <Card key={method.id} className={`p-6 transition-all ${method.is_primary ? 'border-muted' : 'hover:border-muted-foreground/20'}`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-full ${method.is_primary ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                        {method.method_type === 'gcash' && <Wallet className="w-6 h-6" />}
                                        {method.method_type === 'maya' && <CreditCard className="w-6 h-6" />}
                                        {method.method_type === 'bank' && <Landmark className="w-6 h-6" />}
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-lg capitalize">{method.method_type}</span>
                                            {method.is_primary && (
                                                <span className="text-[10px] bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-bold uppercase">Primary</span>
                                            )}
                                        </div>
                                        <p className="text-sm font-medium">{method.account_name}</p>
                                        <p className="text-xs text-muted-foreground font-mono">{method.account_number}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {!method.is_primary && (
                                        <Button variant="ghost" size="sm" onClick={() => handleSetPrimary(method)}>
                                            Set as Primary
                                        </Button>
                                    )}
                                    <Button variant="red_ghost" size="icon" onClick={() => requestDelete(method.id!)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-xl bg-muted/30 text-center px-6">
                        <div className="p-4 bg-muted rounded-full mb-4">
                            <Wallet className="w-10 h-10 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-bold">No Payout Methods Found</h3>
                        <p className="text-sm text-muted-foreground max-w-sm mt-2">
                            You need to add at least one payout method to publish assets with a price.
                        </p>
                        <Button onClick={() => setShowAddForm(true)} variant="outline" className="mt-6">
                            Add Your First Method
                        </Button>
                    </div>
                )}
            </div>

            <div className="p-4 bg-red-50 border border-red-100 rounded-lg flex gap-3 items-start">
                <AlertCircle className="w-5 h-5 text-accent mt-0.5" />
                <div className="flex flex-col gap-1">
                    <p className="text-sm font-semibold text-accent">About Seller Shares</p>
                    <p className="text-xs text-accent">
                        Pithos collects 100% of the payment and splits it automatically. Your 80% share will be sent to your primary payout method after the transaction is fully processed by PayMongo.
                    </p>
                </div>
            </div>
        </div>
    )
}
