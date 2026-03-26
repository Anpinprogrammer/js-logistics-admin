import React from 'react'
import { useIsMobile } from '@/hooks/use-mobile';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Pencil, Trash2 } from 'lucide-react';
import { rol } from '@/utils';

interface Collaborator {
  id: string;
  full_name: string;
  rol: string[];
  email: string;
  phone?: string | null;
}

interface CollaboratorTableProps {
    isLoading: boolean;
    error: boolean;
    collaborators: Collaborator[];
    setEditCollaborator: React.Dispatch<any>;
    setDeleteCollaborator: React.Dispatch<any>;
}

const CollaboratorsTable = ({ isLoading, error, collaborators, setEditCollaborator, setDeleteCollaborator } : CollaboratorTableProps) => {

    const isMobile = useIsMobile()

  return (
      <div className="bg-background shadow-md rounded-xl border border-border">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
              <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin" />
            </div>
          </div>
        ) : error ? (
          <div className="text-center text-destructive py-12 text-sm">
            Error al cargar los administradores. Por favor, intenta de nuevo.
          </div>
        ) : isMobile ? (
          /* ── Mobile cards ── */
          <div className="divide-y divide-border">
            {collaborators.length === 0 ? (
              <div className="text-center text-muted-foreground py-12 text-sm">
                No se encontraron administradores.
              </div>
            ) : (
              collaborators.map((collaborator) => (
                <div key={collaborator.id} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-primary font-bold text-sm">
                          {collaborator.full_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-foreground truncate flex items-center gap-2">
                          {collaborator.full_name}
                        </div>
                        <div className="text-xs text-muted-foreground">{collaborator.email}</div>
                        {collaborator.phone && <div className="text-xs text-muted-foreground">{collaborator.phone}</div>}
                        <div className="text-xs text-muted-foreground mt-1">
                          Desde {format(new Date(), 'dd MMM yyyy', { locale: es })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => setEditCollaborator(collaborator)}
                        className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                     
                        <button
                          onClick={() => setDeleteCollaborator(collaborator)}
                          className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                     
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          /* ── Desktop table ── */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-muted border-b border-border text-muted-foreground uppercase text-xs">
                <tr>
                  <th className="p-4 font-semibold">Colaborador</th>
                  <th className="p-4 font-semibold">Roles</th>
                  <th className="p-4 font-semibold">Email</th>
                  <th className="p-4 font-semibold">Teléfono</th>
                  <th className="p-4 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {collaborators.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center text-muted-foreground py-12 text-sm">
                      No se encontraron administradores.
                    </td>
                  </tr>
                ) : (
                  collaborators.map((collaborator) => (
                    <tr key={collaborator.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="text-primary font-bold text-sm">
                              {collaborator.full_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="font-medium text-foreground flex items-center gap-2">
                            {collaborator.full_name}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-xs text-muted-foreground">
                         {collaborator.rol.map( (r, i) => (
                            <div key={i}>
                            <p>{rol[r]}</p>
                            </div>
                         ))}
                      </td>
                      <td className="p-4 text-sm text-foreground">{collaborator.email}</td>
                      <td className="p-4 text-sm text-foreground">
                        {collaborator.phone || <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditCollaborator(collaborator)}
                            className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                            title="Editar administrador"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteCollaborator(collaborator)}
                            className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                            title="Eliminar administrador"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
  )
}

export default CollaboratorsTable