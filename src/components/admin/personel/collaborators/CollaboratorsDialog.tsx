import { useState, useEffect }  from 'react'
import api from '@/services/api';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const rolOptions = ['courier', 'picker']

interface Collaborator {
  id: string;
  full_name: string;
  rol: string[];
  email: string;
  phone?: string | null;
}

interface CreateCollaboratorProps {
    openDialog: boolean;
    setOpenDialog: React.Dispatch<React.SetStateAction<boolean>>
    mode: 'create' | 'edit';
    collaborator?: Collaborator | null;
}

const CollaboratorsDialog = ({ openDialog, setOpenDialog, mode, collaborator } : CreateCollaboratorProps) => {

    useEffect(() => {
    if (collaborator && mode === 'edit') {
      setFullName(collaborator.full_name);
      setPhone(collaborator.phone || '');
    }
    if (!open) {
      setEmail('');
      setPassword('');
      setFullName('');
      setPhone('');
    }
  }, [collaborator, mode, open]);

    const queryClient = useQueryClient();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [saving, setSaving] = useState(false);
    const [roles, setRoles] = useState([])

    const handleSelectedRol = (col) => {
      setRoles(
        prev =>
          prev.includes(col) 
            ? prev.filter( p => p !== col)
            : [...prev, col]
      )
    }

    const handleSave = async () => {
    if (mode === 'create' && (!email || !password || !fullName)) {
      toast.error('Email, contraseña y nombre son obligatorios');
      return;
    }
    if (mode === 'create' && password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (mode === 'edit' && !fullName) {
      toast.error('El nombre es obligatorio');
      return;
    }
    if (password && password.length > 0 && password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if(!roles.length) {
      toast.error('No ha seleccionado ningun rol')
      return
    }

    setSaving(true);
    try {
      if (mode === 'create') {
        const { data } = await api.post('/collaborators', { email, password, full_name: fullName, phone, roles })
        
        toast.success(`Mensajero "${fullName}" creado exitosamente`);
      } else {
        const body: any = { user_id: collaborator!.id, full_name: fullName, phone };
        if (password) body.password = password;
        const { data } = await api.put(`/couriers/${body.user_id}`, { body })
        /** 
        const { data, error } = await supabase.functions.invoke('update-courier', { body });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        */
        toast.success(`Mensajero "${fullName}" actualizado`);
      }

      queryClient.invalidateQueries({ queryKey: ['couriers'] });
      setOpenDialog(false);
    } catch (error: any) {
      toast.error(error.message || `Error al ${mode === 'create' ? 'crear' : 'actualizar'} mensajero`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={openDialog} onOpenChange={setOpenDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Agregar Colaborador' : 'Editar Colaborador'}</DialogTitle>
          <DialogDescription>
            {mode === 'create' ? 'Crea una cuenta de mensajero nueva' : 'Modifica los datos del mensajero'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Nombre completo *</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nombre del mensajero" />
          </div>
          {mode === 'create' && (
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="correo@ejemplo.com" />
            </div>
          )}
          <div className="space-y-2">
            <Label>Selecciona el Rol *</Label>
            <div className="flex flex-col space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="role-courier" 
                  value="courier" 
                  checked={roles.includes('courier')} 
                  onCheckedChange={() =>  handleSelectedRol("courier")}
                />
                <Label htmlFor="role-courier" className="font-normal cursor-pointer">Mensajero</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="role-picker" 
                  value="picker" 
                  checked={roles.includes('picker')}
                  onCheckedChange={() => handleSelectedRol("picker")}
                />
                <Label htmlFor="role-picker" className="font-normal cursor-pointer">Patinador</Label>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label>{mode === 'create' ? 'Contraseña *' : 'Nueva contraseña (dejar vacío para no cambiar)'}</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={mode === 'create' ? 'Mínimo 6 caracteres' : '••••••••'} />
          </div>
          <div className="space-y-2">
            <Label>Teléfono (opcional)</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="3001234567" />
          </div>
          <Button className="w-full" onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {mode === 'create' ? 'Crear Mensajero' : 'Guardar Cambios'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default CollaboratorsDialog