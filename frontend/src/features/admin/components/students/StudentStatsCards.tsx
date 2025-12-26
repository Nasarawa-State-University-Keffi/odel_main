import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, CreditCard, Ban, GraduationCap, TrendingUp, Wallet, CheckCircle2, XCircle } from "lucide-react";
import { StudentStats } from "@/features/admin/types/student";
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
    Legend
} from "recharts";

interface StudentStatsCardsProps {
    stats?: StudentStats;
    isLoading: boolean;
}

const StudentStatsCards = ({ stats, isLoading }: StudentStatsCardsProps) => {

    if (isLoading || !stats) {
        return (
            <div className="space-y-6">
                {/* Summary Cards Skeleton */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Card key={i} className="bg-background/50 backdrop-blur-sm border-border/50 shadow-sm animate-pulse h-32">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-8 w-8 rounded-xl" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-8 w-16 mb-2" />
                                <Skeleton className="h-3 w-24" />
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Charts Skeleton */}
                <div className="grid gap-6 md:grid-cols-7">
                    {/* Bar Chart Skeleton */}
                    <Card className="md:col-span-4 bg-background/50 backdrop-blur-sm border-border/50 shadow-sm animate-pulse h-[350px]">
                        <CardHeader>
                            <Skeleton className="h-6 w-48 mb-2" />
                            <Skeleton className="h-4 w-64" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-[250px] w-full rounded-xl" />
                        </CardContent>
                    </Card>

                    {/* Side Charts Skeleton */}
                    <div className="md:col-span-3 space-y-6">
                        <Card className="bg-background/50 backdrop-blur-sm border-border/50 shadow-sm animate-pulse h-[180px]">
                            <CardHeader>
                                <Skeleton className="h-4 w-32" />
                            </CardHeader>
                            <CardContent className="flex items-center justify-between">
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-20" />
                                    <Skeleton className="h-4 w-20" />
                                </div>
                                <Skeleton className="h-[100px] w-[100px] rounded-full" />
                            </CardContent>
                        </Card>
                        <Card className="bg-background/50 backdrop-blur-sm border-border/50 shadow-sm animate-pulse h-[180px]">
                            <CardHeader>
                                <Skeleton className="h-4 w-32" />
                            </CardHeader>
                            <CardContent className="flex items-center justify-between">
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-20" />
                                    <Skeleton className="h-4 w-20" />
                                </div>
                                <Skeleton className="h-[100px] w-[100px] rounded-full" />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        );
    }

    // Prepare chart data
    const levelData = Object.keys(stats.totalLevelStats).map(level => ({
        name: `${level} Lvl`,
        Total: stats.totalLevelStats[level],
        Paid: stats.totalLevelStatsPaid[level],
        Unpaid: stats.totalLevelStatsUnpaid[level]
    }));

    const genderData = [
        { name: 'Male', value: stats.totalGenderStats.Male, color: '#3b82f6' },
        { name: 'Female', value: stats.totalGenderStats.Female, color: '#ec4899' }
    ];

    const paymentData = [
        { name: 'Paid', value: stats.totalPaidStudents, color: '#22c55e' },
        { name: 'Unpaid', value: stats.totalUnpaidStudents, color: '#ef4444' }
    ];

    // Calculate percentages
    const paidPercentage = ((stats.totalPaidStudents / stats.totalStudents) * 100).toFixed(1);
    const unpaidPercentage = ((stats.totalUnpaidStudents / stats.totalStudents) * 100).toFixed(1);

    const summaryCards = [
        {
            title: "Total Students",
            value: stats.totalStudents,
            icon: Users,
            description: `${stats.totalSemesters} Total Semesters`,
            color: "text-blue-500",
            bg: "bg-blue-500/10",

        },
        {
            title: "Paid Students",
            value: stats.totalPaidStudents,
            icon: CheckCircle2,
            description: `${paidPercentage}% of Total`,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",

        },
        {
            title: "Unpaid Students",
            value: stats.totalUnpaidStudents,
            icon: XCircle,
            description: `${unpaidPercentage}% of Total`,
            color: "text-rose-500",
            bg: "bg-rose-500/10",

        },
        {
            title: "Potential Revenue",
            value: "₦" + (stats.totalUnpaidStudents * 50000).toLocaleString(),
            icon: Wallet,
            description: "Estimated Outstanding",
            color: "text-purple-500",
            bg: "bg-purple-500/10",

        }
    ];

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {summaryCards.map((item, index) => (
                    <Card key={index} className="bg-background/60 backdrop-blur-xl border-border/50 shadow-sm hover:shadow-md transition-all">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-black uppercase tracking-tight text-muted-foreground">
                                {item.title}
                            </CardTitle>
                            <div className={`p-2 rounded-xl ${item.bg}`}>
                                <item.icon className={`h-4 w-4 ${item.color}`} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline gap-2">
                                <div className="text-2xl font-black">{typeof item.value === 'number' ? item.value.toLocaleString() : item.value}</div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 font-medium">{item.description}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Charts Section */}
            <div className="grid gap-6 md:grid-cols-7">

                {/* Level Distribution Chart */}
                <Card className="md:col-span-4 bg-background/60 backdrop-blur-xl border-border/50 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-sm font-black flex items-center gap-2 uppercase tracking-tight">
                            <TrendingUp className="h-5 w-5 text-primary" />
                            Enrollment by Level
                        </CardTitle>
                        <CardDescription className="text-xs">Distribution of students across academic levels</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-0">
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={levelData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                                    <XAxis
                                        dataKey="name"
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        fontWeight={600}
                                    />
                                    <YAxis
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `${value}`}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'transparent' }}
                                        contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                                        itemStyle={{ color: 'hsl(var(--popover-foreground))', fontSize: '12px', fontWeight: 'bold' }}
                                        labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: '4px' }}
                                    />
                                    <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', paddingTop: '10px' }} />
                                    <Bar dataKey="Paid" stackId="a" fill="#22c55e" radius={[0, 0, 4, 4]} barSize={30} />
                                    <Bar dataKey="Unpaid" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={30} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Gender & Payment Stats */}
                <div className="md:col-span-3 space-y-6">
                    {/* Gender Pie Chart */}
                    <Card className="bg-background/60 backdrop-blur-xl border-border/50 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-black uppercase tracking-tight text-muted-foreground">Gender Demographics</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[120px] flex items-center justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <div className="h-3 w-3 rounded-full bg-blue-500" />
                                        <span className="text-sm font-bold text-muted-foreground">Male</span>
                                        <span className="text-sm font-black text-foreground">{stats.totalGenderStats.Male.toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="h-3 w-3 rounded-full bg-pink-500" />
                                        <span className="text-sm font-bold text-muted-foreground">Female</span>
                                        <span className="text-sm font-black text-foreground">{stats.totalGenderStats.Female.toLocaleString()}</span>
                                    </div>
                                </div>
                                <div className="h-[120px] w-[120px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={genderData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={35}
                                                outerRadius={50}
                                                paddingAngle={5}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                {genderData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip contentStyle={{ borderRadius: '8px' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Payment Donut */}
                    <Card className="bg-background/60 backdrop-blur-xl border-border/50 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-black uppercase tracking-tight text-muted-foreground">Payment Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[120px] flex items-center justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <div className="h-3 w-3 rounded-full bg-emerald-500" />
                                        <span className="text-sm font-bold text-muted-foreground">Paid</span>
                                        <span className="text-sm font-black text-foreground">{stats.totalPaidStudents.toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="h-3 w-3 rounded-full bg-destructive" />
                                        <span className="text-sm font-bold text-muted-foreground">Unpaid</span>
                                        <span className="text-sm font-black text-foreground">{stats.totalUnpaidStudents.toLocaleString()}</span>
                                    </div>
                                </div>
                                <div className="h-[120px] w-[120px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={paymentData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={35}
                                                outerRadius={50}
                                                paddingAngle={5}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                {paymentData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip contentStyle={{ borderRadius: '8px' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default StudentStatsCards;
