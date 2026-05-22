import { useState } from 'react';
import { useClients } from '../hooks/useClients';
import { useOrders } from '../hooks/useOrders';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Users, Package, Clock, CheckCircle, XCircle, TrendingUp, ArrowUpRight, ArrowDownRight, Calendar, UserPlus, PackagePlus, DollarSign } from 'lucide-react';
import { OrderInsights } from './OrderInsights';
import { cn } from '../lib/utils';
import { format, subDays, isSameDay, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export function Dashboard() {
  const { clients, addClient } = useClients();
  const { orders, addOrder } = useOrders();

  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  
  const [clientForm, setClientForm] = useState({ name: '', phone: '' });
  const [orderForm, setOrderForm] = useState({ name: '', price: '', clientId: '' });

  const handleClientSubmit = async (e: any) => {
    e.preventDefault();
    if (!clientForm.name || !clientForm.phone) {
      toast.error('Por favor completa todos los campos');
      return;
    }
    await addClient(clientForm.name, clientForm.phone);
    toast.success('Cliente registrado');
    setIsClientDialogOpen(false);
    setClientForm({ name: '', phone: '' });
  };

  const handleOrderSubmit = async (e: any) => {
    e.preventDefault();
    if (!orderForm.name || !orderForm.price || !orderForm.clientId) {
      toast.error('Por favor completa todos los campos');
      return;
    }
    const priceNum = parseFloat(orderForm.price);
    if (isNaN(priceNum)) {
      toast.error('Precio inválido');
      return;
    }
    await addOrder(orderForm.name, priceNum, orderForm.clientId);
    toast.success('Pedido registrado');
    setIsOrderDialogOpen(false);
    setOrderForm({ name: '', price: '', clientId: '' });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': 
        return (
          <Badge className="bg-amber-500 text-white border-none text-[10px] px-2 py-0 h-5 flex items-center gap-1 font-semibold">
            <Clock className="h-3 w-3" />
            Pendiente
          </Badge>
        );
      case 'completed': 
        return (
          <Badge className="bg-emerald-500 text-white border-none text-[10px] px-2 py-0 h-5 flex items-center gap-1 font-semibold">
            <CheckCircle className="h-3 w-3" />
            Completado
          </Badge>
        );
      case 'cancelled': 
        return (
          <Badge className="bg-rose-500 text-white border-none text-[10px] px-2 py-0 h-5 flex items-center gap-1 font-semibold">
            <XCircle className="h-3 w-3" />
            Cancelado
          </Badge>
        );
      default: 
        return <Badge variant="outline" className="text-[10px] px-2 py-0 h-5">{status}</Badge>;
    }
  };

  const totalClients = clients.length;
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const completedOrders = orders.filter(o => o.status === 'completed').length;
  const totalRevenue = orders
    .filter(o => o.status === 'completed')
    .reduce((sum, o) => sum + o.price, 0);

  // Chart Data: Revenue over last 7 days
  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dayOrders = orders.filter(o => 
      o.status === 'completed' && 
      o.createdAt && 
      isSameDay(o.createdAt.toDate ? o.createdAt.toDate() : new Date(o.createdAt), date)
    );
    const revenue = dayOrders.reduce((sum, o) => sum + o.price, 0);
    return {
      name: format(date, 'EEE', { locale: es }),
      fullDate: format(date, "d 'de' MMMM", { locale: es }),
      revenue
    };
  });

  const chartTotal = chartData.reduce((sum, d) => sum + d.revenue, 0);

  // Pie Chart Data: Order Status
  const statusData = [
    { name: 'Pendientes', value: pendingOrders, color: '#eab308' },
    { name: 'Completados', value: completedOrders, color: '#22c55e' },
    { name: 'Cancelados', value: orders.filter(o => o.status === 'cancelled').length, color: '#ef4444' },
  ].filter(d => d.value > 0);

  const stats = [
    { 
      title: 'Ingresos Totales', 
      value: `$${totalRevenue.toLocaleString()}`, 
      description: 'De pedidos completados',
      icon: TrendingUp, 
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10'
    },
    { 
      title: 'Pedidos Activos', 
      value: pendingOrders, 
      description: 'Pendientes de entrega',
      icon: Clock, 
      color: 'text-yellow-500',
      bg: 'bg-yellow-500/10'
    },
    { 
      title: 'Clientes', 
      value: totalClients, 
      description: 'Registrados en total',
      icon: Users, 
      color: 'text-blue-500',
      bg: 'bg-blue-500/10'
    },
  ];

  return (
    <div className="space-y-8 pb-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground text-base sm:text-lg">Resumen de tu negocio.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <Dialog open={isClientDialogOpen} onOpenChange={setIsClientDialogOpen}>
            <DialogTrigger render={
              <Button className="rounded-xl shadow-lg shadow-primary/20 w-full sm:w-auto py-6 sm:py-2">
                <UserPlus className="mr-2 h-4 w-4" />
                Nuevo Cliente
              </Button>
            } />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar Nuevo Cliente</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleClientSubmit} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre Completo</Label>
                  <Input 
                    id="name" 
                    value={clientForm.name} 
                    onChange={(e) => setClientForm({...clientForm, name: e.target.value})} 
                    placeholder="Ej: Juan Pérez"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Número de Teléfono</Label>
                  <Input 
                    id="phone" 
                    value={clientForm.phone} 
                    onChange={(e) => setClientForm({...clientForm, phone: e.target.value})} 
                    placeholder="Ej: 123456789"
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" className="w-full">Registrar Cliente</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
            <DialogTrigger render={
              <Button variant="secondary" className="rounded-xl shadow-lg shadow-secondary/20 w-full sm:w-auto py-6 sm:py-2">
                <PackagePlus className="mr-2 h-4 w-4" />
                Nuevo Pedido
              </Button>
            } />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar Nuevo Pedido</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleOrderSubmit} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="orderName">Nombre del Encargo</Label>
                  <Input 
                    id="orderName" 
                    value={orderForm.name} 
                    onChange={(e) => setOrderForm({...orderForm, name: e.target.value})} 
                    placeholder="Ej: Tarta de Chocolate"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Precio</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="price" 
                      type="number"
                      step="0.01"
                      value={orderForm.price} 
                      onChange={(e) => setOrderForm({...orderForm, price: e.target.value})} 
                      className="pl-10"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client">Cliente</Label>
                  <Select 
                    value={orderForm.clientId} 
                    onValueChange={(value) => setOrderForm({...orderForm, clientId: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name} ({client.phone})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <Button type="submit" className="w-full">Registrar Pedido</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <div className="flex items-center justify-center gap-2 text-xs sm:text-sm font-medium bg-muted px-4 py-2.5 sm:py-2 rounded-full">
            <Calendar className="h-4 w-4" />
            {format(new Date(), "d 'de' MMMM, yyyy", { locale: es })}
          </div>
        </div>
      </div>

      <OrderInsights clients={clients} orders={orders} />

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className={`${stat.bg} p-2 rounded-lg`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <Badge variant="ghost" className="text-xs font-normal">
                <ArrowUpRight className="h-3 w-3 mr-1 text-emerald-500" />
                +12%
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        {/* Revenue Chart */}
        <Card className="lg:col-span-4 border-none shadow-sm bg-card/50 backdrop-blur-sm overflow-hidden">
          <CardHeader className="p-4 sm:p-6 flex flex-row items-start justify-between">
            <div>
              <CardTitle className="text-lg sm:text-xl">Rendimiento de Ventas</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Ingresos generados en los últimos 7 días.</CardDescription>
            </div>
            <div className="text-right">
              <p className="text-lg sm:text-2xl font-bold text-primary">${chartTotal.toLocaleString()}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wider">Total periodo</p>
            </div>
          </CardHeader>
          <CardContent className="p-2 sm:p-6 sm:pl-2">
            <div className="h-[250px] sm:h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.6}/>
                      <stop offset="50%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="strokeGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#a855f7" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12, fontWeight: 500 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    tickFormatter={(value) => `$${value}`}
                    width={45}
                  />
                  <Tooltip 
                    cursor={{ stroke: '#8b5cf6', strokeWidth: 1, strokeDasharray: '4 4' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-card/80 border border-border p-3 rounded-xl shadow-xl backdrop-blur-md">
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">
                              {payload[0].payload.fullDate}
                            </p>
                            <p className="text-sm font-bold text-primary">
                              ${payload[0].value?.toLocaleString()}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="url(#strokeGradient)" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                    activeDot={{ 
                      r: 7, 
                      fill: '#8b5cf6', 
                      stroke: '#fff', 
                      strokeWidth: 3,
                      className: "shadow-xl"
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card className="lg:col-span-3 border-none shadow-sm bg-card/50 backdrop-blur-sm overflow-hidden">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl">Estado de Pedidos</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Distribución actual de encargos.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="h-[200px] sm:h-[300px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '12px',
                      fontSize: '12px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-4">
              {statusData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs font-medium">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Orders */}
        <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Pedidos Recientes</CardTitle>
              <CardDescription>Últimos encargos registrados.</CardDescription>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs"
              onClick={() => document.getElementById('orders')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Ver todos
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {orders.slice(0, 5).map((order) => {
                const client = clients.find(c => c.id === order.clientId);
                return (
                  <div key={order.id} className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{order.name}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-muted-foreground truncate">{client?.name || 'Cliente desconocido'}</p>
                        {order.dueDate && (
                          <span className="text-[10px] bg-primary/5 text-primary px-1.5 py-0.5 rounded-md font-medium">
                            {format(order.dueDate.toDate ? order.dueDate.toDate() : new Date(order.dueDate), "d MMM", { locale: es })}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <p className="text-sm font-bold">${order.price}</p>
                      {getStatusBadge(order.status)}
                    </div>
                  </div>
                );
              })}
              {orders.length === 0 && (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-muted/20 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No hay pedidos registrados.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* New Clients */}
        <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Nuevos Clientes</CardTitle>
              <CardDescription>Tus clientes más recientes.</CardDescription>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs"
              onClick={() => document.getElementById('clients')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Ver todos
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {clients.slice(0, 5).map((client) => (
                <div key={client.id} className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                    <Users className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{client.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{client.phone}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-full"
                    onClick={() => document.getElementById('clients')?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    <ArrowUpRight className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {clients.length === 0 && (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted/20 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No hay clientes registrados.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
