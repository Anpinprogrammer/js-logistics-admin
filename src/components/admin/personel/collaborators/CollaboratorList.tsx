import { useState } from 'react'
import { useIsMobile } from '@/hooks/use-mobile';
import CollaboratorsTable from './CollaboratorsTable';
import CollaboratorsDialog from './CollaboratorsDialog';
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Truck, Search, UserPlus, PlusCircle, Pencil, Users, TrendingUp, BikeIcon, MapPin, Trash2 } from 'lucide-react'

const collaborators = [
  {
    id: '1',
    full_name: 'Andres Pineda',
    rol: ['courier'],
    email: 'andresspineda@gmail.com',
    phone: '3146098819'
  },
  {
    id: '2',
    full_name: 'Andres Pineda 2',
    rol: ['picker'],
    email: 'andresspineda@gmail.com',
    phone: '3146098819'
  },
  {
    id: '3',
    full_name: 'Andres Pineda 3',
    rol: ['courier', 'picker'],
    email: 'andresspineda@gmail.com',
    phone: '3146098819'
  }
]

const CollaboratorList = () => {

  const isMobile = useIsMobile();
  const [openDialog, setOpenDialog] = useState(false)
  const [mode, setMode] = useState< 'create' | 'edit' >('create')
  const [editCollaborator, setEditCollaborator] = useState(null)
  const [deleteCollaborator, setDeleteCollaborator] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const isLoading = false;
  const error = false;

  const couriers = collaborators.filter(col => col.rol.includes('courier')) || [];
  const pickers = collaborators.filter(col => col.rol.includes('picker')) || [];

  const handleEditDialog = () => {

  }

  return (
     <div className="p-4 md:p-6 text-foreground">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-start md:gap-4 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Colaboradores</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {collaborators?.length ?? 0} colaborador{(collaborators?.length ?? 0) !== 1 ? 'es' : ''} registrado{(collaborators?.length ?? 0) !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl px-4 md:px-5 py-2.5 md:py-3 shadow-sm transition-all cursor-pointer text-sm md:text-base shrink-0"
          onClick={() => setOpenDialog(true)}
        >
          <PlusCircle className="w-5 h-5" />
          {isMobile ? 'Nuevo Colaborador' : 'Agregar Colaborador'}
        </button>
      </div>

      <Tabs defaultValue='all'>
        <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-center md:gap-4">

        
          <TabsList>
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Todos
              <Badge variant="secondary">{collaborators?.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="couriers" className="flex items-center gap-2">
              <BikeIcon className="w-4 h-4" />
              Mensajeros
              <Badge variant="destructive" className='bg-green-800 hover:bg-green-600'>{couriers?.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="pickers" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Patinadores
              <Badge variant="destructive">{pickers.length}</Badge>
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center w-full h-[40px] md:w-1/2 bg-background rounded-xl shadow-sm border border-border focus-within:ring-2 focus-within:ring-primary transition-all">
            <Search className="w-5 h-5 md:w-6 md:h-6 ml-3 md:ml-4 text-muted-foreground shrink-0" />
            <input
              type="text"
              placeholder="Buscar por nombre, empresa o documento"
              className="w-full py-2.5 md:py-3 px-3 md:px-4 bg-transparent outline-none text-sm md:text-base text-foreground placeholder-muted-foreground"
              onChange={() => {}}
              value={''}
            />
          </div>
        </div>

        <div className='mt-4'>
          <TabsContent value='all'>
            <CollaboratorsTable 
              isLoading={isLoading}
              error={error}
              collaborators={collaborators}
              setEditCollaborator={setEditCollaborator}
              setDeleteCollaborator={setDeleteCollaborator}
            />
          </TabsContent>

          <TabsContent value='couriers'>
            <CollaboratorsTable 
              isLoading={isLoading}
              error={error}
              collaborators={couriers}
              setEditCollaborator={setEditCollaborator}
              setDeleteCollaborator={setDeleteCollaborator}
            />
          </TabsContent>

          <TabsContent value='pickers'>
            <CollaboratorsTable 
              isLoading={isLoading}
              error={error}
              collaborators={pickers}
              setEditCollaborator={setEditCollaborator}
              setDeleteCollaborator={setDeleteCollaborator}
            />
          </TabsContent>
        </div>
      </Tabs>

      <CollaboratorsDialog 
        openDialog={openDialog}
        setOpenDialog={setOpenDialog}
        mode={mode}
        collaborator={editCollaborator}
      />

    </div>
  )
}

export default CollaboratorList