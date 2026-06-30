import * as React from "react"
import { useState } from 'react';
import { useOrders } from '../hooks/useOrders';
import { useClients } from '../hooks/useClients';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from './ui/dialog';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Search, Pencil, Trash2, DollarSign, User, Package, Clock, CheckCircle, XCircle, Calendar as CalendarIcon, List, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn, parseFirestoreDate } from '../lib/utils';

export function Orders() {
  const { orders, addOrder, editOrder, removeOrder } = useOrders();
  const { clients } = useClients();
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({ 
    name: '', 
    price: '', 
    clientId: '',
    status: 'pending' as any,
    dueDate: ''
  });

  const filteredOrders = orders.filter(o => {
    const client = clients.find(c => c.id === o.clientId);
    const searchLower = search.toLowerCase();
    return (
      (o.name || '').toLowerCase().includes(searchLower) ||
      ((client?.name || '').toLowerCase().includes(searchLower)) ||
      ((client?.phone || '').includes(search))
    );
  });

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.clientId) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    const priceNum = parseFloat(formData.price);
    if (isNaN(priceNum)) {
      toast.error('El precio debe ser un número válido');
      return;
    }

    if (editingOrder) {
      const dateParts = formData.dueDate ? formData.dueDate.split('-').map(Number) : null;
      const dueDate = dateParts ? new Date(dateParts[0], dateParts[1] - 1, dateParts[2]) : undefined;
      await editOrder(editingOrder.id, formData.name, priceNum, formData.clientId, formData.status, dueDate);
      toast.success('Pedido actualizado');
    } else {
      const dateParts = formData.dueDate ? formData.dueDate.split('-').map(Number) : null;
      const dueDate = dateParts ? new Date(dateParts[0], dateParts[1] - 1, dateParts[2]) : undefined;
      await addOrder(formData.name, priceNum, formData.clientId, dueDate);
      toast.success('Pedido registrado');
    }
    
    setIsAddOpen(false);
    setEditingOrder(null);
    setFormData({ name: '', price: '', clientId: '', status: 'pending', dueDate: '' });
  };

  const handleEdit = (order: any) => {
    setEditingOrder(order);
    const parsedDate = parseFirestoreDate(order.dueDate);
    setFormData({ 
      name: order.name, 
      price: order.price.toString(), 
      clientId: order.clientId,
      status: order.status,
      dueDate: parsedDate ? format(parsedDate, 'yyyy-MM-dd') : ''
    });
    setIsAddOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setOrderToDelete(id);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (orderToDelete) {
      await removeOrder(orderToDelete);
      toast.success('Pedido eliminado');
      setIsDeleteOpen(false);
      setOrderToDelete(null);
    }
  };

  const handleStatusChange = async (order: any, newStatus: string) => {
    try {
      await editOrder(order.id, order.name, order.price, order.clientId, newStatus as any);
      toast.success(`Estado actualizado a ${newStatus === 'completed' ? 'Completado' : newStatus === 'in_progress' ? 'En Progreso' : newStatus === 'cancelled' ? 'Cancelado' : 'Pendiente'}`);
    } catch (error) {
      toast.error('Error al actualizar el estado');
    }
  };

  const handleExportCSV = () => {
    if (filteredOrders.length === 0) {
      toast.error('No hay pedidos para exportar');
      return;
    }
    const csvData = filteredOrders.map(o => {
      const client = clients.find(c => c.id === o.clientId);
      const parsedDate = parseFirestoreDate(o.dueDate);
      return {
        'Nombre': client ? client.name : 'Desconocido',
        'Pedido': o.name,
        'Precio': o.price,
        'Fecha': parsedDate ? format(parsedDate, 'yyyy-MM-dd') : 'Sin fecha'
      };
    });
    
    // Sort by Nombre, then Fecha
    csvData.sort((a, b) => {
      const nameCompare = a['Nombre'].localeCompare(b['Nombre']);
      if (nameCompare !== 0) return nameCompare;
      return a['Fecha'].localeCompare(b['Fecha']);
    });
    
    const headers = Object.keys(csvData[0]).join(',');
    const rows = csvData.map(row => 
      Object.values(row).map(val => `"${val}"`).join(',')
    ).join('\n');
    const csv = `sep=,\n${headers}\n${rows}`;
    
    // Convert to UTF-16LE with BOM to avoid issues in some applications
    // But since it's just CSV, we will just use standard \uFEFF for Excel compatibility
    const finalCsvData = `\uFEFF${csv}`;
    const blob = new Blob([finalCsvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `pedidos_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Pedidos exportados exitosamente');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': 
        return (
          <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-none shadow-sm px-2.5 py-0.5 flex items-center gap-1.5 font-semibold">
            <Clock className="h-3.5 w-3.5" />
            Pendiente
          </Badge>
        );
      case 'in_progress': 
        return (
          <Badge className="bg-blue-500 hover:bg-blue-600 text-white border-none shadow-sm px-2.5 py-0.5 flex items-center gap-1.5 font-semibold">
            <Package className="h-3.5 w-3.5" />
            En Progreso
          </Badge>
        );
      case 'completed': 
        return (
          <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-none shadow-sm px-2.5 py-0.5 flex items-center gap-1.5 font-semibold">
            <CheckCircle className="h-3.5 w-3.5" />
            Completado
          </Badge>
        );
      case 'cancelled': 
        return (
          <Badge className="bg-rose-500 hover:bg-rose-600 text-white border-none shadow-sm px-2.5 py-0.5 flex items-center gap-1.5 font-semibold">
            <XCircle className="h-3.5 w-3.5" />
            Cancelado
          </Badge>
        );
      default: 
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

    const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

    return (
      <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 flex items-center justify-between border-b bg-muted/30">
          <h3 className="font-bold text-lg capitalize">
            {format(currentMonth, 'MMMM yyyy', { locale: es })}
          </h3>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())}>
              Hoy
            </Button>
            <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-7 border-b bg-muted/10">
          {weekDays.map(day => (
            <div key={day} className="py-2 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 auto-rows-fr">
          {calendarDays.map((day, idx) => {
            const dayOrders = orders.filter(o => {
              const parsedDate = parseFirestoreDate(o.dueDate);
              return parsedDate && isSameDay(parsedDate, day);
            });
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isToday = isSameDay(day, new Date());

            return (
              <div 
                key={idx} 
                className={cn(
                  "min-h-[100px] p-2 border-r border-b last:border-r-0 transition-colors",
                  !isCurrentMonth && "bg-muted/20 text-muted-foreground/50",
                  isToday && "bg-primary/5"
                )}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={cn(
                    "text-sm font-medium h-6 w-6 flex items-center justify-center rounded-full",
                    isToday && "bg-primary text-primary-foreground"
                  )}>
                    {format(day, 'd')}
                  </span>
                </div>
                <div className="space-y-1">
                  {dayOrders.map(order => (
                    <div 
                      key={order.id} 
                      onClick={() => handleEdit(order)}
                      className={cn(
                        "text-[10px] p-1 rounded border truncate cursor-pointer hover:opacity-80 transition-opacity",
                        order.status === 'completed' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700" :
                        order.status === 'cancelled' ? "bg-rose-500/10 border-rose-500/20 text-rose-700" :
                        order.status === 'in_progress' ? "bg-blue-500/10 border-blue-500/20 text-blue-700" :
                        "bg-amber-500/10 border-amber-500/20 text-amber-700"
                      )}
                    >
                      {order.name}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Pedidos</h2>
          <p className="text-muted-foreground">Gestiona los encargos y ventas.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
          <div className="flex bg-muted p-1 rounded-xl self-start">
            <Button 
              variant={view === 'list' ? 'secondary' : 'ghost'} 
              size="sm" 
              className="rounded-lg"
              onClick={() => setView('list')}
            >
              <List className="h-4 w-4 mr-2" />
              Lista
            </Button>
            <Button 
              variant={view === 'calendar' ? 'secondary' : 'ghost'} 
              size="sm" 
              className="rounded-lg"
              onClick={() => setView('calendar')}
            >
              <CalendarIcon className="h-4 w-4 mr-2" />
              Calendario
            </Button>
          </div>
        </div>
      </div>

      {view === 'list' ? (
        <>
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por encargo, cliente o teléfono..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-12 sm:h-10 rounded-xl"
            />
          </div>

          <div className="border rounded-xl overflow-hidden bg-card shadow-sm">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px]">Encargo</TableHead>
                    <TableHead className="min-w-[150px]">Cliente</TableHead>
                    <TableHead className="min-w-[150px]">Fecha de Entrega</TableHead>
                    <TableHead className="min-w-[100px]">Precio</TableHead>
                    <TableHead className="min-w-[120px]">Estado</TableHead>
                    <TableHead className="text-right min-w-[100px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => {
                    const client = clients.find(c => c.id === order.clientId);
                    return (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center text-muted-foreground">
                            <User className="mr-2 h-3 w-3" />
                            {client?.name || 'Cargando...'}
                          </div>
                        </TableCell>
                        <TableCell>
                          {order.dueDate ? (
                            <div className="flex items-center text-sm">
                              <CalendarIcon className="mr-2 h-3 w-3 text-primary" />
                              {(() => {
                                const parsedDate = parseFirestoreDate(order.dueDate);
                                return parsedDate ? format(parsedDate, "d 'de' MMM", { locale: es }) : '';
                              })()}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs italic">Sin fecha</span>
                          )}
                        </TableCell>
                        <TableCell>${(typeof order.price === 'number' ? order.price : parseFloat(order.price || '0')).toLocaleString()}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger render={
                              <button className="focus:outline-none cursor-pointer hover:opacity-80 transition-opacity">
                                {getStatusBadge(order.status)}
                              </button>
                            } />
                            <DropdownMenuContent align="start">
                              <DropdownMenuItem onClick={() => handleStatusChange(order, 'pending')}>
                                Pendiente
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(order, 'in_progress')}>
                                En Progreso
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(order, 'completed')}>
                                Completado
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(order, 'cancelled')}>
                                Cancelado
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(order)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteClick(order.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y">
              {filteredOrders.map((order) => {
                const client = clients.find(c => c.id === order.clientId);
                return (
                  <div key={order.id} className="p-4 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1 min-w-0 mr-2">
                        <p className="font-bold text-lg leading-tight break-words">{order.name}</p>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <User className="mr-1.5 h-3.5 w-3.5" />
                          <span className="truncate">{client?.name || 'Cliente desconocido'}</span>
                        </div>
                        {order.dueDate && (
                          <div className="flex items-center text-xs text-primary font-medium mt-1">
                            <CalendarIcon className="mr-1.5 h-3 w-3" />
                            <span>Entrega: {(() => {
                              const parsedDate = parseFirestoreDate(order.dueDate);
                              return parsedDate ? format(parsedDate, "d 'de' MMMM", { locale: es }) : '';
                            })()}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className="font-bold text-primary text-lg">${(typeof order.price === 'number' ? order.price : parseFloat(order.price || '0')).toLocaleString()}</span>
                        <DropdownMenu>
                          <DropdownMenuTrigger render={
                            <button className="focus:outline-none cursor-pointer">
                              {getStatusBadge(order.status)}
                            </button>
                          } />
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleStatusChange(order, 'pending')}>
                              Pendiente
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(order, 'in_progress')}>
                              En Progreso
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(order, 'completed')}>
                              Completado
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(order, 'cancelled')}>
                              Cancelado
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <Button variant="outline" size="sm" className="rounded-xl h-9 flex-1" onClick={() => handleEdit(order)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </Button>
                      <Button variant="outline" size="sm" className="rounded-xl h-9 flex-1 text-destructive border-destructive/20" onClick={() => handleDeleteClick(order.id)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredOrders.length === 0 && (
              <div className="text-center py-12 px-4">
                <Package className="h-12 w-12 text-muted/20 mx-auto mb-3" />
                <p className="text-muted-foreground">No se encontraron pedidos.</p>
              </div>
            )}
          </div>
        </>
      ) : (
        renderCalendar()
      )}

      <Dialog open={isAddOpen} onOpenChange={(open) => {
        setIsAddOpen(open);
        if (!open) setEditingOrder(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingOrder ? 'Editar Pedido' : 'Nuevo Pedido'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="orderName">Nombre del Encargo</Label>
              <Input 
                id="orderName" 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
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
                  value={formData.price} 
                  onChange={(e) => setFormData({...formData, price: e.target.value})} 
                  className="pl-10"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="client">Cliente</Label>
              <Select 
                value={formData.clientId} 
                onValueChange={(value) => setFormData({...formData, clientId: value})}
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
            <div className="space-y-2">
              <Label htmlFor="dueDate">Fecha de Entrega (Opcional)</Label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="dueDate" 
                  type="date"
                  value={formData.dueDate} 
                  onChange={(e) => setFormData({...formData, dueDate: e.target.value})} 
                  className="pl-10"
                />
              </div>
            </div>
            {editingOrder && (
              <div className="space-y-2">
                <Label htmlFor="status">Estado</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => setFormData({...formData, status: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="in_progress">En Progreso</SelectItem>
                    <SelectItem value="completed">Completado</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <DialogFooter>
              <Button type="submit" className="w-full">
                {editingOrder ? 'Guardar Cambios' : 'Registrar Pedido'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar pedido?</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground">
              ¿Estás seguro de que quieres eliminar este pedido? Esta acción no se puede deshacer.
            </p>
          </div>
          <DialogFooter className="flex-row gap-2">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)} className="flex-1">
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDelete} className="flex-1">
              Sí, eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
