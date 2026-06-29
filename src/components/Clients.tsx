import * as React from "react"
import { useState } from 'react';
import { useClients } from '../hooks/useClients';
import { useGmail } from '../hooks/useGmail';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from './ui/dialog';
import { Label } from './ui/label';
import { Search, Pencil, Trash2, Phone, Users, Download, Mail, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function Clients() {
  const { clients, addClient, editClient, removeClient } = useClients();
  const [search, setSearch] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);
  const [emailClient, setEmailClient] = useState<any>(null);
  const [emailData, setEmailData] = useState({ subject: '', message: '' });
  const [sendingEmail, setSendingEmail] = useState(false);
  const { sendEmail } = useGmail();
  
  const [formData, setFormData] = useState({ name: '', phone: '', email: '' });

  const filteredClients = clients.filter(c => 
    (c.name || '').toLowerCase().includes(search.toLowerCase()) || 
    (c.phone || '').includes(search)
  );

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    if (editingClient) {
      await editClient(editingClient.id, formData.name, formData.phone, formData.email);
      toast.success('Cliente actualizado');
    } else {
      await addClient(formData.name, formData.phone, formData.email);
      toast.success('Cliente registrado');
    }
    
    setIsAddOpen(false);
    setEditingClient(null);
    setFormData({ name: '', phone: '', email: '' });
  };

  const handleEdit = (client: any) => {
    setEditingClient(client);
    setFormData({ name: client.name, phone: client.phone, email: client.email || '' });
    setIsAddOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setClientToDelete(id);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (clientToDelete) {
      await removeClient(clientToDelete);
      toast.success('Cliente eliminado');
      setIsDeleteOpen(false);
      setClientToDelete(null);
    }
  };

  const handleExportCSV = () => {
    if (filteredClients.length === 0) {
      toast.error('No hay clientes para exportar');
      return;
    }
    const csvData = filteredClients.map(c => ({
      Id: c.id,
      Nombre: c.name,
      Telefono: c.phone,
      Email: c.email || 'Sin correo'
    }));
    const headers = Object.keys(csvData[0]).join(',');
    const rows = csvData.map(row => 
      Object.values(row).map(val => `"${val}"`).join(',')
    ).join('\n');
    const csv = `sep=,\n${headers}\n${rows}`;
    
    // Add BOM for compatibility
    const finalCsvData = `\uFEFF${csv}`;
    const blob = new Blob([finalCsvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `clientes_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Clientes exportados exitosamente');
  };

  const handleSendEmail = async (e: any) => {
    e.preventDefault();
    if (!emailData.subject || !emailData.message) {
      toast.error('Completa los campos del correo');
      return;
    }
    setSendingEmail(true);
    try {
      await sendEmail(emailClient.email, emailData.subject, emailData.message);
      toast.success('Correo enviado correctamente');
      setEmailClient(null);
      setEmailData({ subject: '', message: '' });
    } catch (error) {
      console.error(error);
      toast.error('Error al enviar el correo. ¿Has autorizado el uso de Gmail?');
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Clientes</h2>
          <p className="text-muted-foreground">Gestiona la información de tus clientes.</p>
        </div>
        <Button variant="outline" onClick={handleExportCSV}>
          <Download className="h-4 w-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre o teléfono..."
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
                <TableHead className="min-w-[200px]">Nombre</TableHead>
                <TableHead className="min-w-[150px]">Contacto</TableHead>
                <TableHead className="text-right min-w-[100px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Phone className="mr-2 h-3 w-3" />
                        {client.phone}
                      </div>
                      {client.email && (
                        <div className="flex items-center">
                          <Mail className="mr-2 h-3 w-3" />
                          {client.email}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {client.email && (
                        <Button variant="ghost" size="icon" className="text-blue-500" onClick={() => setEmailClient(client)}>
                          <Send className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(client)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteClick(client.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y">
          {filteredClients.map((client) => (
            <div key={client.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="font-bold text-lg leading-none">{client.name}</p>
                  <div className="flex items-center text-sm text-muted-foreground pt-1">
                    <Phone className="mr-2 h-4 w-4 text-primary" />
                    <span className="font-medium">{client.phone}</span>
                  </div>
                  {client.email && (
                    <div className="flex items-center text-sm text-muted-foreground pt-1">
                      <Mail className="mr-2 h-4 w-4 text-primary" />
                      <span className="font-medium">{client.email}</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-1">
                  {client.email && (
                    <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl text-blue-500 border-blue-500/20" onClick={() => setEmailClient(client)}>
                      <Send className="h-4 w-4" />
                    </Button>
                  )}
                  <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl" onClick={() => handleEdit(client)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl text-destructive border-destructive/20" onClick={() => handleDeleteClick(client.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredClients.length === 0 && (
          <div className="text-center py-12 px-4">
            <Users className="h-12 w-12 text-muted/20 mx-auto mb-3" />
            <p className="text-muted-foreground">No se encontraron clientes.</p>
          </div>
        )}
      </div>

      <Dialog open={isAddOpen} onOpenChange={(open) => {
        setIsAddOpen(open);
        if (!open) setEditingClient(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre Completo</Label>
              <Input 
                id="name" 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                placeholder="Ej: Juan Pérez"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Número de Teléfono</Label>
              <Input 
                id="phone" 
                value={formData.phone} 
                onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                placeholder="Ej: 123456789"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico (Opcional)</Label>
              <Input 
                id="email" 
                type="email"
                value={formData.email} 
                onChange={(e) => setFormData({...formData, email: e.target.value})} 
                placeholder="Ej: correo@ejemplo.com"
              />
            </div>
            <DialogFooter>
              <Button type="submit" className="w-full">
                {editingClient ? 'Guardar Cambios' : 'Registrar Cliente'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar cliente?</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground">
              ¿Estás seguro de que quieres eliminar este cliente? Se eliminarán también todos sus pedidos asociados. Esta acción no se puede deshacer.
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

      <Dialog open={!!emailClient} onOpenChange={(open) => !open && setEmailClient(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Correo a {emailClient?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSendEmail} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Asunto</Label>
              <Input 
                id="subject" 
                value={emailData.subject} 
                onChange={(e) => setEmailData({...emailData, subject: e.target.value})} 
                placeholder="Asunto del correo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Mensaje</Label>
              <textarea 
                id="message" 
                value={emailData.message} 
                onChange={(e) => setEmailData({...emailData, message: e.target.value})} 
                placeholder="Escribe tu mensaje aquí..."
                className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <DialogFooter>
              <Button type="submit" className="w-full" disabled={sendingEmail}>
                {sendingEmail ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                {sendingEmail ? 'Enviando...' : 'Enviar Correo'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
