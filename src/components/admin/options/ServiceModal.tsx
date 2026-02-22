import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

interface ServiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (service: ServiceForm) => void;
  initialData?: ServiceForm;
}

export interface ServiceForm {
  name: string;
  type: "standard" | "caja" | "drop" | "terminal";
  active: boolean;
  useCash: boolean;
  generatesProfit: boolean;
  percentageCompany: number;
}

export function ServiceModal({ open, onOpenChange, onSave, initialData }: ServiceModalProps) {
  const [service, setService] = useState<ServiceForm>({
    name: initialData?.name || "",
    type: initialData?.type || "standard",
    active: initialData?.active ?? true,
    useCash: initialData?.useCash ?? false,
    generatesProfit: initialData?.generatesProfit ?? true,
    percentageCompany: initialData?.percentageCompany ?? 30,
  });

  const handleSave = () => {
    onSave(service);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{initialData ? "Editar Servicio" : "Nuevo Servicio"}</DialogTitle>
        </DialogHeader>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Detalles del Servicio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Nombre del servicio */}
            <div className="space-y-1">
              <Label htmlFor="name">Nombre del Servicio *</Label>
              <Input
                id="name"
                value={service.name}
                onChange={(e) => setService({ ...service, name: e.target.value })}
              />
            </div>

            {/* Tipo de servicio */}
            <div className="space-y-1">
              <Label htmlFor="type">Tipo de Servicio *</Label>
              <select
                id="type"
                className="w-full border rounded px-2 py-1"
                value={service.type}
                onChange={(e) => setService({ ...service, type: e.target.value as ServiceForm["type"] })}
              >
                <option value="standard">Standard</option>
                <option value="caja">Caja</option>
                <option value="drop">Drop</option>
                <option value="terminal">Terminal</option>
              </select>
            </div>

            {/* Switches */}
            <div className="flex items-center justify-between">
              <Label>Servicio activo</Label>
              <Switch
                checked={service.active}
                onCheckedChange={(value) => setService({ ...service, active: value })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Usa caja</Label>
              <Switch
                checked={service.useCash}
                onCheckedChange={(value) => setService({ ...service, useCash: value })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Genera ganancia</Label>
              <Switch
                checked={service.generatesProfit}
                onCheckedChange={(value) => setService({ ...service, generatesProfit: value })}
              />
            </div>

            {/* Porcentaje de ganancia de la empresa */}
            {service.generatesProfit && (
              <div className="space-y-1">
                <Label htmlFor="percentage">Porcentaje de la empresa (%)</Label>
                <Input
                  id="percentage"
                  type="number"
                  step={1}
                  min={0}
                  max={100}
                  value={service.percentageCompany}
                  onChange={(e) => setService({ ...service, percentageCompany: Number(e.target.value) })}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave}>{initialData ? "Actualizar" : "Guardar"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
