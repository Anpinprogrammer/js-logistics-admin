import { useState } from 'react';
import { Settings, RotateCcw, Loader2 } from 'lucide-react';
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function SettingsPage() {
  const [resetting, setResetting] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const handleReset = async () => {
    setResetting(true);
    try {
      // Delete audit log first (FK reference to deliveries)
      await supabase.from('delivery_audit_log').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      // Delete all deliveries
      const { error } = await supabase.from('deliveries').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;

      toast({ title: 'Sistema reiniciado correctamente', description: 'Todas las entregas han sido eliminadas.' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'No se pudo reiniciar el sistema', variant: 'destructive' });
    } finally {
      setResetting(false);
      setOpen(false);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Settings className="w-6 h-6 text-primary" />
        Configuración
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Próximamente</CardTitle>
          <CardDescription>
            Configuración de la aplicación, períodos de pago, y más opciones estarán disponibles aquí.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">Zona de peligro</CardTitle>
          <CardDescription>
            Acciones irreversibles que afectan los datos del sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="gap-2">
                <RotateCcw className="w-4 h-4" />
                Reiniciar sistema
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Seguro que deseas borrar todas las entregas?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. Se eliminarán todos los registros de entregas y su historial de auditoría. Los usuarios, configuraciones y mensajeros se mantendrán intactos.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={resetting}>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleReset}
                  disabled={resetting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {resetting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {resetting ? 'Reiniciando...' : 'Sí, reiniciar'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
