"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEvents } from "../events/events-provider";
import { getAllTransactions, getTransactionStats } from "@/app/actions/transaction-actions";
import {
  Smartphone, Wallet, CreditCard, Banknote, Search, Loader2,
  Download, Filter, ArrowUpDown, IndianRupee
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

type Transaction = {
  id: string;
  eventName: string;
  eventId: string;
  userName: string;
  userEmail: string;
  total: number;
  bookingDate: string;
  method: string;
  upiTransactionId: string | null;
  upiRefNo: string | null;
  status: string;
  attendeeCount: number;
};

const METHOD_ICONS: Record<string, any> = {
  phonepe: Smartphone,
  gpay: Wallet,
  paytm: Wallet,
  card: CreditCard,
  cash: Banknote,
};

const METHOD_LABELS: Record<string, string> = {
  phonepe: "PhonePe",
  gpay: "Google Pay",
  paytm: "Paytm",
  card: "Card",
  cash: "Cash",
};

const METHOD_COLORS: Record<string, string> = {
  phonepe: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  gpay: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  paytm: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
  card: "bg-green-500/10 text-green-600 border-green-500/20",
  cash: "bg-amber-500/10 text-amber-600 border-amber-500/20",
};

export default function AdminTransactionsPage() {
  const { events } = useEvents();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filtered, setFiltered] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");
  const [eventFilter, setEventFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"date" | "amount">("date");

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const [txRes, statsRes] = await Promise.all([
        getAllTransactions(),
        getTransactionStats(),
      ]);
      if (txRes.success) {
        setTransactions((txRes.transactions as any) || []);
        setFiltered((txRes.transactions as any) || []);
      }
      if (statsRes.success) setStats(statsRes.stats);
      setLoading(false);
    };
    fetch();
  }, []);

  useEffect(() => {
    let result = [...transactions];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.userName.toLowerCase().includes(q) ||
          t.userEmail.toLowerCase().includes(q) ||
          t.eventName.toLowerCase().includes(q) ||
          t.id.toLowerCase().includes(q) ||
          (t.upiTransactionId?.toLowerCase().includes(q))
      );
    }
    if (methodFilter !== "all") {
      result = result.filter((t) => t.method === methodFilter);
    }
    if (eventFilter !== "all") {
      result = result.filter((t) => t.eventId === eventFilter);
    }
    result.sort((a, b) => {
      if (sortBy === "amount") return b.total - a.total;
      return new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime();
    });
    setFiltered(result);
  }, [search, methodFilter, eventFilter, sortBy, transactions]);

  const totalRevenue = filtered.reduce((acc, t) => acc + t.total, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Transactions</h1>
          <p className="text-muted-foreground mt-1">View all payment transactions across events</p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold">₹{stats.totalRevenue.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Total Revenue</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold">{stats.totalBookings}</p>
              <p className="text-xs text-muted-foreground">Total Bookings</p>
            </CardContent>
          </Card>
          {Object.entries(stats.byMethod).map(([method, data]: [string, any]) => (
            <Card key={method}>
              <CardContent className="pt-4 text-center">
                <p className="text-lg font-bold">{data.count}</p>
                <Badge variant="outline" className={cn("text-xs mt-1", METHOD_COLORS[method])}>
                  {METHOD_LABELS[method] || method}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">₹{data.revenue.toLocaleString()}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, event, booking ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
            >
              <option value="all">All Methods</option>
              <option value="phonepe">PhonePe</option>
              <option value="gpay">Google Pay</option>
              <option value="paytm">Paytm</option>
              <option value="card">Card</option>
              <option value="cash">Cash</option>
            </select>
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
            >
              <option value="all">All Events</option>
              {events.map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortBy(sortBy === "date" ? "amount" : "date")}
              className="gap-2"
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
              {sortBy === "date" ? "Date" : "Amount"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Payment History</CardTitle>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">{filtered.length} transactions</span>
              <span className="font-bold">₹{totalRevenue.toLocaleString()}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <IndianRupee className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>No transactions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium">Booking ID</th>
                    <th className="text-left p-3 font-medium">User</th>
                    <th className="text-left p-3 font-medium">Event</th>
                    <th className="text-left p-3 font-medium">Date</th>
                    <th className="text-left p-3 font-medium">Method</th>
                    <th className="text-left p-3 font-medium">UPI Ref</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-right p-3 font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((tx) => {
                    const Icon = METHOD_ICONS[tx.method] || CreditCard;
                    return (
                      <tr key={tx.id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="p-3 font-mono text-xs">{tx.id.slice(0, 8)}...</td>
                        <td className="p-3">
                          <p className="font-medium">{tx.userName}</p>
                          <p className="text-xs text-muted-foreground">{tx.userEmail}</p>
                        </td>
                        <td className="p-3 text-muted-foreground">{tx.eventName}</td>
                        <td className="p-3 text-muted-foreground text-xs">
                          {format(new Date(tx.bookingDate), "MMM d, h:mm a")}
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className={cn("gap-1 text-xs", METHOD_COLORS[tx.method])}>
                            <Icon className="h-3 w-3" />
                            {METHOD_LABELS[tx.method] || tx.method}
                          </Badge>
                        </td>
                        <td className="p-3 font-mono text-xs text-muted-foreground">
                          {tx.upiTransactionId || "-"}
                        </td>
                        <td className="p-3">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs",
                              tx.status === "completed" ? "bg-green-500/10 text-green-600 border-green-500/20" :
                              tx.status === "pending" ? "bg-amber-500/10 text-amber-600 border-amber-500/20" :
                              "bg-red-500/10 text-red-600 border-red-500/20"
                            )}
                          >
                            {tx.status}
                          </Badge>
                        </td>
                        <td className="p-3 text-right font-bold">₹{tx.total.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
