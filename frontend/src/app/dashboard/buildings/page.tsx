'use client';

import {useCallback, useMemo, useState} from 'react';
import {Building2, Plus, MapPin, Search, Trash2, Edit} from 'lucide-react';
import {Button} from '@/components/ui/Button';
import {Input} from '@/components/ui/Input';
import {Badge} from '@/components/ui/Badge';
import {Card} from '@/components/ui/Card';
import {LoadingState} from '@/components/ui/LoadingState';
import {PageHeader} from '@/components/dashboard/PageHeader';
import {BuildingModal} from '@/components/dashboard/buildings/BuildingModal';
import {
  useBuildings,
  useCreateBuilding,
  useDeleteBuilding,
} from '@/hooks/useBuildings';
import {BuildingFormValues} from '@/schemas/building';

export default function BuildingsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const {data: buildings, isLoading} = useBuildings();
  const createMutation = useCreateBuilding();
  const deleteMutation = useDeleteBuilding();

  const filteredBuildings = useMemo(
    () =>
      buildings?.filter(
        b =>
          b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.address.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [buildings, searchQuery],
  );

  const handleCreateBuilding = useCallback(
    (data: BuildingFormValues) => {
      createMutation.mutate(data, {
        onSuccess: () => {
          setIsModalOpen(false);
        },
      });
    },
    [createMutation],
  );

  return (
    <div className="p-8">
      <PageHeader
        title="Edificios"
        description="Gestiona las propiedades y su información general.">
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus className="w-5 h-5" />
          Registrar Edificio
        </Button>
      </PageHeader>

      <div className="mb-6 max-w-md">
        <Input
          type="text"
          placeholder="Buscar por nombre o dirección..."
          icon={<Search className="w-5 h-5" />}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      {isLoading ? (
        <LoadingState message="Cargando edificios..." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBuildings?.map(building => (
            <Card key={building.id} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-blue-500/10 rounded-xl">
                  <Building2 className="w-6 h-6 text-blue-400" />
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    intent="ghost"
                    size="icon"
                    className="w-8 h-8 rounded-full">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    intent="ghost"
                    size="icon"
                    className="w-8 h-8 rounded-full hover:bg-red-500/10 hover:text-red-400 text-gray-400"
                    onClick={() => {
                      if (
                        confirm(
                          '¿Estás seguro de que deseas eliminar este edificio?',
                        )
                      ) {
                        deleteMutation.mutate(building.id);
                      }
                    }}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                {building.name}
              </h3>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-gray-400">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm truncate">{building.address}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500 text-sm">
                  <span>
                    {building.city}, {building.country}
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-white/5 flex justify-between items-center">
                <Badge intent={building.active ? 'success' : 'danger'}>
                  {building.active ? 'Activo' : 'Inactivo'}
                </Badge>
                <button className="text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors">
                  Ver Detalles →
                </button>
              </div>
            </Card>
          ))}

          {!filteredBuildings?.length && (
            <div className="col-span-full py-20 text-center border-2 border-dashed border-white/5 rounded-3xl">
              <p className="text-gray-500">No se encontraron edificios.</p>
            </div>
          )}
        </div>
      )}

      <BuildingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateBuilding}
        isPending={createMutation.isPending}
      />
    </div>
  );
}
