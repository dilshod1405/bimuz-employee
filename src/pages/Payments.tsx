import { useState, useEffect } from "react"
import type { FormEvent } from "react"
import { Eye, Search, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, X } from "lucide-react"
import { api, type Invoice, type ApiError } from "@/lib/api"
import { useAuthStore } from "@/stores/authStore"
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card"
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

export default function Payments() {
  const user = useAuthStore((state) => state.user)
  const { toast } = useToast()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentSearchTerm, setCurrentSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [ordering, setOrdering] = useState<string>("-amount")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const canRead = !!user // Any authenticated employee can read

  useEffect(() => {
    if (canRead) {
      // Convert "all" to empty string for API
      const apiStatus = statusFilter === "all" ? "" : statusFilter
      loadInvoices(currentPage, currentSearchTerm, apiStatus, ordering)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canRead, currentPage, currentSearchTerm, statusFilter, ordering])

  const loadInvoices = async (page: number = 1, search: string = "", status: string = "", order: string = "-amount") => {
    try {
      setLoading(true)
      const response = await api.getInvoices(search, status, order, page)

      let invoicesList: Invoice[] = []
      if (response.results && Array.isArray(response.results)) {
        invoicesList = response.results
        // Calculate total pages from count
        const count = response.count || 0
        setTotalCount(count)
        setTotalPages(Math.ceil(count / 30))
      } else if (response.data && Array.isArray(response.data)) {
        invoicesList = response.data
      }

      setInvoices(invoicesList)
    } catch (err) {
      const apiError = err as ApiError & { status?: number }
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: apiError.message || "To'lovlarni yuklashda xatolik yuz berdi",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: FormEvent) => {
    e.preventDefault()
    setCurrentSearchTerm(searchQuery)
    setCurrentPage(1) // Reset to first page on search
  }

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch(e)
    }
  }

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value)
    setCurrentPage(1) // Reset to first page on filter change
  }

  const handleOrderingChange = (value: string) => {
    setOrdering(value)
    setCurrentPage(1) // Reset to first page on sort change
  }

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleClearFilters = () => {
    setSearchQuery("")
    setCurrentSearchTerm("")
    setStatusFilter("all")
    setOrdering("-amount")
    setCurrentPage(1)
  }

  const hasActiveFilters = currentSearchTerm || statusFilter !== "all" || ordering !== "-amount"

  const formatPrice = (price: string) => {
    const numPrice = parseFloat(price)
    return new Intl.NumberFormat('uz-UZ').format(numPrice)
  }

  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      'created': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
      'pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'paid': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'cancelled': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'refunded': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'expired': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    }
    return statusColors[status] || statusColors['created']
  }

  if (!canRead) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Sizda bu sahifani ko'rish uchun ruxsat yo'q.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">To'lovlar</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Qidirish (Ism, Telefon, Guruh, ID)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleSearchKeyPress}
                  className="pl-9"
                />
              </div>
              <Button type="submit" disabled={loading}>
                <Search className="h-4 w-4" />
                Qidirish
              </Button>
            </form>

            {/* Filter and Sort */}
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearFilters}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Filterni tozalash
                </Button>
              )}
              <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Holat bo'yicha" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barcha holatlar</SelectItem>
                  <SelectItem value="created">Yaratilgan</SelectItem>
                  <SelectItem value="pending">To'lov kutilmoqda</SelectItem>
                  <SelectItem value="paid">To'langan</SelectItem>
                  <SelectItem value="cancelled">Bekor qilingan</SelectItem>
                  <SelectItem value="refunded">Qaytarilgan</SelectItem>
                  <SelectItem value="expired">Muddati o'tgan</SelectItem>
                </SelectContent>
              </Select>

              <Select value={ordering} onValueChange={handleOrderingChange}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Tartiblash" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="-amount">
                    <div className="flex items-center gap-2">
                      <span>Summa</span>
                      <ArrowDown className="h-3 w-3" />
                    </div>
                  </SelectItem>
                  <SelectItem value="amount">
                    <div className="flex items-center gap-2">
                      <span>Summa</span>
                      <ArrowUp className="h-3 w-3" />
                    </div>
                  </SelectItem>
                  <SelectItem value="-payment_time">
                    <div className="flex items-center gap-2">
                      <span>To'lov vaqti</span>
                      <ArrowDown className="h-3 w-3" />
                    </div>
                  </SelectItem>
                  <SelectItem value="payment_time">
                    <div className="flex items-center gap-2">
                      <span>To'lov vaqti</span>
                      <ArrowUp className="h-3 w-3" />
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-4 p-6">
              <div className="h-12 bg-muted animate-pulse rounded" />
              <div className="h-12 bg-muted animate-pulse rounded" />
              <div className="h-12 bg-muted animate-pulse rounded" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left text-sm font-medium">ID</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Talaba</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Telefon</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Guruh</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Summa</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Holat</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">To'lov vaqti</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Yaratilgan</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                        To'lovlar topilmadi
                      </td>
                    </tr>
                  ) : (
                    invoices.map((invoice) => (
                      <tr 
                        key={invoice.id} 
                        className="border-b hover:bg-muted/50 cursor-pointer"
                        onClick={() => {
                          setSelectedInvoice(invoice)
                          setIsDetailOpen(true)
                        }}
                      >
                        <td className="px-4 py-3 text-sm font-medium">#{invoice.id}</td>
                        <td className="px-4 py-3 text-sm font-medium">{invoice.student_name}</td>
                        <td className="px-4 py-3 text-sm">{invoice.student_phone}</td>
                        <td className="px-4 py-3 text-sm">{invoice.group_name}</td>
                        <td className="px-4 py-3 text-sm">{formatPrice(invoice.amount)} so'm</td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(invoice.status)}`}
                          >
                            {invoice.status_display}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {invoice.payment_time
                            ? new Date(invoice.payment_time).toLocaleString('uz-UZ')
                            : "-"}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {new Date(invoice.created_at).toLocaleDateString('uz-UZ')}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedInvoice(invoice)
                              setIsDetailOpen(true)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && invoices.length > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t">
              <div className="text-sm text-muted-foreground">
                {totalCount > 0 ? (
                  <>
                    {((currentPage - 1) * 30) + 1} - {Math.min(currentPage * 30, totalCount)} dan {totalCount} ta
                  </>
                ) : (
                  "Ma'lumot yo'q"
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || loading}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages || loading}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto p-0">
          {selectedInvoice && (
            <div className="flex flex-col h-full">
              {/* Document Header */}
              <div className="border-b px-6 py-4 bg-muted/30">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xl font-bold">TO'LOV HUJJATI</h2>
                  <span className="text-xs text-muted-foreground">№{selectedInvoice.id}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Holat:</span>
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(selectedInvoice.status)}`}
                  >
                    {selectedInvoice.status_display}
                  </span>
                </div>
              </div>

              {/* Document Content */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                <div className="space-y-6">
                  {/* Talaba ma'lumotlari */}
                  <div className="border-b pb-3">
                    <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Talaba ma'lumotlari</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-start py-1">
                        <span className="text-xs text-muted-foreground">To'liq ismi:</span>
                        <span className="text-xs font-medium text-right max-w-[65%]">{selectedInvoice.student_name}</span>
                      </div>
                      <div className="flex justify-between items-start py-1">
                        <span className="text-xs text-muted-foreground">Telefon:</span>
                        <span className="text-xs font-medium text-right">{selectedInvoice.student_phone}</span>
                      </div>
                      <div className="flex justify-between items-start py-1">
                        <span className="text-xs text-muted-foreground">Talaba ID:</span>
                        <span className="text-xs font-medium text-right">#{selectedInvoice.student}</span>
                      </div>
                    </div>
                  </div>

                  {/* Guruh ma'lumotlari */}
                  <div className="border-b pb-3">
                    <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Guruh ma'lumotlari</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-start py-1">
                        <span className="text-xs text-muted-foreground">Guruh:</span>
                        <span className="text-xs font-medium text-right max-w-[65%]">{selectedInvoice.group_name}</span>
                      </div>
                      <div className="flex justify-between items-start py-1">
                        <span className="text-xs text-muted-foreground">Guruh ID:</span>
                        <span className="text-xs font-medium text-right">#{selectedInvoice.group}</span>
                      </div>
                    </div>
                  </div>

                  {/* To'lov ma'lumotlari */}
                  <div className="border-b pb-3">
                    <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">To'lov ma'lumotlari</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-start py-1">
                        <span className="text-xs text-muted-foreground">To'lov summasi:</span>
                        <span className="text-sm font-bold text-right">{formatPrice(selectedInvoice.amount)} so'm</span>
                      </div>
                      <div className="flex justify-between items-start py-1">
                        <span className="text-xs text-muted-foreground">To'lov holati:</span>
                        <span className="text-xs font-medium text-right">{selectedInvoice.is_paid ? "To'langan" : "To'lanmagan"}</span>
                      </div>
                      <div className="flex justify-between items-start py-1">
                        <span className="text-xs text-muted-foreground">To'lov usuli:</span>
                        <span className="text-xs font-medium text-right">{selectedInvoice.payment_method || "-"}</span>
                      </div>
                      <div className="flex justify-between items-start py-1">
                        <span className="text-xs text-muted-foreground">Karta raqami:</span>
                        <span className="text-xs font-mono font-medium text-right">{selectedInvoice.card_pan || "-"}</span>
                      </div>
                      <div className="flex justify-between items-start py-1">
                        <span className="text-xs text-muted-foreground">To'lov vaqti:</span>
                        <span className="text-xs font-medium text-right max-w-[65%]">
                          {selectedInvoice.payment_time
                            ? new Date(selectedInvoice.payment_time).toLocaleString('uz-UZ')
                            : "-"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Multicard ma'lumotlari */}
                  <div className="border-b pb-3">
                    <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Multicard ma'lumotlari</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-start py-1">
                        <span className="text-xs text-muted-foreground">UUID:</span>
                        <span className="text-xs font-mono font-medium text-right break-all max-w-[65%]">{selectedInvoice.multicard_uuid || "-"}</span>
                      </div>
                      <div className="flex justify-between items-start py-1">
                        <span className="text-xs text-muted-foreground">Invoice ID:</span>
                        <span className="text-xs font-mono font-medium text-right">{selectedInvoice.multicard_invoice_id || "-"}</span>
                      </div>
                      <div className="flex justify-between items-start py-1 gap-2">
                        <span className="text-xs text-muted-foreground">Checkout URL:</span>
                        {selectedInvoice.checkout_url ? (
                          <a
                            href={selectedInvoice.checkout_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline dark:text-blue-400 break-all text-right max-w-[65%]"
                          >
                            {selectedInvoice.checkout_url}
                          </a>
                        ) : (
                          <span className="text-xs font-medium text-right">-</span>
                        )}
                      </div>
                      <div className="flex justify-between items-start py-1 gap-2">
                        <span className="text-xs text-muted-foreground">Receipt URL:</span>
                        {selectedInvoice.receipt_url ? (
                          <a
                            href={selectedInvoice.receipt_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline dark:text-blue-400 break-all text-right max-w-[65%]"
                          >
                            {selectedInvoice.receipt_url}
                          </a>
                        ) : (
                          <span className="text-xs font-medium text-right">-</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Izohlar */}
                  {selectedInvoice.notes && (
                    <div className="border-b pb-3">
                      <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Izohlar</h3>
                      <div className="p-3 bg-muted/30 rounded border text-xs leading-relaxed">
                        <p className="whitespace-pre-wrap">{selectedInvoice.notes}</p>
                      </div>
                    </div>
                  )}

                  {/* Vaqt belgilari */}
                  <div>
                    <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Vaqt belgilari</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-start py-1">
                        <span className="text-xs text-muted-foreground">Yaratilgan:</span>
                        <span className="text-xs font-medium text-right max-w-[65%]">
                          {new Date(selectedInvoice.created_at).toLocaleString('uz-UZ')}
                        </span>
                      </div>
                      <div className="flex justify-between items-start py-1">
                        <span className="text-xs text-muted-foreground">Yangilangan:</span>
                        <span className="text-xs font-medium text-right max-w-[65%]">
                          {new Date(selectedInvoice.updated_at).toLocaleString('uz-UZ')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
