'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Building2,
  Users,
  ClipboardList,
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Search,
  Loader2,
  TrendingUp,
  TrendingDown,
  Eye,
  Phone,
  Mail,
  MessageCircle,
  Filter,
  ChevronDown,
  X,
  Check,
  AlertTriangle,
  Home,
  MapPin,
  Wallet,
  Tag,
  Star,
  BarChart3,
  Activity,
  UserPlus,
  MoreHorizontal,
  Globe,
  Save,
  ExternalLink,
  FileText,
  Settings,
  Share2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Property {
  id: string
  title: string
  description: string
  price: number
  location: string
  city: string
  type: string
  bedrooms: number | null
  bathrooms: number | null
  landArea: number | null
  buildingArea: number | null
  image: string
  featured: boolean
  status: string
  createdAt: string
  _count?: { leads: number }
}

interface Lead {
  id: string
  name: string
  whatsapp: string
  propertyType: string | null
  location: string | null
  dp: string | null
  promo: string | null
  propertyId: string | null
  property?: { id: string; title: string } | null
  message: string | null
  status: string
  createdAt: string
}

interface User {
  id: string
  name: string
  email: string
  whatsapp: string
  role: string
  avatar: string | null
  active: boolean
  createdAt: string
}

interface DashboardData {
  stats: {
    totalProperties: number
    totalLeads: number
    totalUsers: number
    newLeads: number
    activeProperties: number
    soldProperties: number
    leadsToday: number
  }
  leadsByType: { propertyType: string; _count: number }[]
  propertiesByType: { type: string; _count: number }[]
  recentLeads: (Lead & { property?: { title: string } | null })[]
  topProperties: (Property & { _count: { leads: number } })[]
}

interface SeoData {
  id: string
  siteName: string
  title: string
  description: string
  keywords: string
  ogImage: string
  canonicalUrl: string
  robots: string
  googleVerification: string
  updatedAt: string
}

type TabType = 'dashboard' | 'listings' | 'leads' | 'users' | 'seo'

// ─── Constants ───────────────────────────────────────────────────────────────

const CHART_COLORS = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

const PROPERTY_TYPES = ['Rumah', 'Apartemen', 'Tanah', 'Ruko']
const PROPERTY_STATUSES = ['active', 'sold', 'reserved']
const LEAD_STATUSES = ['new', 'contacted', 'qualified', 'closed']
const USER_ROLES = ['admin', 'agent']

const LEAD_STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  new: { label: 'Baru', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  contacted: { label: 'Dihubungi', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  qualified: { label: 'Qualified', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  closed: { label: 'Closed', color: 'text-gray-700', bg: 'bg-gray-50 border-gray-200' },
}

const PROPERTY_STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: 'Aktif', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  sold: { label: 'Terjual', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
  reserved: { label: 'Reserved', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatPrice(priceInJuta: number): string {
  if (priceInJuta >= 1000) {
    return `Rp ${(priceInJuta / 1000).toFixed(priceInJuta % 1000 === 0 ? 0 : 1)} M`
  }
  return `Rp ${priceInJuta.toLocaleString('id-ID')} Jt`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
  })
}

// ─── Component ───────────────────────────────────────────────────────────────

interface AdminDashboardProps {
  onBack: () => void
}

export default function AdminDashboard({ onBack }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard')
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [properties, setProperties] = useState<Property[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  // Search / filter
  const [propertySearch, setPropertySearch] = useState('')
  const [propertyTypeFilter, setPropertyTypeFilter] = useState('')
  const [leadStatusFilter, setLeadStatusFilter] = useState('')
  const [userSearch, setUserSearch] = useState('')

  // Dialog states
  const [propertyDialog, setPropertyDialog] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [leadDialog, setLeadDialog] = useState(false)
  const [userDialog, setUserDialog] = useState(false)

  // Edit states
  const [editingProperty, setEditingProperty] = useState<Property | null>(null)
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deletingItem, setDeletingItem] = useState<{ type: string; id: string; name: string } | null>(null)

  // Form states
  const [propertyForm, setPropertyForm] = useState({
    title: '', description: '', price: '', location: '', city: '', type: 'Rumah',
    bedrooms: '', bathrooms: '', landArea: '', buildingArea: '', image: '', featured: false, status: 'active',
  })
  const [userForm, setUserForm] = useState({
    name: '', email: '', whatsapp: '', role: 'agent', active: true,
  })
  const [saving, setSaving] = useState(false)

  // SEO state
  const [seoData, setSeoData] = useState<SeoData | null>(null)
  const [seoForm, setSeoForm] = useState({
    siteName: '', title: '', description: '', keywords: '', ogImage: '', canonicalUrl: '', robots: 'index, follow', googleVerification: '',
  })
  const [seoSaving, setSeoSaving] = useState(false)

  // ─── Data Fetching ─────────────────────────────────────────────────────

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard')
      if (res.ok) {
        const data = await res.json()
        setDashboardData(data)
      }
    } catch { toast.error('Gagal memuat dashboard') }
  }, [])

  const fetchProperties = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (propertySearch) params.set('search', propertySearch)
      if (propertyTypeFilter) params.set('type', propertyTypeFilter)
      const res = await fetch(`/api/properties?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setProperties(data.properties || [])
      }
    } catch { toast.error('Gagal memuat properti') }
  }, [propertySearch, propertyTypeFilter])

  const fetchLeads = useCallback(async () => {
    try {
      const res = await fetch('/api/leads')
      if (res.ok) {
        const data = await res.json()
        setLeads(data.leads || [])
      }
    } catch { toast.error('Gagal memuat leads') }
  }, [])

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/users')
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users || [])
      }
    } catch { toast.error('Gagal memuat users') }
  }, [])

  const fetchSeo = useCallback(async () => {
    try {
      const res = await fetch('/api/seo')
      if (res.ok) {
        const data = await res.json()
        setSeoData(data.seo)
        setSeoForm({
          siteName: data.seo.siteName || '',
          title: data.seo.title || '',
          description: data.seo.description || '',
          keywords: data.seo.keywords || '',
          ogImage: data.seo.ogImage || '',
          canonicalUrl: data.seo.canonicalUrl || '',
          robots: data.seo.robots || 'index, follow',
          googleVerification: data.seo.googleVerification || '',
        })
      }
    } catch { /* silent */ }
  }, [])

  // Initial load
  useEffect(() => {
    setLoading(true)
    Promise.all([fetchDashboard(), fetchProperties(), fetchLeads(), fetchUsers(), fetchSeo()]).finally(() => setLoading(false))
  }, [fetchDashboard, fetchProperties, fetchLeads, fetchUsers, fetchSeo])

  // ─── Property CRUD ─────────────────────────────────────────────────────

  const openPropertyDialog = (property?: Property) => {
    if (property) {
      setEditingProperty(property)
      setPropertyForm({
        title: property.title, description: property.description, price: String(property.price),
        location: property.location, city: property.city, type: property.type,
        bedrooms: property.bedrooms ? String(property.bedrooms) : '',
        bathrooms: property.bathrooms ? String(property.bathrooms) : '',
        landArea: property.landArea ? String(property.landArea) : '',
        buildingArea: property.buildingArea ? String(property.buildingArea) : '',
        image: property.image, featured: property.featured, status: property.status,
      })
    } else {
      setEditingProperty(null)
      setPropertyForm({
        title: '', description: '', price: '', location: '', city: '', type: 'Rumah',
        bedrooms: '', bathrooms: '', landArea: '', buildingArea: '', image: '', featured: false, status: 'active',
      })
    }
    setPropertyDialog(true)
  }

  const saveProperty = async () => {
    if (!propertyForm.title || !propertyForm.price || !propertyForm.location || !propertyForm.city) {
      toast.error('Judul, harga, lokasi, dan kota wajib diisi')
      return
    }
    setSaving(true)
    try {
      const url = editingProperty ? `/api/properties/${editingProperty.id}` : '/api/properties'
      const method = editingProperty ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(propertyForm),
      })
      if (!res.ok) { const data = await res.json(); throw new Error(data.error) }
      toast.success(editingProperty ? 'Properti berhasil diupdate' : 'Properti berhasil ditambahkan')
      setPropertyDialog(false)
      fetchProperties()
      fetchDashboard()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan')
    } finally { setSaving(false) }
  }

  const confirmDelete = (type: string, id: string, name: string) => {
    setDeletingItem({ type, id, name })
    setDeleteDialog(true)
  }

  const executeDelete = async () => {
    if (!deletingItem) return
    setSaving(true)
    try {
      let url = ''
      if (deletingItem.type === 'property') url = `/api/properties/${deletingItem.id}`
      else if (deletingItem.type === 'lead') url = `/api/leads/${deletingItem.id}`
      else if (deletingItem.type === 'user') url = `/api/users/${deletingItem.id}`

      const res = await fetch(url, { method: 'DELETE' })
      if (!res.ok) { const data = await res.json(); throw new Error(data.error) }
      toast.success('Berhasil dihapus')
      setDeleteDialog(false)
      setDeletingItem(null)
      fetchProperties(); fetchLeads(); fetchUsers(); fetchDashboard()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menghapus')
    } finally { setSaving(false) }
  }

  // ─── Lead Status Update ────────────────────────────────────────────────

  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error('Gagal update')
      toast.success('Status lead berhasil diupdate')
      fetchLeads()
      fetchDashboard()
    } catch {
      toast.error('Gagal mengupdate status lead')
    }
  }

  // ─── User CRUD ─────────────────────────────────────────────────────────

  const openUserDialog = (user?: User) => {
    if (user) {
      setEditingUser(user)
      setUserForm({
        name: user.name, email: user.email, whatsapp: user.whatsapp, role: user.role, active: user.active,
      })
    } else {
      setEditingUser(null)
      setUserForm({ name: '', email: '', whatsapp: '', role: 'agent', active: true })
    }
    setUserDialog(true)
  }

  const saveUser = async () => {
    if (!userForm.name || !userForm.email) {
      toast.error('Nama dan email wajib diisi')
      return
    }
    setSaving(true)
    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users'
      const method = editingUser ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userForm),
      })
      if (!res.ok) { const data = await res.json(); throw new Error(data.error) }
      toast.success(editingUser ? 'User berhasil diupdate' : 'User berhasil ditambahkan')
      setUserDialog(false)
      fetchUsers()
      fetchDashboard()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan')
    } finally { setSaving(false) }
  }

  // ─── Filtered Data ─────────────────────────────────────────────────────

  const filteredLeads = leads.filter(lead => {
    if (leadStatusFilter && lead.status !== leadStatusFilter) return false
    return true
  })

  const filteredUsers = users.filter(user => {
    if (userSearch) {
      const s = userSearch.toLowerCase()
      return user.name.toLowerCase().includes(s) || user.email.toLowerCase().includes(s) || user.whatsapp.includes(s)
    }
    return true
  })

  // ─── SEO Save ──────────────────────────────────────────────────────────
  const saveSeo = async () => {
    setSeoSaving(true)
    try {
      const res = await fetch('/api/seo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(seoForm),
      })
      if (!res.ok) { const data = await res.json(); throw new Error(data.error) }
      const data = await res.json()
      setSeoData(data.seo)
      toast.success('Pengaturan SEO berhasil disimpan!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan pengaturan SEO')
    } finally { setSeoSaving(false) }
  }

  // ─── Chart Data ────────────────────────────────────────────────────────

  const leadsByTypeChartData = (dashboardData?.leadsByType || []).map(item => ({
    name: item.propertyType || 'Tidak ada',
    value: item._count,
  }))

  const propertiesByTypeChartData = (dashboardData?.propertiesByType || []).map(item => ({
    name: item.type,
    jumlah: item._count,
  }))

  // ─── Render ────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          <p className="text-sm text-gray-500">Memuat dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ─── Header ──────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white border-b shadow-sm">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
              <Settings className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-base text-gray-900">Admin Dashboard</h1>
              <p className="text-[10px] text-gray-500">PropMart Management</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {dashboardData && (
              <Badge variant="outline" className="text-[10px] bg-emerald-50 border-emerald-200 text-emerald-700">
                {dashboardData.stats.newLeads} lead baru
              </Badge>
            )}
          </div>
        </div>

        {/* Tabs Navigation - scrollable horizontal */}
        <div className="px-4 pb-2">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)}>
            <TabsList className="w-full grid grid-cols-5 h-10">
              <TabsTrigger value="dashboard" className="text-xs gap-0.5 flex-col sm:flex-row sm:gap-1">
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span className="text-[9px] sm:text-xs sm:inline">Home</span>
              </TabsTrigger>
              <TabsTrigger value="listings" className="text-xs gap-0.5 flex-col sm:flex-row sm:gap-1">
                <Building2 className="w-3.5 h-3.5" />
                <span className="text-[9px] sm:text-xs sm:inline">Listing</span>
              </TabsTrigger>
              <TabsTrigger value="leads" className="text-xs gap-0.5 flex-col sm:flex-row sm:gap-1">
                <ClipboardList className="w-3.5 h-3.5" />
                <span className="text-[9px] sm:text-xs sm:inline">Leads</span>
              </TabsTrigger>
              <TabsTrigger value="users" className="text-xs gap-0.5 flex-col sm:flex-row sm:gap-1">
                <Users className="w-3.5 h-3.5" />
                <span className="text-[9px] sm:text-xs sm:inline">Users</span>
              </TabsTrigger>
              <TabsTrigger value="seo" className="text-xs gap-0.5 flex-col sm:flex-row sm:gap-1">
                <Globe className="w-3.5 h-3.5" />
                <span className="text-[9px] sm:text-xs sm:inline">SEO</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </header>

      {/* ─── Content ──────────────────────────────────────────────────── */}
      <main className="flex-1 px-4 py-4 pb-20">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <DashboardTab data={dashboardData} leadsByTypeChartData={leadsByTypeChartData} propertiesByTypeChartData={propertiesByTypeChartData} onNavigate={setActiveTab} />
            </motion.div>
          )}
          {activeTab === 'listings' && (
            <motion.div key="listings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <ListingsTab
                properties={properties}
                search={propertySearch}
                setSearch={setPropertySearch}
                typeFilter={propertyTypeFilter}
                setTypeFilter={setPropertyTypeFilter}
                onAdd={() => openPropertyDialog()}
                onEdit={(p) => openPropertyDialog(p)}
                onDelete={(id, name) => confirmDelete('property', id, name)}
              />
            </motion.div>
          )}
          {activeTab === 'leads' && (
            <motion.div key="leads" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <LeadsTab
                leads={filteredLeads}
                statusFilter={leadStatusFilter}
                setStatusFilter={setLeadStatusFilter}
                onUpdateStatus={updateLeadStatus}
                onDelete={(id, name) => confirmDelete('lead', id, name)}
              />
            </motion.div>
          )}
          {activeTab === 'users' && (
            <motion.div key="users" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <UsersTab
                users={filteredUsers}
                search={userSearch}
                setSearch={setUserSearch}
                onAdd={() => openUserDialog()}
                onEdit={(u) => openUserDialog(u)}
                onDelete={(id, name) => confirmDelete('user', id, name)}
              />
            </motion.div>
          )}
          {activeTab === 'seo' && (
            <motion.div key="seo" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <SeoTab
                seoForm={seoForm}
                setSeoForm={setSeoForm}
                onSave={saveSeo}
                saving={seoSaving}
                seoData={seoData}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ─── Property Dialog ──────────────────────────────────────────── */}
      <Dialog open={propertyDialog} onOpenChange={setPropertyDialog}>
        <DialogContent className="max-w-[calc(100%-2rem)] max-h-[90vh] overflow-y-auto">
          <div className="max-w-[400px] mx-auto">
          <DialogHeader>
            <DialogTitle>{editingProperty ? 'Edit Properti' : 'Tambah Properti'}</DialogTitle>
            <DialogDescription>
              {editingProperty ? 'Ubah data properti' : 'Isi data properti baru'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="text-xs font-semibold">Judul *</Label>
                <Input value={propertyForm.title} onChange={(e) => setPropertyForm(p => ({ ...p, title: e.target.value }))} placeholder="Nama properti" className="h-9 mt-1" />
              </div>
              <div>
                <Label className="text-xs font-semibold">Jenis *</Label>
                <Select value={propertyForm.type} onValueChange={(v) => setPropertyForm(p => ({ ...p, type: v }))}>
                  <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PROPERTY_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold">Harga (Juta) *</Label>
                <Input type="number" value={propertyForm.price} onChange={(e) => setPropertyForm(p => ({ ...p, price: e.target.value }))} placeholder="850" className="h-9 mt-1" />
              </div>
              <div>
                <Label className="text-xs font-semibold">Lokasi *</Label>
                <Input value={propertyForm.location} onChange={(e) => setPropertyForm(p => ({ ...p, location: e.target.value }))} placeholder="BSD City" className="h-9 mt-1" />
              </div>
              <div>
                <Label className="text-xs font-semibold">Kota *</Label>
                <Input value={propertyForm.city} onChange={(e) => setPropertyForm(p => ({ ...p, city: e.target.value }))} placeholder="Tangerang" className="h-9 mt-1" />
              </div>
              <div>
                <Label className="text-xs font-semibold">Kamar Tidur</Label>
                <Input type="number" value={propertyForm.bedrooms} onChange={(e) => setPropertyForm(p => ({ ...p, bedrooms: e.target.value }))} placeholder="3" className="h-9 mt-1" />
              </div>
              <div>
                <Label className="text-xs font-semibold">Kamar Mandi</Label>
                <Input type="number" value={propertyForm.bathrooms} onChange={(e) => setPropertyForm(p => ({ ...p, bathrooms: e.target.value }))} placeholder="2" className="h-9 mt-1" />
              </div>
              <div>
                <Label className="text-xs font-semibold">Luas Tanah (m²)</Label>
                <Input type="number" value={propertyForm.landArea} onChange={(e) => setPropertyForm(p => ({ ...p, landArea: e.target.value }))} placeholder="120" className="h-9 mt-1" />
              </div>
              <div>
                <Label className="text-xs font-semibold">Luas Bangunan (m²)</Label>
                <Input type="number" value={propertyForm.buildingArea} onChange={(e) => setPropertyForm(p => ({ ...p, buildingArea: e.target.value }))} placeholder="90" className="h-9 mt-1" />
              </div>
              <div>
                <Label className="text-xs font-semibold">Status</Label>
                <Select value={propertyForm.status} onValueChange={(v) => setPropertyForm(p => ({ ...p, status: v }))}>
                  <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PROPERTY_STATUSES.map(s => <SelectItem key={s} value={s}>{PROPERTY_STATUS_MAP[s]?.label || s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold">URL Gambar</Label>
                <Input value={propertyForm.image} onChange={(e) => setPropertyForm(p => ({ ...p, image: e.target.value }))} placeholder="/properties/rumah-1.png" className="h-9 mt-1" />
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <Switch checked={propertyForm.featured} onCheckedChange={(v) => setPropertyForm(p => ({ ...p, featured: v }))} />
                <Label className="text-xs font-semibold">Tandai sebagai Unggulan</Label>
              </div>
              <div className="col-span-2">
                <Label className="text-xs font-semibold">Deskripsi</Label>
                <Textarea value={propertyForm.description} onChange={(e) => setPropertyForm(p => ({ ...p, description: e.target.value }))} placeholder="Deskripsi properti..." className="mt-1 min-h-[80px]" />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setPropertyDialog(false)} className="h-9">Batal</Button>
            <Button onClick={saveProperty} disabled={saving} className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white">
              {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
              {editingProperty ? 'Update' : 'Simpan'}
            </Button>
          </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── User Dialog ──────────────────────────────────────────────── */}
      <Dialog open={userDialog} onOpenChange={setUserDialog}>
        <DialogContent className="max-w-[calc(100%-2rem)]">
          <div className="max-w-[400px] mx-auto">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Edit User' : 'Tambah User'}</DialogTitle>
            <DialogDescription>
              {editingUser ? 'Ubah data user' : 'Isi data user baru'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs font-semibold">Nama *</Label>
              <Input value={userForm.name} onChange={(e) => setUserForm(p => ({ ...p, name: e.target.value }))} placeholder="Nama lengkap" className="h-9 mt-1" />
            </div>
            <div>
              <Label className="text-xs font-semibold">Email *</Label>
              <Input type="email" value={userForm.email} onChange={(e) => setUserForm(p => ({ ...p, email: e.target.value }))} placeholder="email@example.com" className="h-9 mt-1" />
            </div>
            <div>
              <Label className="text-xs font-semibold">WhatsApp</Label>
              <Input value={userForm.whatsapp} onChange={(e) => setUserForm(p => ({ ...p, whatsapp: e.target.value }))} placeholder="081234567890" className="h-9 mt-1" />
            </div>
            <div>
              <Label className="text-xs font-semibold">Role</Label>
              <Select value={userForm.role} onValueChange={(v) => setUserForm(p => ({ ...p, role: v }))}>
                <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {USER_ROLES.map(r => <SelectItem key={r} value={r}>{r === 'admin' ? 'Admin' : 'Agent'}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={userForm.active} onCheckedChange={(v) => setUserForm(p => ({ ...p, active: v }))} />
              <Label className="text-xs font-semibold">Aktif</Label>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setUserDialog(false)} className="h-9">Batal</Button>
            <Button onClick={saveUser} disabled={saving} className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white">
              {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
              {editingUser ? 'Update' : 'Simpan'}
            </Button>
          </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirm Dialog ────────────────────────────────────── */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent className="max-w-[calc(100%-2rem)]">
          <div className="max-w-[400px] mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Konfirmasi Hapus
            </DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus <strong>{deletingItem?.name}</strong>? Tindakan ini tidak bisa dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteDialog(false)} className="h-9">Batal</Button>
            <Button onClick={executeDelete} disabled={saving} className="h-9 bg-red-600 hover:bg-red-700 text-white">
              {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Trash2 className="w-4 h-4 mr-1" />}
              Hapus
            </Button>
          </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// DASHBOARD TAB
// ═════════════════════════════════════════════════════════════════════════════

function DashboardTab({
  data,
  leadsByTypeChartData,
  propertiesByTypeChartData,
  onNavigate,
}: {
  data: DashboardData | null
  leadsByTypeChartData: { name: string; value: number }[]
  propertiesByTypeChartData: { name: string; jumlah: number }[]
  onNavigate: (tab: TabType) => void
}) {
  if (!data) return null

  const { stats, recentLeads, topProperties } = data

  const statCards = [
    { label: 'Total Properti', value: stats.totalProperties, icon: Building2, color: 'emerald', sub: `${stats.activeProperties} aktif` },
    { label: 'Total Leads', value: stats.totalLeads, icon: ClipboardList, color: 'blue', sub: `${stats.newLeads} baru` },
    { label: 'Leads Hari Ini', value: stats.leadsToday, icon: Activity, color: 'amber', sub: 'hari ini' },
    { label: 'Terjual', value: stats.soldProperties, icon: TrendingUp, color: 'red', sub: 'properti' },
  ]

  return (
    <div className="space-y-4">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.label} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] text-gray-500 font-medium">{card.label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-0.5">{card.value}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{card.sub}</p>
                  </div>
                  <div className={`w-9 h-9 rounded-xl bg-${card.color}-50 flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 text-${card.color}-600`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Properties by Type */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-bold flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              Properti per Jenis
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {propertiesByTypeChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={propertiesByTypeChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="jumlah" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[180px] flex items-center justify-center text-sm text-gray-400">Belum ada data</div>
            )}
          </CardContent>
        </Card>

        {/* Leads by Type - Pie Chart */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-bold flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-amber-600" />
              Leads per Jenis Properti
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {leadsByTypeChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={leadsByTypeChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {leadsByTypeChartData.map((_, idx) => (
                      <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[180px] flex items-center justify-center text-sm text-gray-400">Belum ada data</div>
            )}
            {leadsByTypeChartData.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {leadsByTypeChartData.map((item, idx) => (
                  <div key={item.name} className="flex items-center gap-1">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }} />
                    <span className="text-[10px] text-gray-600">{item.name} ({item.value})</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Leads */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2 pt-4 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-1.5">
              <ClipboardList className="w-4 h-4 text-blue-600" />
              Leads Terbaru
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-xs text-emerald-600 h-7" onClick={() => onNavigate('leads')}>
              Lihat Semua →
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {recentLeads.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Belum ada leads</p>
          ) : (
            <div className="space-y-2">
              {recentLeads.map((lead) => {
                const statusInfo = LEAD_STATUS_MAP[lead.status] || LEAD_STATUS_MAP.new
                return (
                  <div key={lead.id} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl">
                    <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-emerald-700">{lead.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{lead.name}</p>
                      <p className="text-[10px] text-gray-500 truncate">
                        {lead.propertyType || 'Umum'} • {lead.location || '-'} • {formatShortDate(lead.createdAt)}
                      </p>
                    </div>
                    <Badge className={`text-[10px] border ${statusInfo.bg} ${statusInfo.color}`}>
                      {statusInfo.label}
                    </Badge>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Properties by Leads */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2 pt-4 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-1.5">
              <Star className="w-4 h-4 text-amber-600" />
              Properti Terpopuler
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-xs text-emerald-600 h-7" onClick={() => onNavigate('listings')}>
              Lihat Semua →
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {topProperties.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Belum ada data</p>
          ) : (
            <div className="space-y-2">
              {topProperties.map((prop, idx) => (
                <div key={prop.id} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-amber-600">#{idx + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{prop.title}</p>
                    <p className="text-[10px] text-gray-500">{prop.type} • {prop.city}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-emerald-600">{prop._count?.leads || 0}</p>
                    <p className="text-[10px] text-gray-400">leads</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-emerald-100/50">
        <CardContent className="p-4">
          <p className="text-xs font-semibold text-emerald-800 mb-3">Aksi Cepat</p>
          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => onNavigate('listings')} className="flex flex-col items-center gap-1.5 p-3 bg-white rounded-xl border border-emerald-200 hover:shadow-sm transition-shadow">
              <Building2 className="w-5 h-5 text-emerald-600" />
              <span className="text-[10px] font-medium text-gray-700">Kelola Listing</span>
            </button>
            <button onClick={() => onNavigate('leads')} className="flex flex-col items-center gap-1.5 p-3 bg-white rounded-xl border border-emerald-200 hover:shadow-sm transition-shadow">
              <ClipboardList className="w-5 h-5 text-blue-600" />
              <span className="text-[10px] font-medium text-gray-700">Cek Leads</span>
            </button>
            <button onClick={() => onNavigate('users')} className="flex flex-col items-center gap-1.5 p-3 bg-white rounded-xl border border-emerald-200 hover:shadow-sm transition-shadow">
              <UserPlus className="w-5 h-5 text-amber-600" />
              <span className="text-[10px] font-medium text-gray-700">Kelola User</span>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// LISTINGS TAB
// ═════════════════════════════════════════════════════════════════════════════

function ListingsTab({
  properties,
  search,
  setSearch,
  typeFilter,
  setTypeFilter,
  onAdd,
  onEdit,
  onDelete,
}: {
  properties: Property[]
  search: string
  setSearch: (v: string) => void
  typeFilter: string
  setTypeFilter: (v: string) => void
  onAdd: () => void
  onEdit: (p: Property) => void
  onDelete: (id: string, name: string) => void
}) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-lg text-gray-900">Listing Properti</h2>
          <p className="text-xs text-gray-500">{properties.length} properti</p>
        </div>
        <Button onClick={onAdd} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white h-9">
          <Plus className="w-4 h-4 mr-1" /> Tambah
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <Input
            placeholder="Cari properti..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-8 text-sm"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="h-9 w-28 text-sm">
            <SelectValue placeholder="Jenis" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua</SelectItem>
            {PROPERTY_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Property List */}
      {properties.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-12 text-center">
            <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Belum ada properti</p>
            <Button onClick={onAdd} variant="outline" size="sm" className="mt-3">
              <Plus className="w-4 h-4 mr-1" /> Tambah Properti
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {properties.map((property) => {
            const statusInfo = PROPERTY_STATUS_MAP[property.status] || PROPERTY_STATUS_MAP.active
            return (
              <Card key={property.id} className="border-0 shadow-sm overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex">
                    {/* Image */}
                    <div className="w-24 h-24 flex-shrink-0 bg-gray-100 relative">
                      <img src={property.image} alt={property.title} className="w-full h-full object-cover" />
                      {property.featured && (
                        <div className="absolute top-1 left-1">
                          <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                        </div>
                      )}
                    </div>
                    {/* Content */}
                    <div className="flex-1 p-3 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{property.title}</p>
                          <p className="text-[10px] text-gray-500 flex items-center gap-0.5 mt-0.5">
                            <MapPin className="w-2.5 h-2.5" /> {property.location}, {property.city}
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(property)}>
                              <Pencil className="w-3.5 h-3.5 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => onDelete(property.id, property.title)}>
                              <Trash2 className="w-3.5 h-3.5 mr-2" /> Hapus
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-xs font-bold text-emerald-600">{formatPrice(property.price)}</span>
                        <Badge className={`text-[9px] border ${statusInfo.bg} ${statusInfo.color}`}>{statusInfo.label}</Badge>
                        <Badge variant="outline" className="text-[9px]">{property.type}</Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400">
                        {property.bedrooms && <span>{property.bedrooms} KT</span>}
                        {property.bathrooms && <span>{property.bathrooms} KM</span>}
                        {property.landArea && <span>LT {property.landArea}m²</span>}
                        {property.buildingArea && <span>LB {property.buildingArea}m²</span>}
                        <span className="ml-auto">{property._count?.leads || 0} leads</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// LEADS TAB
// ═════════════════════════════════════════════════════════════════════════════

function LeadsTab({
  leads,
  statusFilter,
  setStatusFilter,
  onUpdateStatus,
  onDelete,
}: {
  leads: Lead[]
  statusFilter: string
  setStatusFilter: (v: string) => void
  onUpdateStatus: (id: string, status: string) => void
  onDelete: (id: string, name: string) => void
}) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div>
        <h2 className="font-bold text-lg text-gray-900">Leads Masuk</h2>
        <p className="text-xs text-gray-500">{leads.length} leads</p>
      </div>

      {/* Status Filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        <button
          onClick={() => setStatusFilter('')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
            !statusFilter ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Semua
        </button>
        {LEAD_STATUSES.map(status => {
          const info = LEAD_STATUS_MAP[status]
          return (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                statusFilter === status ? 'bg-emerald-600 text-white' : `${info.bg} ${info.color} hover:opacity-80`
              }`}
            >
              {info.label}
            </button>
          )
        })}
      </div>

      {/* Leads List */}
      {leads.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-12 text-center">
            <ClipboardList className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Belum ada leads</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {leads.map((lead) => {
            const statusInfo = LEAD_STATUS_MAP[lead.status] || LEAD_STATUS_MAP.new
            return (
              <Card key={lead.id} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-emerald-700">{lead.name.charAt(0).toUpperCase()}</span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900">{lead.name}</p>
                          <a
                            href={`https://wa.me/62${lead.whatsapp.replace(/^0/, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-emerald-600 hover:underline flex items-center gap-0.5"
                          >
                            <MessageCircle className="w-3 h-3" /> {lead.whatsapp}
                          </a>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {LEAD_STATUSES.filter(s => s !== lead.status).map(s => {
                              const info = LEAD_STATUS_MAP[s]
                              return (
                                <DropdownMenuItem key={s} onClick={() => onUpdateStatus(lead.id, s)}>
                                  <div className={`w-2 h-2 rounded-full ${info.bg} mr-2`} />
                                  Ubah ke {info.label}
                                </DropdownMenuItem>
                              )
                            })}
                            <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => onDelete(lead.id, lead.name)}>
                              <Trash2 className="w-3.5 h-3.5 mr-2" /> Hapus
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Lead details */}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {lead.propertyType && (
                          <Badge variant="outline" className="text-[10px] gap-0.5">
                            <Home className="w-2.5 h-2.5" /> {lead.propertyType}
                          </Badge>
                        )}
                        {lead.location && (
                          <Badge variant="outline" className="text-[10px] gap-0.5">
                            <MapPin className="w-2.5 h-2.5" /> {lead.location}
                          </Badge>
                        )}
                        {lead.dp && (
                          <Badge variant="outline" className="text-[10px] gap-0.5">
                            <Wallet className="w-2.5 h-2.5" /> DP: {lead.dp}
                          </Badge>
                        )}
                        {lead.promo && (
                          <Badge variant="outline" className="text-[10px] gap-0.5">
                            <Tag className="w-2.5 h-2.5" /> {lead.promo}
                          </Badge>
                        )}
                      </div>

                      {lead.property && (
                        <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-0.5">
                          <Building2 className="w-2.5 h-2.5" /> Minat: {lead.property.title}
                        </p>
                      )}

                      {lead.message && (
                        <p className="text-[11px] text-gray-500 mt-1.5 bg-gray-50 rounded-lg p-2 italic">
                          &quot;{lead.message}&quot;
                        </p>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] text-gray-400">{formatDate(lead.createdAt)}</span>
                        <Badge className={`text-[10px] border ${statusInfo.bg} ${statusInfo.color}`}>
                          {statusInfo.label}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// USERS TAB
// ═════════════════════════════════════════════════════════════════════════════

function UsersTab({
  users,
  search,
  setSearch,
  onAdd,
  onEdit,
  onDelete,
}: {
  users: User[]
  search: string
  setSearch: (v: string) => void
  onAdd: () => void
  onEdit: (u: User) => void
  onDelete: (id: string, name: string) => void
}) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-lg text-gray-900">Manajemen User</h2>
          <p className="text-xs text-gray-500">{users.length} user</p>
        </div>
        <Button onClick={onAdd} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white h-9">
          <UserPlus className="w-4 h-4 mr-1" /> Tambah
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
        <Input
          placeholder="Cari user..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 pl-8 text-sm"
        />
      </div>

      {/* Users List */}
      {users.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-12 text-center">
            <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Belum ada user</p>
            <Button onClick={onAdd} variant="outline" size="sm" className="mt-3">
              <UserPlus className="w-4 h-4 mr-1" /> Tambah User
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {users.map((user) => (
            <Card key={user.id} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    user.role === 'admin' ? 'bg-amber-100' : 'bg-emerald-100'
                  }`}>
                    <span className={`text-sm font-bold ${
                      user.role === 'admin' ? 'text-amber-700' : 'text-emerald-700'
                    }`}>{user.name.charAt(0).toUpperCase()}</span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                      <Badge className={`text-[9px] border ${
                        user.role === 'admin'
                          ? 'bg-amber-50 border-amber-200 text-amber-700'
                          : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      }`}>
                        {user.role === 'admin' ? 'Admin' : 'Agent'}
                      </Badge>
                      {!user.active && (
                        <Badge className="text-[9px] bg-red-50 border-red-200 text-red-700 border">Nonaktif</Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 flex items-center gap-1">
                      <Mail className="w-3 h-3" /> {user.email}
                    </p>
                    {user.whatsapp && (
                      <a
                        href={`https://wa.me/62${user.whatsapp.replace(/^0/, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-emerald-600 hover:underline flex items-center gap-0.5"
                      >
                        <MessageCircle className="w-2.5 h-2.5" /> {user.whatsapp}
                      </a>
                    )}
                  </div>

                  {/* Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(user)}>
                        <Pencil className="w-3.5 h-3.5 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => onDelete(user.id, user.name)}>
                        <Trash2 className="w-3.5 h-3.5 mr-2" /> Hapus
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// SEO TAB
// ═════════════════════════════════════════════════════════════════════════════

function SeoTab({
  seoForm,
  setSeoForm,
  onSave,
  saving,
  seoData,
}: {
  seoForm: {
    siteName: string; title: string; description: string; keywords: string
    ogImage: string; canonicalUrl: string; robots: string; googleVerification: string
  }
  setSeoForm: React.Dispatch<React.SetStateAction<{
    siteName: string; title: string; description: string; keywords: string
    ogImage: string; canonicalUrl: string; robots: string; googleVerification: string
  }>>
  onSave: () => void
  saving: boolean
  seoData: SeoData | null
}) {
  const titleCharCount = seoForm.title.length
  const descCharCount = seoForm.description.length
  const keywordsList = seoForm.keywords.split(",").map((k) => k.trim()).filter(Boolean)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-lg text-gray-900">Pengaturan SEO</h2>
          <p className="text-xs text-gray-500">Atur meta tags, Open Graph, dan indexing</p>
        </div>
        <Button onClick={onSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white h-9">
          {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
          Simpan
        </Button>
      </div>

      {/* Basic Meta Tags */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-bold flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-emerald-600" />
            Meta Tags Dasar
          </CardTitle>
          <CardDescription className="text-xs">Informasi dasar yang muncul di hasil pencarian Google</CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          <div>
            <Label className="text-xs font-semibold flex items-center gap-1">
              <Building2 className="w-3 h-3 text-emerald-600" /> Nama Situs
            </Label>
            <Input value={seoForm.siteName} onChange={(e) => setSeoForm((f) => ({ ...f, siteName: e.target.value }))} placeholder="PropMart" className="h-9 mt-1 text-sm" />
          </div>
          <div>
            <Label className="text-xs font-semibold flex items-center justify-between">
              <span className="flex items-center gap-1">
                <FileText className="w-3 h-3 text-emerald-600" /> Judul Halaman (Title Tag)
              </span>
              <span className={`text-[10px] font-normal ${titleCharCount > 60 ? "text-red-500" : titleCharCount > 50 ? "text-amber-500" : "text-gray-400"}`}>
                {titleCharCount}/60 karakter
              </span>
            </Label>
            <Input value={seoForm.title} onChange={(e) => setSeoForm((f) => ({ ...f, title: e.target.value }))} placeholder="PropMart - Temukan Properti Impian Anda" className="h-9 mt-1 text-sm" />
            {titleCharCount > 60 && <p className="text-[10px] text-red-500 mt-0.5">Judul terlalu panjang, Google akan memotong di 60 karakter</p>}
          </div>
          <div>
            <Label className="text-xs font-semibold flex items-center justify-between">
              <span className="flex items-center gap-1">
                <FileText className="w-3 h-3 text-emerald-600" /> Deskripsi (Meta Description)
              </span>
              <span className={`text-[10px] font-normal ${descCharCount > 160 ? "text-red-500" : descCharCount > 140 ? "text-amber-500" : "text-gray-400"}`}>
                {descCharCount}/160 karakter
              </span>
            </Label>
            <Textarea value={seoForm.description} onChange={(e) => setSeoForm((f) => ({ ...f, description: e.target.value }))} placeholder="Jual beli properti terpercaya di seluruh Indonesia..." className="mt-1 min-h-[80px] text-sm" />
            {descCharCount > 160 && <p className="text-[10px] text-red-500 mt-0.5">Deskripsi terlalu panjang, Google akan memotong di 160 karakter</p>}
          </div>
          <div>
            <Label className="text-xs font-semibold flex items-center gap-1">
              <Tag className="w-3 h-3 text-emerald-600" /> Keywords
            </Label>
            <Input value={seoForm.keywords} onChange={(e) => setSeoForm((f) => ({ ...f, keywords: e.target.value }))} placeholder="properti, rumah, apartemen, tanah, ruko" className="h-9 mt-1 text-sm" />
            <p className="text-[10px] text-gray-400 mt-0.5">Pisahkan dengan koma</p>
            {keywordsList.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {keywordsList.map((kw, i) => (
                  <Badge key={i} variant="outline" className="text-[10px] bg-emerald-50 border-emerald-200 text-emerald-700">{kw}</Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Open Graph / Social Media */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-bold flex items-center gap-1.5">
            <Share2 className="w-4 h-4 text-amber-600" />
            Open Graph & Social Media
          </CardTitle>
          <CardDescription className="text-xs">Tampilan saat link dibagikan di WhatsApp, Facebook, Twitter, dll</CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          <div>
            <Label className="text-xs font-semibold">OG Image URL</Label>
            <Input value={seoForm.ogImage} onChange={(e) => setSeoForm((f) => ({ ...f, ogImage: e.target.value }))} placeholder="/properties/hero-banner.png" className="h-9 mt-1 text-sm" />
            <p className="text-[10px] text-gray-400 mt-0.5">Rekomendasi: 1200x630px. Gunakan URL absolut untuk production</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
            <p className="text-[10px] font-semibold text-gray-500 mb-2 uppercase tracking-wider">Preview Social Share</p>
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              {seoForm.ogImage && (
                <div className="w-full h-28 bg-gray-100 overflow-hidden">
                  <img src={seoForm.ogImage} alt="OG Preview" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }} />
                </div>
              )}
              <div className="p-2.5">
                <p className="text-[10px] text-gray-400 uppercase">{seoForm.siteName || "propmart.id"}</p>
                <p className="text-xs font-semibold text-gray-900 line-clamp-2 mt-0.5">{seoForm.title || "Judul halaman"}</p>
                <p className="text-[11px] text-gray-500 line-clamp-2 mt-0.5">{seoForm.description || "Deskripsi halaman"}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Technical SEO */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-bold flex items-center gap-1.5">
            <Settings className="w-4 h-4 text-gray-600" />
            SEO Teknis
          </CardTitle>
          <CardDescription className="text-xs">Pengaturan indexing dan verifikasi mesin pencari</CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          <div>
            <Label className="text-xs font-semibold flex items-center gap-1">
              <ExternalLink className="w-3 h-3 text-gray-500" /> Canonical URL
            </Label>
            <Input value={seoForm.canonicalUrl} onChange={(e) => setSeoForm((f) => ({ ...f, canonicalUrl: e.target.value }))} placeholder="https://propmart.id" className="h-9 mt-1 text-sm" />
            <p className="text-[10px] text-gray-400 mt-0.5">URL utama website Anda (tanpa trailing slash)</p>
          </div>
          <div>
            <Label className="text-xs font-semibold">Robots Meta Tag</Label>
            <Select value={seoForm.robots} onValueChange={(v) => setSeoForm((f) => ({ ...f, robots: v }))}>
              <SelectTrigger className="h-9 mt-1 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="index, follow">Index, Follow (Direkomendasikan)</SelectItem>
                <SelectItem value="noindex, follow">NoIndex, Follow</SelectItem>
                <SelectItem value="index, nofollow">Index, NoFollow</SelectItem>
                <SelectItem value="noindex, nofollow">NoIndex, NoFollow</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-semibold flex items-center gap-1">
              <Search className="w-3 h-3 text-gray-500" /> Google Search Console Verification
            </Label>
            <Input value={seoForm.googleVerification} onChange={(e) => setSeoForm((f) => ({ ...f, googleVerification: e.target.value }))} placeholder="Kode verifikasi dari Google Search Console" className="h-9 mt-1 text-sm" />
            <p className="text-[10px] text-gray-400 mt-0.5">Meta tag verification code dari Google Search Console</p>
          </div>
        </CardContent>
      </Card>

      {/* SEO Score Preview */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-emerald-100/50">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-bold flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-emerald-600" />
            SEO Score Preview
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="space-y-2">
            {[
              { label: "Title Tag", ok: seoForm.title.length > 10 && seoForm.title.length <= 60, detail: seoForm.title.length > 60 ? "Terlalu panjang" : seoForm.title.length < 10 ? "Terlalu pendek" : "OK" },
              { label: "Meta Description", ok: seoForm.description.length > 50 && seoForm.description.length <= 160, detail: seoForm.description.length > 160 ? "Terlalu panjang" : seoForm.description.length < 50 ? "Terlalu pendek" : "OK" },
              { label: "Keywords", ok: keywordsList.length >= 3, detail: keywordsList.length < 3 ? "Minimal 3 keywords" : `${keywordsList.length} keywords` },
              { label: "OG Image", ok: !!seoForm.ogImage, detail: seoForm.ogImage ? "Sudah diatur" : "Belum diatur" },
              { label: "Canonical URL", ok: !!seoForm.canonicalUrl, detail: seoForm.canonicalUrl ? "Sudah diatur" : "Belum diatur" },
              { label: "Robots", ok: seoForm.robots === "index, follow", detail: seoForm.robots },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-1.5 px-2.5 bg-white rounded-lg border border-emerald-100">
                <span className="text-xs font-medium text-gray-700">{item.label}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-gray-400">{item.detail}</span>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${item.ok ? "bg-emerald-100" : "bg-amber-100"}`}>
                    {item.ok ? <Check className="w-3 h-3 text-emerald-600" /> : <AlertTriangle className="w-3 h-3 text-amber-600" />}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-gray-400 mt-2">Terakhir disimpan: {seoData?.updatedAt ? formatDate(seoData.updatedAt) : "Belum pernah"}</p>
        </CardContent>
      </Card>

      {/* Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900">Sitemap</p>
                <p className="text-[10px] text-gray-500 mt-0.5">Otomatis di-generate di /sitemap.xml</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                <Search className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900">Robots.txt</p>
                <p className="text-[10px] text-gray-500 mt-0.5">Otomatis di-generate di /robots.txt</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
