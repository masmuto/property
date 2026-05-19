'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home as HomeIcon,
  MapPin,
  Bed,
  Bath,
  Maximize,
  Building2,
  Star,
  Search,
  MessageCircle,
  Phone,
  Send,
  Loader2,
  Tag,
  Wallet,
  User,
  Hash,
  ArrowLeft,
  Calculator,
  Download,
  ChevronRight,
  Info,
  Clock,
  Percent,
  Share2,
  Shield,
  Car,
  Layers,
  ChevronLeft,
  LayoutGrid,
  Settings,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { toast } from 'sonner'
import dynamic from 'next/dynamic'

const AdminDashboard = dynamic(() => import('@/components/admin/AdminDashboard'), { ssr: false })

// ─── Types ───────────────────────────────────────────────────────────────────

interface Property {
  id: string
  title: string
  description: string
  price: number
  location: string
  city: string
  type: 'Rumah' | 'Apartemen' | 'Tanah' | 'Ruko'
  bedrooms: number | null
  bathrooms: number | null
  landArea: number | null
  buildingArea: number | null
  image: string
  featured: boolean
  createdAt: string
  _count: { leads: number }
}

type PropertyType = 'Semua' | 'Rumah' | 'Apartemen' | 'Tanah' | 'Ruko'
type BottomTab = 'home' | 'search' | 'admin'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatPrice(priceInJuta: number): string {
  if (priceInJuta >= 1000) {
    return `Rp ${(priceInJuta / 1000).toFixed(priceInJuta % 1000 === 0 ? 0 : 1)} Miliar`
  }
  return `Rp ${priceInJuta.toLocaleString('id-ID')} Juta`
}

function formatRupiah(amount: number): string {
  return `Rp ${Math.round(amount).toLocaleString('id-ID')}`
}

function calculateKPR(
  priceInJuta: number,
  dpPercent: number,
  tenorYears: number,
  annualRate: number
) {
  const priceRp = priceInJuta * 1_000_000
  const dpRp = priceRp * (dpPercent / 100)
  const loanAmount = priceRp - dpRp
  const monthlyRate = annualRate / 100 / 12
  const totalMonths = tenorYears * 12

  let monthlyPayment = 0
  if (monthlyRate > 0 && totalMonths > 0 && loanAmount > 0) {
    monthlyPayment =
      loanAmount *
      (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
      (Math.pow(1 + monthlyRate, totalMonths) - 1)
  }

  const totalPayment = monthlyPayment * totalMonths
  const totalInterest = totalPayment - loanAmount

  return { priceRp, dpRp, loanAmount, monthlyPayment, totalPayment, totalInterest }
}

function estimateKPRMonthly(priceInJuta: number): number {
  const result = calculateKPR(priceInJuta, 20, 20, 7.5)
  return result.monthlyPayment
}

const PROPERTY_TYPES: PropertyType[] = ['Semua', 'Rumah', 'Apartemen', 'Tanah', 'Ruko']

const JENIS_OPTIONS = [
  { value: 'Rumah', label: 'Rumah' },
  { value: 'Apartemen', label: 'Apartemen' },
  { value: 'Tanah', label: 'Tanah' },
  { value: 'Ruko', label: 'Ruko' },
]

const TENOR_OPTIONS = [
  { value: '5', label: '5 Tahun' },
  { value: '10', label: '10 Tahun' },
  { value: '15', label: '15 Tahun' },
  { value: '20', label: '20 Tahun' },
  { value: '25', label: '25 Tahun' },
  { value: '30', label: '30 Tahun' },
]

const DETAIL_FEATURES = [
  { key: 'bedrooms', icon: Bed, label: 'Kamar Tidur', shortLabel: 'KT' },
  { key: 'bathrooms', icon: Bath, label: 'Kamar Mandi', shortLabel: 'KM' },
  { key: 'landArea', icon: Maximize, label: 'Luas Tanah', shortLabel: 'LT', suffix: 'm²' },
  { key: 'buildingArea', icon: Building2, label: 'Luas Bangunan', shortLabel: 'LB', suffix: 'm²' },
] as const

// ─── Bottom Navigation Bar ──────────────────────────────────────────────────

function BottomNavBar({ activeTab, onTabChange }: { activeTab: BottomTab; onTabChange: (tab: BottomTab) => void }) {
  const tabs: { id: BottomTab; icon: typeof HomeIcon; label: string }[] = [
    { id: 'home', icon: HomeIcon, label: 'Beranda' },
    { id: 'search', icon: Search, label: 'Cari' },
    { id: 'admin', icon: Settings, label: 'Admin' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] safe-area-pb fixed-in-container">
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-all duration-200 ${
                isActive ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <div className={`relative ${isActive ? 'scale-110' : ''} transition-transform duration-200`}>
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : ''}`} />
                {isActive && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-600"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </div>
              <span className={`text-[10px] font-medium ${isActive ? 'text-emerald-600' : ''}`}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

// ─── Property Card ───────────────────────────────────────────────────────────

function PropertyCard({ property, onClick }: { property: Property; onClick: () => void }) {
  const kprMonthly = estimateKPRMonthly(property.price)

  return (
    <motion.button
      onClick={onClick}
      className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden text-left active:scale-[0.98] transition-transform"
      whileTap={{ scale: 0.98 }}
    >
      <div className="relative aspect-[16/10] bg-gray-100">
        <img src={property.image} alt={property.title} className="w-full h-full object-cover" />
        <div className="absolute top-2 left-2 flex gap-1.5">
          <Badge className="bg-emerald-600 text-white text-[10px] border-0 shadow-sm px-2 py-0.5">
            {property.type}
          </Badge>
          {property.featured && (
            <Badge className="bg-amber-500 text-white text-[10px] border-0 shadow-sm px-2 py-0.5">
              <Star className="w-2.5 h-2.5 mr-0.5 fill-white" /> Unggulan
            </Badge>
          )}
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 pt-8">
          <p className="text-white font-bold text-base leading-tight">{formatPrice(property.price)}</p>
        </div>
      </div>
      <div className="p-3">
        <h3 className="font-bold text-sm text-gray-900 truncate">{property.title}</h3>
        <div className="flex items-center gap-1 mt-1">
          <MapPin className="w-3 h-3 text-emerald-500 flex-shrink-0" />
          <span className="text-xs text-gray-500 truncate">{property.location}, {property.city}</span>
        </div>
        <div className="flex items-center gap-3 mt-2">
          {property.bedrooms !== null && (
            <div className="flex items-center gap-1 text-gray-500">
              <Bed className="w-3 h-3" />
              <span className="text-[11px]">{property.bedrooms}</span>
            </div>
          )}
          {property.bathrooms !== null && (
            <div className="flex items-center gap-1 text-gray-500">
              <Bath className="w-3 h-3" />
              <span className="text-[11px]">{property.bathrooms}</span>
            </div>
          )}
          {property.landArea !== null && (
            <div className="flex items-center gap-1 text-gray-500">
              <Maximize className="w-3 h-3" />
              <span className="text-[11px]">{property.landArea}m²</span>
            </div>
          )}
        </div>
        <div className="mt-2 inline-flex items-center gap-1 bg-emerald-50 rounded-md px-2 py-0.5">
          <Calculator className="w-3 h-3 text-emerald-600" />
          <span className="text-[10px] text-emerald-700 font-medium">
            KPR <span className="font-bold">{formatRupiah(kprMonthly)}</span>/bln
          </span>
        </div>
      </div>
    </motion.button>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function PropertyPage() {
  const [activeTab, setActiveTab] = useState<BottomTab>('home')
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeType, setActiveType] = useState<PropertyType>('Semua')

  // Search form state
  const [formJenis, setFormJenis] = useState('')
  const [formLokasi, setFormLokasi] = useState('')
  const [formDp, setFormDp] = useState('')
  const [formPromo, setFormPromo] = useState('')
  const [formNama, setFormNama] = useState('')
  const [formWhatsapp, setFormWhatsapp] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Property detail view
  const [detailProperty, setDetailProperty] = useState<Property | null>(null)
  const [showDetail, setShowDetail] = useState(false)

  // KPR simulation state
  const [kprDpPercent, setKprDpPercent] = useState(20)
  const [kprTenor, setKprTenor] = useState('20')
  const [kprRate, setKprRate] = useState('7.5')

  // Sheet state for contact
  const [sheetOpen, setSheetOpen] = useState(false)
  const [sheetNama, setSheetNama] = useState('')
  const [sheetWhatsapp, setSheetWhatsapp] = useState('')
  const [sheetSubmitting, setSheetSubmitting] = useState(false)

  // Brosur downloading
  const [downloadingBrosur, setDownloadingBrosur] = useState(false)

  // Image gallery state for detail view
  const [currentImageIdx, setCurrentImageIdx] = useState(0)

  const fetchProperties = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (activeType !== 'Semua') params.set('type', activeType)
      const res = await fetch(`/api/properties?${params.toString()}`)
      const data = await res.json()
      setProperties(data.properties || [])
    } catch {
      toast.error('Gagal memuat data properti')
    } finally {
      setLoading(false)
    }
  }, [search, activeType])

  useEffect(() => {
    fetchProperties()
  }, [fetchProperties])

  const featuredProperties = properties.filter((p) => p.featured)

  // KPR calculation
  const kprResult = useMemo(() => {
    if (!detailProperty) return null
    return calculateKPR(
      detailProperty.price,
      kprDpPercent,
      parseInt(kprTenor),
      parseFloat(kprRate) || 7.5
    )
  }, [detailProperty, kprDpPercent, kprTenor, kprRate])

  // Generate "gallery" images from the same property type
  const detailGalleryImages = useMemo(() => {
    if (!detailProperty) return []
    const sameType = properties.filter(p => p.type === detailProperty.type && p.id !== detailProperty.id)
    return [detailProperty.image, ...sameType.map(p => p.image)].slice(0, 4)
  }, [detailProperty, properties])

  // ─── Handlers ───────────────────────────────────────────────────────────
  const handleSearchSubmit = async () => {
    if (!formNama.trim()) { toast.error('Nama wajib diisi'); return }
    if (!formWhatsapp.trim()) { toast.error('Nomor WhatsApp wajib diisi'); return }

    setSubmitting(true)
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formNama.trim(),
          whatsapp: formWhatsapp.trim(),
          propertyType: formJenis || undefined,
          location: formLokasi.trim() || undefined,
          dp: formDp.trim() || undefined,
          promo: formPromo.trim() || undefined,
          message: `Pencarian: ${formJenis || 'Semua'} di ${formLokasi || 'Semua lokasi'}${formDp ? `, DP: ${formDp}` : ''}${formPromo ? `, Promo: ${formPromo}` : ''}`,
        }),
      })
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || 'Gagal mengirim') }
      toast.success('Terima kasih! Tim kami akan segera menghubungi Anda.', { duration: 5000 })
      setFormJenis(''); setFormLokasi(''); setFormDp(''); setFormPromo(''); setFormNama(''); setFormWhatsapp('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal mengirim pencarian')
    } finally { setSubmitting(false) }
  }

  const handleOpenDetail = (property: Property) => {
    setDetailProperty(property)
    setKprDpPercent(20)
    setKprTenor('20')
    setKprRate('7.5')
    setCurrentImageIdx(0)
    setShowDetail(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCloseDetail = () => {
    setShowDetail(false)
    setDetailProperty(null)
  }

  const handleOpenSheet = () => {
    setSheetNama('')
    setSheetWhatsapp('')
    setSheetOpen(true)
  }

  const handleSheetSubmit = async () => {
    if (!detailProperty) return
    if (!sheetNama.trim()) { toast.error('Nama wajib diisi'); return }
    if (!sheetWhatsapp.trim()) { toast.error('Nomor WhatsApp wajib diisi'); return }

    setSheetSubmitting(true)
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: sheetNama.trim(),
          whatsapp: sheetWhatsapp.trim(),
          propertyId: detailProperty.id,
          propertyType: detailProperty.type,
          location: detailProperty.location,
        }),
      })
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || 'Gagal mengirim') }
      toast.success('Pesan berhasil dikirim! Kami akan segera menghubungi Anda.')
      setSheetOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal mengirim pesan')
    } finally { setSheetSubmitting(false) }
  }

  const handleDownloadBrosur = async () => {
    if (!detailProperty) return
    setDownloadingBrosur(true)
    try {
      const res = await fetch(`/api/brosur?id=${detailProperty.id}`)
      if (!res.ok) throw new Error('Gagal membuat brosur')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `brosur-${detailProperty.title.replace(/\s+/g, '-').toLowerCase()}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      toast.success('Brosur berhasil diunduh!')
    } catch {
      toast.error('Gagal mengunduh brosur')
    } finally {
      setDownloadingBrosur(false)
    }
  }

  const handleShare = async () => {
    if (!detailProperty) return
    const text = `${detailProperty.title} - ${formatPrice(detailProperty.price)}\n${detailProperty.location}, ${detailProperty.city}\n\nLihat di PropMart!`
    if (navigator.share) {
      try {
        await navigator.share({ title: detailProperty.title, text })
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(text)
      toast.success('Link disalin ke clipboard!')
    }
  }

  // ─── Render ─────────────────────────────────────────────────────────────

  // ═══════════════════════════════════════════════════════════════════════════
  // ADMIN TAB (via bottom nav)
  // ═══════════════════════════════════════════════════════════════════════════
  if (activeTab === 'admin') {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <AdminDashboard onBack={() => setActiveTab('home')} />
        <BottomNavBar activeTab={activeTab} onTabChange={setActiveTab} />
        {/* Spacer for bottom nav */}
        <div className="h-16" />
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PROPERTY DETAIL VIEW (overlay)
  // ═══════════════════════════════════════════════════════════════════════════
  if (showDetail && detailProperty) {
    const kprMonthlyEstimate = estimateKPRMonthly(detailProperty.price)

    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        {/* Detail Header */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm fixed-in-container">
          <div className="flex items-center justify-between px-4 h-14">
            <button
              onClick={handleCloseDetail}
              className="flex items-center gap-1.5 text-gray-700 hover:text-emerald-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Kembali</span>
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                aria-label="Bagikan"
              >
                <Share2 className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={handleDownloadBrosur}
                disabled={downloadingBrosur}
                className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
              >
                {downloadingBrosur ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                Brosur
              </button>
              <a
                href="https://wa.me/6281234567890"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center hover:bg-emerald-100 transition-colors"
              >
                <MessageCircle className="w-5 h-5 text-emerald-600" />
              </a>
            </div>
          </div>
        </header>

        <main className="mt-14 flex-1 pb-24">
          {/* ─── Image Gallery ─────────────────────────────────────────────── */}
          <div className="relative w-full aspect-[4/3] overflow-hidden bg-gray-100">
            <AnimatePresence mode="wait">
              <motion.img
                key={currentImageIdx}
                src={detailGalleryImages[currentImageIdx] || detailProperty.image}
                alt={detailProperty.title}
                className="w-full h-full object-cover"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              />
            </AnimatePresence>

            {/* Gallery nav arrows */}
            {detailGalleryImages.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentImageIdx(prev => prev === 0 ? detailGalleryImages.length - 1 : prev - 1)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 backdrop-blur flex items-center justify-center hover:bg-black/60 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-white" />
                </button>
                <button
                  onClick={() => setCurrentImageIdx(prev => (prev + 1) % detailGalleryImages.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 backdrop-blur flex items-center justify-center hover:bg-black/60 transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-white rotate-180" />
                </button>
                {/* Dots */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {detailGalleryImages.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIdx(idx)}
                      className={`w-2 h-2 rounded-full transition-all ${idx === currentImageIdx ? 'bg-white w-5' : 'bg-white/50'}`}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Badges */}
            <div className="absolute top-3 left-3 flex gap-2">
              <Badge className="bg-emerald-600 text-white text-xs border-0 shadow-md">
                {detailProperty.type}
              </Badge>
              {detailProperty.featured && (
                <Badge className="bg-amber-500 text-white text-xs border-0 shadow-md">
                  <Star className="w-3 h-3 mr-0.5 fill-white" /> Unggulan
                </Badge>
              )}
            </div>
          </div>

          {/* ─── Thumbnail Strip ──────────────────────────────────────────── */}
          {detailGalleryImages.length > 1 && (
            <div className="px-4 mt-3 flex gap-2 overflow-x-auto scrollbar-hide">
              {detailGalleryImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImageIdx(idx)}
                  className={`flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                    idx === currentImageIdx ? 'border-emerald-500 shadow-sm' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* ─── Info Card ────────────────────────────────────────────────── */}
          <div className="px-4 mt-3 relative z-10">
            <div className="bg-white rounded-2xl shadow-lg p-4 border border-gray-100">
              <h1 className="text-lg font-bold text-gray-900 leading-snug">
                {detailProperty.title}
              </h1>
              <div className="flex items-center gap-1 mt-1.5 text-gray-500">
                <MapPin className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                <span className="text-sm">{detailProperty.location}, {detailProperty.city}</span>
              </div>
              <p className="text-emerald-600 font-bold text-xl mt-2">
                {formatPrice(detailProperty.price)}
              </p>
              <div className="mt-2 inline-flex items-center gap-1.5 bg-emerald-50 rounded-lg px-2.5 py-1">
                <Calculator className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-xs text-emerald-700 font-medium">
                  KPR mulai <span className="font-bold">{formatRupiah(kprMonthlyEstimate)}</span>/bln
                </span>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-4 gap-2 mt-4">
                {DETAIL_FEATURES.map((feat) => {
                  const val = detailProperty[feat.key as keyof Property] as number | null
                  if (val === null) return null
                  const Icon = feat.icon
                  return (
                    <div key={feat.key} className="flex flex-col items-center gap-1 p-2 bg-gray-50 rounded-xl">
                      <Icon className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold text-gray-900">{val}</span>
                      <span className="text-[10px] text-gray-500">{feat.shortLabel}{feat.suffix ? ` ${feat.suffix}` : ''}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="px-4 mt-4 space-y-4">
            {/* ─── Description ────────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
              <h2 className="font-bold text-sm text-gray-900 mb-2">Deskripsi</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                {detailProperty.description}
              </p>
            </div>

            {/* ─── Detail Spesifikasi ─────────────────────────────────────── */}
            <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
              <h2 className="font-bold text-sm text-gray-900 mb-3">Spesifikasi</h2>
              <div className="space-y-2">
                {[
                  { label: 'Jenis Properti', value: detailProperty.type },
                  { label: 'Lokasi', value: `${detailProperty.location}, ${detailProperty.city}` },
                  ...(detailProperty.bedrooms !== null ? [{ label: 'Kamar Tidur', value: `${detailProperty.bedrooms}` }] : []),
                  ...(detailProperty.bathrooms !== null ? [{ label: 'Kamar Mandi', value: `${detailProperty.bathrooms}` }] : []),
                  ...(detailProperty.landArea !== null ? [{ label: 'Luas Tanah', value: `${detailProperty.landArea} m²` }] : []),
                  ...(detailProperty.buildingArea !== null ? [{ label: 'Luas Bangunan', value: `${detailProperty.buildingArea} m²` }] : []),
                  { label: 'Sertifikat', value: 'SHM' },
                  { label: 'Akses Jalan', value: 'Lebar (>6m)' },
                ].map((item, i) => (
                  <div key={i} className={`flex justify-between items-center py-2 ${i > 0 ? 'border-t border-gray-100' : ''}`}>
                    <span className="text-xs text-gray-500">{item.label}</span>
                    <span className="text-xs font-semibold text-gray-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ─── KPR Simulation ────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Calculator className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <h2 className="font-bold text-sm text-gray-900">Simulasi KPR</h2>
                  <p className="text-[10px] text-gray-500">Hitung perkiraan angsuran bulanan</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-xs font-semibold text-gray-700 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Wallet className="w-3 h-3 text-emerald-600" />
                      Uang Muka (DP)
                    </span>
                    <span className="text-emerald-600 font-bold">{kprDpPercent}% — {formatRupiah(kprResult?.dpRp || 0)}</span>
                  </Label>
                  <input
                    type="range"
                    min={10}
                    max={50}
                    step={5}
                    value={kprDpPercent}
                    onChange={(e) => setKprDpPercent(parseInt(e.target.value))}
                    className="w-full h-2 bg-emerald-100 rounded-lg appearance-none cursor-pointer accent-emerald-600 mt-1"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                    <span>10%</span><span>20%</span><span>30%</span><span>40%</span><span>50%</span>
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-emerald-600" />
                    Tenor
                  </Label>
                  <Select value={kprTenor} onValueChange={setKprTenor}>
                    <SelectTrigger className="w-full h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TENOR_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                    <Percent className="w-3 h-3 text-emerald-600" />
                    Suku Bunga / Tahun
                  </Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={kprRate}
                    onChange={(e) => setKprRate(e.target.value)}
                    className="h-9 text-sm"
                    placeholder="7.5"
                  />
                </div>
              </div>

              {kprResult && (
                <div className="mt-4 bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl p-3 border border-emerald-200">
                  <div className="text-center mb-3 pb-3 border-b border-emerald-200">
                    <p className="text-[10px] text-emerald-600 font-medium uppercase tracking-wider">Angsuran per Bulan</p>
                    <p className="text-2xl font-bold text-emerald-700 mt-0.5">
                      {formatRupiah(kprResult.monthlyPayment)}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Harga Properti</span>
                      <span className="font-medium text-gray-900">{formatRupiah(kprResult.priceRp)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Uang Muka ({kprDpPercent}%)</span>
                      <span className="font-medium text-gray-900">{formatRupiah(kprResult.dpRp)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Jumlah Pinjaman</span>
                      <span className="font-medium text-gray-900">{formatRupiah(kprResult.loanAmount)}</span>
                    </div>
                    <Separator className="!my-1.5" />
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Total Pembayaran</span>
                      <span className="font-medium text-gray-900">{formatRupiah(kprResult.totalPayment)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Total Bunga</span>
                      <span className="font-medium text-red-500">{formatRupiah(kprResult.totalInterest)}</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2 flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    Simulasi bersifat estimasi. Hubungi bank untuk kalkulasi akurat.
                  </p>
                </div>
              )}
            </div>

            {/* ─── Download Brosur ────────────────────────────────────────── */}
            <button
              onClick={handleDownloadBrosur}
              disabled={downloadingBrosur}
              className="w-full flex items-center justify-between bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-2xl p-4 transition-colors disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center">
                  {downloadingBrosur ? (
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  ) : (
                    <Download className="w-5 h-5 text-white" />
                  )}
                </div>
                <div className="text-left">
                  <p className="font-bold text-sm text-gray-900">Download Brosur</p>
                  <p className="text-[10px] text-gray-500">PDF berisi info lengkap & simulasi KPR</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-amber-500" />
            </button>

            {/* ─── Trust Badges ───────────────────────────────────────────── */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: Shield, label: 'Legalitas Aman', color: 'text-emerald-500' },
                { icon: Car, label: 'Akses Mudah', color: 'text-amber-500' },
                { icon: Layers, label: 'SHM Sertifikat', color: 'text-sky-500' },
              ].map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.label} className="bg-white rounded-xl border border-gray-100 p-3 flex flex-col items-center gap-1.5 text-center">
                    <Icon className={`w-5 h-5 ${item.color}`} />
                    <span className="text-[10px] font-medium text-gray-600">{item.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </main>

        {/* Fixed Bottom CTA (replaces bottom nav on detail) */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-[0_-4px_12px_rgba(0,0,0,0.1)] p-3 z-50 safe-area-pb fixed-in-container">
          <div className="flex gap-2">
            <Button
              onClick={handleDownloadBrosur}
              disabled={downloadingBrosur}
              variant="outline"
              className="flex-1 border-amber-500 text-amber-600 hover:bg-amber-50 h-11 rounded-xl text-sm font-bold"
            >
              <Download className="w-4 h-4 mr-1.5" />
              Brosur
            </Button>
            <Button
              onClick={handleOpenSheet}
              className="flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white h-11 rounded-xl text-sm font-bold shadow-lg shadow-emerald-200"
            >
              <Phone className="w-4 h-4 mr-1.5" />
              Hubungi Sekarang
            </Button>
          </div>
        </div>

        {/* Contact Sheet */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto max-w-[430px] mx-auto left-1/2 -translate-x-1/2 right-auto">
            <SheetHeader className="text-left">
              <SheetTitle className="text-lg">Hubungi Pemilik Properti</SheetTitle>
              <SheetDescription className="text-sm text-gray-500">
                Isi formulir di bawah untuk menghubungi pemilik properti
              </SheetDescription>
            </SheetHeader>
            <div className="px-4 pb-4 space-y-4">
              <div className="bg-emerald-50 rounded-xl p-3 flex gap-3">
                <div className="w-20 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                  <img src={detailProperty.image} alt={detailProperty.title} className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-sm text-gray-900 truncate">{detailProperty.title}</h4>
                  <p className="text-emerald-700 font-bold text-sm">{formatPrice(detailProperty.price)}</p>
                  <div className="flex items-center gap-1 text-gray-500 mt-0.5">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    <span className="text-xs truncate">{detailProperty.location}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1">
                    <User className="w-3 h-3" /> Nama <span className="text-red-500">*</span>
                  </Label>
                  <Input placeholder="Masukkan nama Anda" value={sheetNama} onChange={(e) => setSheetNama(e.target.value)} className="h-11" />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1">
                    <Hash className="w-3 h-3" /> Nomor WhatsApp <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex">
                    <div className="flex items-center px-3 bg-gray-100 border border-r-0 rounded-l-md text-sm text-gray-600 font-medium">+62</div>
                    <Input placeholder="8123456789" value={sheetWhatsapp} onChange={(e) => setSheetWhatsapp(e.target.value.replace(/\D/g, ''))} className="h-11 rounded-l-none" type="tel" />
                  </div>
                </div>
              </div>
              <Button onClick={handleSheetSubmit} disabled={sheetSubmitting} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12 rounded-lg text-base font-semibold">
                {sheetSubmitting ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Mengirim...</>) : (<><Send className="w-4 h-4 mr-2" />Kirim</>)}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HOME TAB
  // ═══════════════════════════════════════════════════════════════════════════
  if (activeTab === 'home') {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-white shadow-sm">
          <div className="flex items-center justify-between px-4 h-14">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
                <HomeIcon className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg text-gray-900">
                Prop<span className="text-emerald-600">Mart</span>
              </span>
            </div>
            <a href="https://wa.me/6281234567890" target="_blank" rel="noopener noreferrer"
              className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center hover:bg-emerald-100 transition-colors" aria-label="WhatsApp">
              <MessageCircle className="w-5 h-5 text-emerald-600" />
            </a>
          </div>
        </header>

        <main className="flex-1 pb-20">
          {/* Hero Banner */}
          <div className="relative w-full h-[160px] overflow-hidden">
            <img src="/properties/hero-banner.png" alt="Hero" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-emerald-900/80" />
            <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 text-center">
              <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
                className="text-xl font-bold text-white leading-tight mb-1">
                Temukan Properti Impian Anda
              </motion.h1>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.1 }}
                className="text-xs text-white/80">Jual beli properti terpercaya di seluruh Indonesia</motion.p>
            </div>
          </div>

          {/* Type Filter Chips */}
          <div className="px-4 mt-4">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {PROPERTY_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => setActiveType(type)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                    activeType === type
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200'
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-emerald-300 hover:text-emerald-600'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Search Bar */}
          <div className="px-4 mt-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Cari properti..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10 bg-white border-gray-200 rounded-xl text-sm"
              />
            </div>
          </div>

          {/* Featured Properties Carousel */}
          {featuredProperties.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between px-4 mb-2">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <h2 className="font-bold text-sm text-gray-900">Properti Unggulan</h2>
                </div>
              </div>
              <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 pb-2">
                {featuredProperties.map((property) => (
                  <motion.button
                    key={property.id}
                    onClick={() => handleOpenDetail(property)}
                    className="flex-shrink-0 w-[260px] bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden text-left active:scale-[0.98] transition-transform"
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="relative aspect-[16/10] bg-gray-100">
                      <img src={property.image} alt={property.title} className="w-full h-full object-cover" />
                      <Badge className="absolute top-2 left-2 bg-amber-500 text-white text-[10px] border-0 shadow-sm px-2 py-0.5">
                        <Star className="w-2.5 h-2.5 mr-0.5 fill-white" /> Unggulan
                      </Badge>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2.5 pt-6">
                        <p className="text-white font-bold text-sm">{formatPrice(property.price)}</p>
                      </div>
                    </div>
                    <div className="p-2.5">
                      <h3 className="font-bold text-xs text-gray-900 truncate">{property.title}</h3>
                      <div className="flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                        <span className="text-[10px] text-gray-500 truncate">{property.location}</span>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* All Properties Grid */}
          <div className="px-4 mt-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-sm text-gray-900">Semua Properti</h2>
              <span className="text-xs text-gray-500">{properties.length} listing</span>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100">
                    <Skeleton className="aspect-[16/10]" />
                    <div className="p-3 space-y-2">
                      <Skeleton className="h-3 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : properties.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">Belum ada properti</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {properties.map((property) => (
                  <PropertyCard key={property.id} property={property} onClick={() => handleOpenDetail(property)} />
                ))}
              </div>
            )}
          </div>
        </main>

        <BottomNavBar activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SEARCH TAB
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white shadow-sm">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
              <HomeIcon className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg text-gray-900">
              Prop<span className="text-emerald-600">Mart</span>
            </span>
          </div>
          <a href="https://wa.me/6281234567890" target="_blank" rel="noopener noreferrer"
            className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center hover:bg-emerald-100 transition-colors" aria-label="WhatsApp">
            <MessageCircle className="w-5 h-5 text-emerald-600" />
          </a>
        </div>
      </header>

      <main className="flex-1 pb-20">
        {/* Search Form */}
        <div className="px-4 pt-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Search className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="font-bold text-base text-gray-900">Cari Properti</h2>
                <p className="text-xs text-gray-500">Isi form untuk mulai pencarian</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                  <HomeIcon className="w-3 h-3 text-emerald-600" /> Jenis Properti
                </Label>
                <Select value={formJenis} onValueChange={setFormJenis}>
                  <SelectTrigger className="w-full h-11 text-sm mt-1">
                    <SelectValue placeholder="Pilih jenis properti" />
                  </SelectTrigger>
                  <SelectContent>
                    {JENIS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-emerald-600" /> Lokasi
                </Label>
                <Input
                  placeholder="Jakarta, BSD, Bali..."
                  value={formLokasi}
                  onChange={(e) => setFormLokasi(e.target.value)}
                  className="h-11 text-sm mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                    <Wallet className="w-3 h-3 text-emerald-600" /> DP / Uang Muka
                  </Label>
                  <Input
                    placeholder="50 Juta"
                    value={formDp}
                    onChange={(e) => setFormDp(e.target.value)}
                    className="h-11 text-sm mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                    <Tag className="w-3 h-3 text-emerald-600" /> Promo
                  </Label>
                  <Input
                    placeholder="Kode promo"
                    value={formPromo}
                    onChange={(e) => setFormPromo(e.target.value)}
                    className="h-11 text-sm mt-1"
                  />
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                  <User className="w-3 h-3 text-emerald-600" /> Nama <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="Nama lengkap Anda"
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  className="h-11 text-sm mt-1"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                  <Hash className="w-3 h-3 text-emerald-600" /> No WhatsApp <span className="text-red-500">*</span>
                </Label>
                <div className="flex mt-1">
                  <div className="flex items-center px-3 bg-gray-100 border border-r-0 rounded-l-xl text-sm text-gray-600 font-semibold h-11">+62</div>
                  <Input
                    placeholder="8123456789"
                    value={formWhatsapp}
                    onChange={(e) => setFormWhatsapp(e.target.value.replace(/\D/g, ''))}
                    className="h-11 text-sm rounded-l-none rounded-r-xl"
                    type="tel"
                  />
                </div>
              </div>

              <Button
                onClick={handleSearchSubmit}
                disabled={submitting}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12 rounded-xl text-sm font-bold shadow-lg shadow-emerald-200"
              >
                {submitting ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Mengirim...</>
                ) : (
                  <><Send className="w-4 h-4 mr-2" />Kirim Pencarian</>
                )}
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Search Results */}
        {properties.length > 0 && (
          <div className="px-4 mt-6">
            <h3 className="font-bold text-sm text-gray-900 mb-3">Rekomendasi Properti</h3>
            <div className="space-y-3">
              {properties.slice(0, 6).map((property) => (
                <motion.button
                  key={property.id}
                  onClick={() => handleOpenDetail(property)}
                  className="w-full flex gap-3 bg-white rounded-2xl shadow-sm border border-gray-100 p-3 text-left active:scale-[0.99] transition-transform"
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="w-24 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                    <img src={property.image} alt={property.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-gray-900 truncate">{property.title}</h4>
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                      <span className="text-xs text-gray-500 truncate">{property.location}, {property.city}</span>
                    </div>
                    <p className="text-emerald-600 font-bold text-sm mt-1">{formatPrice(property.price)}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {property.bedrooms !== null && (
                        <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                          <Bed className="w-3 h-3" /> {property.bedrooms}
                        </span>
                      )}
                      {property.bathrooms !== null && (
                        <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                          <Bath className="w-3 h-3" /> {property.bathrooms}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 self-center flex-shrink-0" />
                </motion.button>
              ))}
            </div>
          </div>
        )}
      </main>

      <BottomNavBar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}
