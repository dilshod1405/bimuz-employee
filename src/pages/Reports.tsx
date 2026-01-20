import { useState, useEffect, useMemo } from "react"
import { Calendar as CalendarIcon, TrendingUp, Users, ChevronDown, ChevronUp, Eye, FileSpreadsheet, Wallet } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { format, eachDayOfInterval, startOfMonth, endOfMonth } from "date-fns"
import { uz } from "date-fns/locale"
import { api, type Invoice, type Employee, type Group } from "@/lib/api"
import { useAuthStore } from "@/stores/authStore"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

interface MentorEarnings {
  mentor: Employee
  earnings: number // Mentorning to'liq daromadi (to'lovlar yig'indisi)
  mentorPayment: number // Mentorlarga to'lanadigan pul (55% yoki 60%)
  directorShare: number // Direktorning ulushi (45% yoki 40%)
  groupsCount: number
  studentsCount: number
  is_paid?: boolean
  payment_date?: string
  groupsDetail: Array<{
    group: Group
    earnings: number
    mentorPayment: number
    directorShare: number
    studentsCount: number
  }>
}

interface EmployeeSalary {
  employee: Employee
  salary: number
  month: string
  is_paid?: boolean
  payment_date?: string
}

interface FinancialSummary {
  totalRevenue: number
  totalDirectorShare: number
  totalMentorPayments: number
  totalEmployeeSalaries: number
  directorRemaining: number
}

interface DailyRevenue {
  date: string
  revenue: number
  displayDate: string
}

export default function Reports() {
  const user = useAuthStore((state) => state.user)
  const { toast } = useToast()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [mentors, setMentors] = useState<Employee[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState<string>("")
  const [, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [expandedMentor, setExpandedMentor] = useState<number | null>(null)
  const [selectedMentorDetail, setSelectedMentorDetail] = useState<MentorEarnings | null>(null)
  const [employeeSalaries, setEmployeeSalaries] = useState<EmployeeSalary[]>([])
  const [allEmployees, setAllEmployees] = useState<Employee[]>([])
  const [selectedEmployeeForSalary, setSelectedEmployeeForSalary] = useState<Employee | null>(null)
  const [salaryDialogOpen, setSalaryDialogOpen] = useState(false)
  const [salaryAmount, setSalaryAmount] = useState<string>("")
  const [mentorPayments, setMentorPayments] = useState<Map<number, { is_paid: boolean; payment_date?: string }>>(new Map())

  // Check permissions
  const canRead = user?.role === "dasturchi" || user?.role === "direktor" || user?.role === "administrator" || user?.role === "buxgalter"
  const canManageSalary = user?.role === "direktor" || user?.role === "buxgalter"
  const canExport = user?.role === "buxgalter"

  // Initialize selected month to current month
  useEffect(() => {
    const today = new Date()
    setSelectedMonth(format(today, "yyyy-MM"))
  }, [])

  useEffect(() => {
    if (canRead) {
      loadAllData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canRead, selectedMonth])


  const loadAllData = async () => {
    try {
      setLoading(true)
      
      // Load real data - mentors must be loaded first to populate allEmployees
      await loadMentors()
      await Promise.all([
        loadInvoices(),
        loadGroups(),
      ])
      // Load employee salaries after all data is loaded
      if (selectedMonth) {
        await loadEmployeeSalaries()
      }
    } catch (err) {
      console.error("Failed to load data:", err)
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Ma'lumotlarni yuklashda xatolik yuz berdi",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadEmployeeSalaries = async () => {
    try {
      if (!selectedMonth) return
      
      const reportsData = await api.getMonthlyReports(selectedMonth)
      
      // Extract employee salaries from reports data
      if (reportsData.employees && Array.isArray(reportsData.employees)) {
        const salaries: EmployeeSalary[] = reportsData.employees
          .map((emp: any) => {
            // Create employee object from reports data
            // Backend returns full employee info in reports
            const employee: Employee = {
              id: emp.id,
              first_name: emp.full_name?.split(' ')[0] || '',
              last_name: emp.full_name?.split(' ').slice(1).join(' ') || '',
              full_name: emp.full_name || "Noma'lum",
              email: emp.email || "",
              role: emp.role || "unknown",
              role_display: emp.role_display || "Noma'lum",
              professionality: null,
              is_active: true,
              created_at: '',
              updated_at: '',
            }
            
            return {
              employee,
              salary: emp.salary || 0,
              month: selectedMonth,
              is_paid: (emp as any).is_paid || false,
              payment_date: (emp as any).payment_date || undefined,
            }
          })
          .filter(sal => sal.salary > 0) // Only include employees with salary set
        
        setEmployeeSalaries(salaries)
        
        // Also update allEmployees to ensure they're in sync
        // Create employee objects from reports data for employees without salary too
        const employeesFromReports: Employee[] = reportsData.employees.map((emp: any) => ({
          id: emp.id,
          first_name: emp.full_name?.split(' ')[0] || '',
          last_name: emp.full_name?.split(' ').slice(1).join(' ') || '',
          full_name: emp.full_name || "Noma'lum",
          email: emp.email || "",
          role: emp.role || "unknown",
          role_display: emp.role_display || "Noma'lum",
          professionality: null,
          is_active: true,
          created_at: '',
          updated_at: '',
        }))
        
        // Merge with existing allEmployees, preferring reports data
        const existingIds = new Set(allEmployees.map(e => e.id))
        const newEmployees = employeesFromReports.filter(e => !existingIds.has(e.id))
        if (newEmployees.length > 0) {
          setAllEmployees([...allEmployees, ...newEmployees])
        }

        // Load mentor payment statuses
        if (reportsData.mentor_earnings) {
          const newMentorPayments = new Map<number, { is_paid: boolean; payment_date?: string }>()
          reportsData.mentor_earnings.forEach((mentor: any) => {
            if (mentor.mentor_id) {
              newMentorPayments.set(mentor.mentor_id, {
                is_paid: mentor.is_paid || false,
                payment_date: mentor.payment_date,
              })
            }
          })
          setMentorPayments(newMentorPayments)
        }
      }
    } catch (err) {
      console.error("Failed to load employee salaries:", err)
      // Don't show error toast for this, just log it
      // Employee salaries might not be set yet
    }
  }

  const loadInvoices = async () => {
    try {
      // Load all paid invoices (fetch multiple pages if needed)
      let allInvoices: Invoice[] = []
      let page = 1
      let hasMore = true

      while (hasMore) {
        const response = await api.getInvoices("", "paid", "-payment_time", page)
        let invoicesList: Invoice[] = []
        if (response.results && Array.isArray(response.results)) {
          invoicesList = response.results
          allInvoices = [...allInvoices, ...invoicesList]
          // Check if there are more pages
          hasMore = !!response.next
          page++
        } else if (response.data && Array.isArray(response.data)) {
          invoicesList = response.data
          allInvoices = [...allInvoices, ...invoicesList]
          hasMore = false
        } else {
          hasMore = false
        }
      }

      setInvoices(allInvoices)
    } catch (err) {
      console.error("Failed to load invoices:", err)
    }
  }

  const loadMentors = async () => {
    try {
      const response = await api.getEmployees()
      let employeesList: Employee[] = []
      if (response.results && Array.isArray(response.results)) {
        employeesList = response.results
      } else if (response.data && Array.isArray(response.data)) {
        employeesList = response.data
      }
      const mentorsList = employeesList.filter(emp => emp.role === "mentor")
      setMentors(mentorsList)
      // Store all employees for salary management (excluding mentors)
      // Filter out mentors, keep all other roles
      const nonMentorEmployees = employeesList.filter(emp => emp.role !== "mentor")
      setAllEmployees(nonMentorEmployees)
      
        // After loading employees, load their salaries if month is selected
        if (selectedMonth) {
          await loadEmployeeSalaries()
        }
    } catch (err) {
      console.error("Failed to load mentors:", err)
    }
  }

  const loadGroups = async () => {
    try {
      const response = await api.getGroups()
      let groupsList: Group[] = []
      if (response.results && Array.isArray(response.results)) {
        groupsList = response.results
      } else if (response.data && Array.isArray(response.data)) {
        groupsList = response.data
      }
      setGroups(groupsList)
    } catch (err) {
      console.error("Failed to load groups:", err)
    }
  }

  // Calculate mentor earnings for selected month with detailed breakdown
  const mentorEarnings = useMemo((): MentorEarnings[] => {
    if (!selectedMonth || !invoices.length || !groups.length) {
      return []
    }

    const [year, month] = selectedMonth.split("-").map(Number)
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59)

    // Filter invoices by payment date in selected month
    const monthlyInvoices = invoices.filter(invoice => {
      if (!invoice.payment_time) return false
      const paymentDate = new Date(invoice.payment_time)
      return paymentDate >= startDate && paymentDate <= endDate
    })

    // Group invoices by mentor with detailed breakdown
    const mentorMap = new Map<number, {
      mentor: Employee
      amount: number
      mentorPayment: number
      directorShare: number
      groups: Map<number, { 
        group: Group
        amount: number
        mentorPayment: number
        directorShare: number
        students: Set<number>
      }>
      allStudents: Set<number>
    }>()

    // Helper function to calculate payment split based on group students count
    const calculatePaymentSplit = (amount: number, studentsCount: number) => {
      // Agar guruhdagi talabalar soni 6 tagacha bo'lsa, direktor 45%, mentor 55%
      // Agar 6 tadan oshsa, direktor 40%, mentor 60%
      const directorPercent = studentsCount <= 6 ? 0.45 : 0.40
      const mentorPercent = 1 - directorPercent
      
      return {
        directorShare: amount * directorPercent,
        mentorPayment: amount * mentorPercent,
      }
    }

    monthlyInvoices.forEach(invoice => {
      const group = groups.find(g => g.id === invoice.group)
      if (!group || !group.mentor) return

      const mentorId = group.mentor
      const invoiceAmount = parseFloat(invoice.amount)
      
      if (!mentorMap.has(mentorId)) {
        const mentor = mentors.find(m => m.id === mentorId)
        if (!mentor) return
        mentorMap.set(mentorId, {
          mentor,
          amount: 0,
          mentorPayment: 0,
          directorShare: 0,
          groups: new Map(),
          allStudents: new Set(),
        })
      }

      const mentorData = mentorMap.get(mentorId)!
      mentorData.amount += invoiceAmount
      mentorData.allStudents.add(invoice.student)

      if (!mentorData.groups.has(invoice.group)) {
        mentorData.groups.set(invoice.group, {
          group,
          amount: 0,
          mentorPayment: 0,
          directorShare: 0,
          students: new Set(),
        })
      }
      
      const groupData = mentorData.groups.get(invoice.group)!
      groupData.amount += invoiceAmount
      groupData.students.add(invoice.student)
      
      // Calculate payment split for this invoice
      const split = calculatePaymentSplit(invoiceAmount, groupData.students.size)
      groupData.mentorPayment += split.mentorPayment
      groupData.directorShare += split.directorShare
    })

    // Calculate totals for each mentor
    mentorMap.forEach((data) => {
      let totalMentorPayment = 0
      let totalDirectorShare = 0
      
      data.groups.forEach((groupData) => {
        // Recalculate split for the entire group earnings based on final student count
        const split = calculatePaymentSplit(groupData.amount, groupData.students.size)
        groupData.mentorPayment = split.mentorPayment
        groupData.directorShare = split.directorShare
        
        totalMentorPayment += split.mentorPayment
        totalDirectorShare += split.directorShare
      })
      
      data.mentorPayment = totalMentorPayment
      data.directorShare = totalDirectorShare
    })

    // Convert to array and sort by earnings
    return Array.from(mentorMap.values())
      .map(data => {
        // Get payment status from mentorPayments map
        const paymentStatus = mentorPayments.get(data.mentor.id) || { is_paid: false }
        return {
          mentor: data.mentor,
          earnings: data.amount,
          mentorPayment: data.mentorPayment,
          directorShare: data.directorShare,
          groupsCount: data.groups.size,
          studentsCount: data.allStudents.size,
          is_paid: paymentStatus.is_paid,
          payment_date: paymentStatus.payment_date,
          groupsDetail: Array.from(data.groups.values())
            .map(gd => ({
              group: gd.group,
              earnings: gd.amount,
              mentorPayment: gd.mentorPayment,
              directorShare: gd.directorShare,
              studentsCount: gd.students.size,
            }))
            .sort((a, b) => b.earnings - a.earnings),
        }
      })
      .sort((a, b) => b.earnings - a.earnings)
  }, [invoices, groups, mentors, selectedMonth, mentorPayments])

  // Calculate daily revenue for selected month
  const dailyRevenue = useMemo((): DailyRevenue[] => {
    if (!selectedMonth || !invoices.length) {
      return []
    }

    const [year, month] = selectedMonth.split("-").map(Number)
    const startDate = startOfMonth(new Date(year, month - 1))
    const endDate = endOfMonth(new Date(year, month - 1))
    const days = eachDayOfInterval({ start: startDate, end: endDate })

    // Filter invoices by payment date in selected month
    const monthlyInvoices = invoices.filter(invoice => {
      if (!invoice.payment_time) return false
      const paymentDate = new Date(invoice.payment_time)
      return paymentDate >= startDate && paymentDate <= endDate
    })

    // Group invoices by day
    const dailyMap = new Map<string, number>()
    days.forEach(day => {
      const dayKey = format(day, "yyyy-MM-dd")
      dailyMap.set(dayKey, 0)
    })

    monthlyInvoices.forEach(invoice => {
      if (!invoice.payment_time) return
      const paymentDate = new Date(invoice.payment_time)
      const dayKey = format(paymentDate, "yyyy-MM-dd")
      const current = dailyMap.get(dayKey) || 0
      dailyMap.set(dayKey, current + parseFloat(invoice.amount))
    })

    return Array.from(dailyMap.entries())
      .map(([date, revenue]) => ({
        date,
        revenue,
        displayDate: format(new Date(date), "d MMM", { locale: uz }),
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [invoices, selectedMonth])

  // Prepare chart data
  const mentorChartData = useMemo(() => {
    return mentorEarnings.map(item => ({
      name: item.mentor.full_name.length > 15 
        ? item.mentor.full_name.substring(0, 15) + "..." 
        : item.mentor.full_name,
      daromad: item.earnings,
    }))
  }, [mentorEarnings])

  const groupChartData = useMemo(() => {
    const groupMap = new Map<number, { name: string; earnings: number }>()
    
    if (!selectedMonth || !invoices.length || !groups.length) {
      return []
    }

    const [year, month] = selectedMonth.split("-").map(Number)
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59)

    const monthlyInvoices = invoices.filter(invoice => {
      if (!invoice.payment_time) return false
      const paymentDate = new Date(invoice.payment_time)
      return paymentDate >= startDate && paymentDate <= endDate
    })

    monthlyInvoices.forEach(invoice => {
      const group = groups.find(g => g.id === invoice.group)
      if (!group) return

      if (!groupMap.has(group.id)) {
        groupMap.set(group.id, {
          name: `${group.speciality_display} - ${group.dates_display}`,
          earnings: 0,
        })
      }

      const groupData = groupMap.get(group.id)!
      groupData.earnings += parseFloat(invoice.amount)
    })

    return Array.from(groupMap.values())
      .sort((a, b) => b.earnings - a.earnings)
      .slice(0, 10) // Top 10 groups
  }, [invoices, groups, selectedMonth])

  // Calculate total monthly revenue
  const totalRevenue = useMemo(() => {
    return mentorEarnings.reduce((sum, mentor) => sum + mentor.earnings, 0)
  }, [mentorEarnings])

  // Calculate financial summary
  const financialSummary = useMemo((): FinancialSummary => {
    const totalDirectorShare = mentorEarnings.reduce((sum, mentor) => sum + mentor.directorShare, 0)
    const totalMentorPayments = mentorEarnings.reduce((sum, mentor) => sum + mentor.mentorPayment, 0)
    const totalEmployeeSalaries = employeeSalaries.reduce((sum, salary) => sum + salary.salary, 0)
    const directorRemaining = totalDirectorShare - totalEmployeeSalaries

    return {
      totalRevenue,
      totalDirectorShare,
      totalMentorPayments,
      totalEmployeeSalaries,
      directorRemaining: directorRemaining > 0 ? directorRemaining : 0,
    }
  }, [mentorEarnings, totalRevenue, employeeSalaries])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('uz-UZ').format(price) + " uzs"
  }

  const formatMonthYear = (monthYear: string) => {
    if (!monthYear) return ""
    const [year, month] = monthYear.split("-")
    const date = new Date(parseInt(year), parseInt(month) - 1)
    return format(date, "MMMM yyyy", { locale: uz })
  }

  // Chart configurations
  const dailyRevenueChartConfig: ChartConfig = {
    revenue: {
      label: "Daromad",
      color: "hsl(var(--chart-1))",
    },
  } satisfies ChartConfig

  const mentorChartConfig: ChartConfig = {
    daromad: {
      label: "Daromad",
      color: "hsl(var(--chart-2))",
    },
  } satisfies ChartConfig

  const groupChartConfig: ChartConfig = {
    earnings: {
      label: "Daromad",
      color: "hsl(var(--chart-3))",
    },
  } satisfies ChartConfig

  const handleMonthChange = (monthYear: string) => {
    setSelectedMonth(monthYear)
    const [year] = monthYear.split("-").map(Number)
    setSelectedYear(year)
  }

  // Export to Excel (CSV format)
  // Handle salary setting for employees
  const handleSetSalary = (employee: Employee) => {
    setSelectedEmployeeForSalary(employee)
    // Get existing salary for this employee and month if exists
    const existingSalary = employeeSalaries.find(
      sal => sal.employee.id === employee.id && sal.month === selectedMonth
    )
    setSalaryAmount(existingSalary ? existingSalary.salary.toString() : "")
    setSalaryDialogOpen(true)
  }

  const handleSaveSalary = async () => {
    if (!selectedEmployeeForSalary || !selectedMonth || !salaryAmount) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Barcha maydonlarni to'ldiring",
      })
      return
    }

    const salary = parseFloat(salaryAmount)
    if (isNaN(salary) || salary < 0) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Maosh to'g'ri raqam bo'lishi kerak",
      })
      return
    }

    try {
      // Save to backend
      await api.setEmployeeSalary({
        employee_id: selectedEmployeeForSalary.id,
        month: selectedMonth,
        amount: salary,
      })

      // Reload employee salaries from backend to get updated data
      await loadEmployeeSalaries()

      toast({
        title: "Muvaffaqiyatli",
        description: `${selectedEmployeeForSalary.full_name} uchun maosh belgilandi`,
      })

      setSalaryDialogOpen(false)
      setSelectedEmployeeForSalary(null)
      setSalaryAmount("")
    } catch (error: any) {
      console.error("Failed to save salary:", error)
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: error?.message || "Maosh belgilashda xatolik yuz berdi",
      })
    }
  }

  // Handle mark salary as paid
  const handleMarkSalaryAsPaid = async (employeeId: number, isPaid: boolean) => {
    if (!selectedMonth) return

    console.log("Marking salary as paid:", { employeeId, isPaid, month: selectedMonth })

    try {
      const result = await api.markSalaryAsPaid({
        employee_id: employeeId,
        month: selectedMonth,
        is_paid: isPaid,
      })

      console.log("Salary marked as paid result:", result)

      // Reload data
      await loadEmployeeSalaries()

      toast({
        title: "Muvaffaqiyatli",
        description: isPaid ? "Maosh to'landi deb belgilandi" : "To'lov bekor qilindi",
      })
    } catch (error: any) {
      console.error("Failed to mark salary as paid:", error)
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: error?.response?.data?.error || error?.message || "Maoshlarni belgilashda xatolik yuz berdi",
      })
    }
  }

  // Handle mark mentor payment as paid
  const handleMarkMentorPaymentAsPaid = async (mentorId: number, amount: number, isPaid: boolean) => {
    if (!selectedMonth) return

    try {
      await api.markMentorPaymentAsPaid({
        mentor_id: mentorId,
        month: selectedMonth,
        amount: amount,
        is_paid: isPaid,
      })

      // Reload all data to refresh mentor payments status
      await loadEmployeeSalaries()

      toast({
        title: "Muvaffaqiyatli",
        description: isPaid ? "Mentor to'lovi to'landi deb belgilandi" : "To'lov bekor qilindi",
      })
    } catch (error: any) {
      console.error("Failed to mark mentor payment as paid:", error)
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: error?.message || "Mentor to'lovini belgilashda xatolik yuz berdi",
      })
    }
  }

  const handleExportToExcel = () => {
    if (!selectedMonth || mentorEarnings.length === 0) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Eksport qilish uchun ma'lumot topilmadi",
      })
      return
    }

    // Prepare CSV data
    const csvRows: string[] = []
    
    // Header
    csvRows.push("Hisobot - " + formatMonthYear(selectedMonth))
    csvRows.push("")
    csvRows.push("Mentor,FISh,Guruhlar soni,Talabalar soni,Umumiy daromad,Mentorga to'lov,Direktor ulushi")
    
    // Mentor data
    mentorEarnings.forEach((item) => {
      csvRows.push(
        `${item.mentor.full_name},${item.mentor.full_name},${item.groupsCount},${item.studentsCount},${item.earnings},${item.mentorPayment},${item.directorShare}`
      )
    })
    
    // Financial summary
    csvRows.push("")
    csvRows.push("MOLIYAVIY XULOSA")
    csvRows.push(`Umumiy daromad,${financialSummary.totalRevenue}`)
    csvRows.push(`Direktor ulushi,${financialSummary.totalDirectorShare}`)
    csvRows.push(`Mentorlarga to'lov,${financialSummary.totalMentorPayments}`)
    csvRows.push(`Xodimlarga maosh,${financialSummary.totalEmployeeSalaries}`)
    csvRows.push(`Direktorda qolgan,${financialSummary.directorRemaining}`)
    
    // Create blob and download
    const csvContent = csvRows.join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    
    link.setAttribute("href", url)
    link.setAttribute("download", `hisobot_${selectedMonth.replace("-", "_")}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast({
      title: "Muvaffaqiyatli",
      description: "Hisobot Excel formatida yuklab olindi",
    })
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
        <h1 className="text-2xl font-semibold">Hisobotlar</h1>
      </div>

      {/* Month Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Oy tanlash</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[250px] justify-start text-left font-normal",
                    !selectedMonth && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedMonth ? (
                    formatMonthYear(selectedMonth)
                  ) : (
                    <span>Oy tanlang</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedMonth ? new Date(selectedMonth + "-01") : undefined}
                  onSelect={(date) => {
                    if (date) {
                      handleMonthChange(format(date, "yyyy-MM"))
                    }
                  }}
                  initialFocus
                  captionLayout="dropdown"
                  fromYear={new Date().getFullYear() - 2}
                  toYear={new Date().getFullYear()}
                  locale={uz}
                  weekStartsOn={1}
                />
              </PopoverContent>
            </Popover>
            {canExport && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExportToExcel()}
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Excel'ga yuklab olish
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Umumiy daromad</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className="text-2xl font-bold">{formatPrice(totalRevenue)}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {selectedMonth && formatMonthYear(selectedMonth)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Direktor ulushi</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className="text-2xl font-bold">{formatPrice(financialSummary.totalDirectorShare)}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              To'lovlardan direktor ulushi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mentorlarga to'lov</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className="text-2xl font-bold">{formatPrice(financialSummary.totalMentorPayments)}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Mentorlarga to'lanadigan summa
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Direktorda qolgan</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className="text-2xl font-bold">{formatPrice(financialSummary.directorRemaining)}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Maoshlardan keyin qolgan
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      {!loading && selectedMonth && mentorEarnings.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Daily Revenue Chart */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Kunlik daromad oqimi</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={dailyRevenueChartConfig} className="min-h-[250px] w-full">
                <LineChart data={dailyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="displayDate" 
                    tickLine={false}
                    axisLine={false}
                    tickMargin={6}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    tick={{ fontSize: 10 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    tickLine={false}
                    axisLine={false}
                    tickMargin={6}
                    tick={{ fontSize: 10 }}
                    tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                    width={50}
                  />
                  <ChartTooltip content={<ChartTooltipContent formatter={(value: any) => [`${formatPrice(Number(value))}`, "Daromad"]} />} />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="var(--color-revenue)" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Mentor Comparison Chart */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Mentorlar daromadi</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={mentorChartConfig} className="min-h-[250px] w-full">
                <BarChart data={mentorChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    tickLine={false}
                    axisLine={false}
                    tickMargin={6}
                    tick={{ fontSize: 10 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    tickLine={false}
                    axisLine={false}
                    tickMargin={6}
                    tick={{ fontSize: 10 }}
                    tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                    width={50}
                  />
                  <ChartTooltip content={<ChartTooltipContent formatter={(value: any) => [`${formatPrice(Number(value))}`, "Daromad"]} />} />
                  <Bar dataKey="daromad" fill="var(--color-daromad)" radius={4} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Top Groups Chart */}
          {groupChartData.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Top 10 guruhlar</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={groupChartConfig} className="min-h-[250px] w-full">
                  <BarChart data={groupChartData.slice(0, 5)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis 
                      type="number"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={6}
                      tick={{ fontSize: 10 }}
                      tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                      width={50}
                    />
                    <YAxis 
                      type="category"
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={6}
                      tick={{ fontSize: 9 }}
                      width={120}
                    />
                    <ChartTooltip content={<ChartTooltipContent formatter={(value: any) => [`${formatPrice(Number(value))}`, "Daromad"]} />} />
                    <Bar dataKey="earnings" fill="var(--color-earnings)" radius={4} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Mentor Earnings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Mentorlar daromadlari</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : mentorEarnings.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {selectedMonth ? "Bu oy uchun ma'lumot topilmadi" : "Oy tanlang"}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left text-sm font-medium w-8"></th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Mentor</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Guruhlar soni</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Talabalar soni</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Umumiy daromad</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Mentorga to'lov</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Direktor ulushi</th>
                    {canManageSalary && (
                      <th className="px-4 py-3 text-center text-sm font-medium">To'landi</th>
                    )}
                    <th className="px-4 py-3 text-right text-sm font-medium">Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {mentorEarnings.map((item) => {
                    const isExpanded = expandedMentor === item.mentor.id
                    return (
                      <>
                        <tr key={item.mentor.id} className="border-b hover:bg-muted/50">
                          <td className="px-4 py-3">
                            {item.groupsDetail.length > 0 && (
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => setExpandedMentor(isExpanded ? null : item.mentor.id)}
                              >
                                {isExpanded ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium">{item.mentor.full_name}</td>
                          <td className="px-4 py-3 text-sm">{item.groupsCount}</td>
                          <td className="px-4 py-3 text-sm">{item.studentsCount}</td>
                          <td className="px-4 py-3 text-sm text-right font-medium">
                            {formatPrice(item.earnings)}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-green-600 font-medium">
                            {formatPrice(item.mentorPayment)}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-blue-600 font-medium">
                            {formatPrice(item.directorShare)}
                          </td>
                          {canManageSalary && (
                            <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                checked={item.is_paid || false}
                                onChange={(e) => {
                                  const checked = e.target.checked
                                  console.log("Mentor checkbox changed:", checked, item.mentor.id)
                                  handleMarkMentorPaymentAsPaid(item.mentor.id, item.mentorPayment, checked)
                                }}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </td>
                          )}
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedMentorDetail(item)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Batafsil
                              </Button>
                            </div>
                          </td>
                        </tr>
                        {isExpanded && item.groupsDetail.length > 0 && (
                          <tr>
                            <td colSpan={canManageSalary ? 9 : 8} className="px-4 py-3 bg-muted/30">
                              <div className="space-y-2">
                                <h4 className="text-sm font-semibold mb-2">Guruhlar bo'yicha tafsilot:</h4>
                                <div className="space-y-1">
                                  {item.groupsDetail.map((groupDetail) => (
                                    <div
                                      key={groupDetail.group.id}
                                      className="flex items-center justify-between p-2 bg-background rounded border text-sm"
                                    >
                                      <div className="flex-1">
                                        <span className="font-medium">
                                          {groupDetail.group.speciality_display} - {groupDetail.group.dates_display}
                                        </span>
                                        <span className="text-muted-foreground ml-2">
                                          ({groupDetail.group.time})
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-4">
                                        <span className="text-muted-foreground">
                                          {groupDetail.studentsCount} talaba
                                        </span>
                                        <span className="font-medium">
                                          {formatPrice(groupDetail.earnings)}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Employee Salaries Table */}
      {canManageSalary && (
        <Card>
          <CardHeader>
            <CardTitle>Xodimlar maoshlari</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : allEmployees.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Xodimlar topilmadi
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-3 text-left text-sm font-medium">Xodim</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Lavozim</th>
                      <th className="px-4 py-3 text-right text-sm font-medium">Maosh</th>
                      {canManageSalary && (
                        <th className="px-4 py-3 text-center text-sm font-medium">To'landi</th>
                      )}
                      <th className="px-4 py-3 text-right text-sm font-medium">Amallar</th>
                  </tr>
                </thead>
                <tbody>
                    {allEmployees.map((employee) => {
                      const employeeSalary = employeeSalaries.find(
                        sal => sal.employee.id === employee.id && sal.month === selectedMonth
                      )
                      return (
                        <tr key={employee.id} className="border-b hover:bg-muted/50">
                          <td className="px-4 py-3 text-sm font-medium">{employee.full_name}</td>
                          <td className="px-4 py-3 text-sm">{employee.role_display}</td>
                          <td className="px-4 py-3 text-sm text-right font-medium">
                            {employeeSalary 
                              ? `${formatPrice(employeeSalary.salary)}`
                              : <span className="text-muted-foreground">Belgilanmagan</span>
                            }
                          </td>
                          {canManageSalary && (
                            <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                              {employeeSalary && employeeSalary.salary > 0 ? (
                                <Checkbox
                                  checked={employeeSalary.is_paid || false}
                                  onChange={(e) => {
                                    const checked = e.target.checked
                                    console.log("Employee checkbox changed:", checked, employee.id)
                                    handleMarkSalaryAsPaid(employee.id, checked)
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              ) : (
                                <span className="text-muted-foreground text-xs">-</span>
                              )}
                            </td>
                          )}
                          <td className="px-4 py-3 text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSetSalary(employee)}
                            >
                              {employeeSalary ? "O'zgartirish" : "Belgilash"}
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t font-semibold">
                      <td colSpan={canManageSalary ? 3 : 2} className="px-4 py-3 text-right">
                        Jami maoshlar:
                      </td>
                      <td className="px-4 py-3 text-right">
                        {formatPrice(financialSummary.totalEmployeeSalaries)}
                      </td>
                      {canManageSalary && <td></td>}
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Salary Dialog */}
      <Dialog open={salaryDialogOpen} onOpenChange={setSalaryDialogOpen}>
        <DialogContent className="sm:max-w-[500px] p-6">
          <DialogHeader className="px-0 pt-0">
            <DialogTitle className="text-xl">Maosh belgilash</DialogTitle>
            <DialogDescription className="text-base mt-2">
              {selectedEmployeeForSalary && (
                <>
                  <div className="flex items-center gap-3 mb-4 mt-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{selectedEmployeeForSalary.full_name}</p>
                      <p className="text-sm text-muted-foreground">{selectedEmployeeForSalary.role_display}</p>
                    </div>
                  </div>
                  <p className="text-sm">
                    {formatMonthYear(selectedMonth)} oyi uchun maoshni belgilang
                  </p>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4 px-0">
            <div className="space-y-2">
              <Label htmlFor="salary" className="text-base font-medium">
                Maosh summasi
              </Label>
              <div className="relative">
                <Input
                  id="salary"
                  type="number"
                  placeholder="Masalan: 5000000"
                  value={salaryAmount}
                  onChange={(e) => {
                    const value = e.target.value
                    // Allow only positive numbers (no negative signs, no decimals except .0)
                    if (value === '' || (parseFloat(value) >= 0 && !value.includes('-'))) {
                      setSalaryAmount(value)
                    }
                  }}
                  onKeyDown={(e) => {
                    // Prevent minus, plus, and 'e' keys
                    if (e.key === '-' || e.key === '+' || e.key === 'e' || e.key === 'E') {
                      e.preventDefault()
                    }
                  }}
                  min="0"
                  step="1000"
                  className="text-lg pr-20"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  uzs
                </span>
              </div>
              {salaryAmount && !isNaN(parseFloat(salaryAmount)) && (
                <p className="text-sm text-muted-foreground">
                  {formatPrice(parseFloat(salaryAmount))}
                </p>
              )}
            </div>
            {selectedEmployeeForSalary && (
              <div className="rounded-lg border bg-muted/50 p-4">
                <p className="text-sm font-medium mb-2">Ma'lumot:</p>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>Xodim: {selectedEmployeeForSalary.full_name}</p>
                  <p>Lavozim: {selectedEmployeeForSalary.role_display}</p>
                  <p>Oy: {formatMonthYear(selectedMonth)}</p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="px-0 pb-0 gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => {
                setSalaryDialogOpen(false)
                setSelectedEmployeeForSalary(null)
                setSalaryAmount("")
              }}
            >
              Bekor qilish
            </Button>
            <Button onClick={handleSaveSalary} className="min-w-[100px]">
              Saqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mentor Detail Sheet */}
      <Sheet open={selectedMentorDetail !== null} onOpenChange={(open) => !open && setSelectedMentorDetail(null)}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {selectedMentorDetail && (
            <div className="flex flex-col h-full">
              <SheetHeader className="border-b pb-4 mb-6">
                <SheetTitle className="text-xl">{selectedMentorDetail.mentor.full_name}</SheetTitle>
                <SheetDescription className="text-base mt-2">
                  {formatMonthYear(selectedMonth)} oyi uchun batafsil hisobot
                </SheetDescription>
              </SheetHeader>
              
              <div className="flex-1 space-y-6 overflow-y-auto pr-2">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Jami daromad</CardTitle>
                      <Wallet className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{formatPrice(selectedMentorDetail.earnings)}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Guruhlar soni</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{selectedMentorDetail.groupsCount}</div>
                      <p className="text-xs text-muted-foreground mt-1">ta guruh</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Talabalar soni</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{selectedMentorDetail.studentsCount}</div>
                      <p className="text-xs text-muted-foreground mt-1">ta talaba</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Groups Detail */}
                <Card>
                  <CardHeader>
                    <CardTitle>Guruhlar bo'yicha tafsilot</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedMentorDetail.groupsDetail.map((groupDetail) => (
                        <Card key={groupDetail.group.id} className="border-l-4 border-l-primary">
                          <CardContent className="pt-6">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                              <div className="space-y-1">
                                <h4 className="font-semibold text-lg">{groupDetail.group.speciality_display}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {groupDetail.group.dates_display}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Vaqt: {groupDetail.group.time}
                                </p>
                                {groupDetail.group.starting_date && (
                                  <p className="text-sm text-muted-foreground">
                                    Boshlanish: {format(new Date(groupDetail.group.starting_date), "d MMMM, yyyy", { locale: uz })}
                                  </p>
                                )}
                              </div>
                              <div className="flex flex-col items-end space-y-2">
                                <div className="text-right">
                                  <p className="text-2xl font-bold text-primary">
                                    {formatPrice(groupDetail.earnings)}
                                  </p>
                                  <p className="text-sm text-muted-foreground">daromad</p>
                                </div>
                                <Badge variant="secondary" className="w-fit">
                                  {groupDetail.studentsCount} ta talaba
                                </Badge>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      {selectedMentorDetail.groupsDetail.length === 0 && (
                        <p className="text-center text-muted-foreground py-8">
                          Bu oy uchun guruhlar mavjud emas
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
