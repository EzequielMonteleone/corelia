'use client';

import {useState} from 'react';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {
  Building2,
  Plus,
  MapPin,
  Search,
  Loader2,
  Trash2,
  Edit,
  X,
} from 'lucide-react';
import {cn} from '@/lib/utils';
import {
  useBuildings,
  useCreateBuilding,
  useDeleteBuilding,
} from '@/hooks/useBuildings';
import {buildingSchema, BuildingFormValues} from '@/schemas/building';

export default function BuildingsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const {data: buildings, isLoading} = useBuildings();
  const createMutation = useCreateBuilding();
  const deleteMutation = useDeleteBuilding();

  const {
    register,
    handleSubmit,
    reset,
    formState: {errors},
  } = useForm<BuildingFormValues>({
    resolver: zodResolver(buildingSchema),
  });

  const filteredBuildings = buildings?.filter(
    b =>
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.address.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const onSubmit = (data: BuildingFormValues) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        setIsModalOpen(false);
        reset();
      },
    });
  };

  return (
    <div className="p-8">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Edificios</h1>
          <p className="text-gray-400">
            Gestiona las propiedades y su información general.
          </p>
        </div>
        <button
          onClick={() => {
            setIsModalOpen(true);
            reset();
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-all shadow-lg shadow-blue-500/20 font-medium">
          <Plus className="w-5 h-5" />
          Registrar Edificio
        </button>
      </header>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <input
          type="text"
          placeholder="Buscar por nombre o dirección..."
          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500/50 transition-all"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
          <p className="text-gray-400 font-medium">Cargando edificios...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBuildings?.map(building => (
            <div
              key={building.id}
              className="group relative bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-blue-500/30 transition-all hover:bg-white/[0.07]">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-blue-500/10 rounded-xl">
                  <Building2 className="w-6 h-6 text-blue-400" />
                </div>
                <div className="flex items-center gap-1">
                  <button className="p-2 text-gray-500 hover:text-white transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (
                        confirm(
                          '¿Estás seguro de que deseas eliminar este edificio?',
                        )
                      ) {
                        deleteMutation.mutate(building.id);
                      }
                    }}
                    className="p-2 text-gray-500 hover:text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
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
                <span
                  className={cn(
                    'text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-md',
                    building.active
                      ? 'bg-green-500/10 text-green-400'
                      : 'bg-red-500/10 text-red-400',
                  )}>
                  {building.active ? 'Activo' : 'Inactivo'}
                </span>
                <button className="text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors">
                  Ver Detalles →
                </button>
              </div>
            </div>
          ))}

          {!filteredBuildings?.length && (
            <div className="col-span-full py-20 text-center border-2 border-dashed border-white/5 rounded-3xl">
              <p className="text-gray-500">No se encontraron edificios.</p>
            </div>
          )}
        </div>
      )}

      {/* RHF Modal for Creation */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#121212] border border-white/10 rounded-3xl p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Nuevo Edificio</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-gray-500 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">
                  Nombre
                </label>
                <input
                  {...register('name')}
                  className={cn(
                    'w-full bg-white/5 border rounded-xl p-3 text-white focus:outline-none transition-all',
                    errors.name
                      ? 'border-red-500/50 focus:border-red-500'
                      : 'border-white/10 focus:border-blue-500/50',
                  )}
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-400">
                    {errors.name.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">
                  Dirección
                </label>
                <input
                  {...register('address')}
                  className={cn(
                    'w-full bg-white/5 border rounded-xl p-3 text-white focus:outline-none transition-all',
                    errors.address
                      ? 'border-red-500/50 focus:border-red-500'
                      : 'border-white/10 focus:border-blue-500/50',
                  )}
                />
                {errors.address && (
                  <p className="mt-1 text-xs text-red-400">
                    {errors.address.message}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">
                    Ciudad
                  </label>
                  <input
                    {...register('city')}
                    className={cn(
                      'w-full bg-white/5 border rounded-xl p-3 text-white focus:outline-none transition-all',
                      errors.city
                        ? 'border-red-500/50 focus:border-red-500'
                        : 'border-white/10 focus:border-blue-500/50',
                    )}
                  />
                  {errors.city && (
                    <p className="mt-1 text-xs text-red-400">
                      {errors.city.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">
                    País
                  </label>
                  <input
                    {...register('country')}
                    className={cn(
                      'w-full bg-white/5 border rounded-xl p-3 text-white focus:outline-none transition-all',
                      errors.country
                        ? 'border-red-500/50 focus:border-red-500'
                        : 'border-white/10 focus:border-blue-500/50',
                    )}
                  />
                  {errors.country && (
                    <p className="mt-1 text-xs text-red-400">
                      {errors.country.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                  {createMutation.isPending
                    ? 'Registrando...'
                    : 'Registrar Edificio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
