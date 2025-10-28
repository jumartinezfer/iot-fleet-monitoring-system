import { useEffect, useState } from 'react';
import { useDevicesStore } from '../store/devicesStore';
import { devicesService } from '../services/devices.service';
import { Plus, Car, Calendar, Hash, Loader2, Edit, Trash2, X, Check, Info } from 'lucide-react';
import type { Device } from '../types.ts';

// Página para gestionar dispositivos
const Devices = () => {
  const { devices, setDevices, addDevice } = useDevicesStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [formData, setFormData] = useState({
    deviceId: '',
    name: '',
    model: '',
    licensePlate: '',
  });
    // Función para cargar dispositivos
  const [submitting, setSubmitting] = useState(false);
    // Cargar dispositivos
  useEffect(() => {
    loadDevices();
  }, []);
    // Función para cargar dispositivos
  const loadDevices = async () => {
    try {
        // Cargar dispositivos
      setLoading(true);
      const data = await devicesService.getAll();
      setDevices(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar dispositivos');
    } finally {
      setLoading(false);
    }
  };
    // Función para actualizar datos del dispositivo
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };
    // Función para guardar datos del dispositivo
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
        // Actualizar dispositivo
    try {
      if (editingDevice) {
        const response = await fetch(`http://localhost:3000/devices/${editingDevice.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          },
          // Datos del dispositivo
          body: JSON.stringify({
            name: formData.name,
            model: formData.model,
            licensePlate: formData.licensePlate,
          }),
        });
            // Verificar respuesta
        if (!response.ok) throw new Error('Error al actualizar dispositivo');
            // Cargar dispositivos
        await loadDevices();
        setShowModal(false);
        setEditingDevice(null);
      } else {
        const newDevice = await devicesService.create(formData);
        addDevice(newDevice);
        setShowModal(false);
      }
        // Limpiar formulario
      setFormData({ deviceId: '', name: '', model: '', licensePlate: '' });
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Error al guardar dispositivo');
    } finally {
      setSubmitting(false);
    }
  };
    // Función para editar dispositivo
  const handleEdit = (device: Device) => {
    setEditingDevice(device);
    setFormData({
      deviceId: device.deviceId,
      name: device.name,
      model: device.model || '',
      licensePlate: device.licensePlate || '',
    });
    setShowModal(true);
  };
    // Función para eliminar dispositivo
  const handleDelete = async (device: Device) => {
    if (!window.confirm(`¿Estás seguro de eliminar el dispositivo "${device.name}"?`)) {
      return;
    }
        // Eliminar dispositivo
    try {
      const response = await fetch(`http://localhost:3000/devices/${device.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
        // Verificar respuesta
      if (!response.ok) throw new Error('Error al eliminar dispositivo');
        // Cargar dispositivos
      await loadDevices();
    } catch (err: any) {
      setError(err.message || 'Error al eliminar dispositivo');
    }
  };
    // Función para abrir modal de nuevo dispositivo
  const openNewModal = () => {
    setEditingDevice(null);
    setFormData({ deviceId: '', name: '', model: '', licensePlate: '' });
    setShowModal(true);
  };
    // Mostrar cargando
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
          <Loader2 className="animate-spin text-blue-600 mb-4 mx-auto" size={56} />
          <p className="text-lg font-medium text-gray-700">Cargando dispositivos...</p>
          <p className="text-sm text-gray-500 mt-2">Por favor espera</p>
        </div>
      </div>
    );
  }
    // Vista de listado de dispositivos
  return (
    <div className="space-y-6 lg:space-y-8 fade-in">
      {/* Header con gradiente */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 rounded-2xl shadow-2xl p-6 lg:p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10">
          <Car size={200} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h2 className="text-2xl lg:text-4xl font-bold mb-2">🚗 Gestión de Dispositivos IoT</h2>
            <p className="text-blue-100 text-sm lg:text-base">
              Administra y monitorea toda tu flota vehicular en un solo lugar
            </p>
          </div>
          <button
            onClick={openNewModal}
            className="bg-white text-blue-600 hover:bg-blue-50 font-bold px-6 py-3 lg:px-8 lg:py-4 rounded-xl shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2 text-sm lg:text-base whitespace-nowrap"
          >         
            {/* Botón para abrir modal de nuevo dispositivo */}
            <Plus size={20} />
            Nuevo Dispositivo
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && !showModal && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 lg:p-5 rounded-xl shadow-md">
          <div className="flex items-center">
            <div className="bg-red-100 p-2 rounded-full mr-3">
              <X className="text-red-600" size={20} />
            </div>
            <p className="text-red-700 font-medium text-sm lg:text-base">{error}</p>
          </div>
        </div>
      )}

      {/* Stats rápidos */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
        <div className="bg-white rounded-xl shadow-md p-5 lg:p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium mb-1">Total Dispositivos</p>
              <p className="text-3xl font-bold text-gray-900">{devices.length}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-xl">
              <Car className="text-blue-600" size={28} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-5 lg:p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium mb-1">Activos</p>
              <p className="text-3xl font-bold text-gray-900">
                {devices.filter(d => d.isActive).length}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-xl">
              <Check className="text-green-600" size={28} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-5 lg:p-6 border-l-4 border-gray-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium mb-1">Inactivos</p>
              <p className="text-3xl font-bold text-gray-900">
                {devices.filter(d => !d.isActive).length}
              </p>
            </div>
            <div className="bg-gray-100 p-3 rounded-xl">
              <X className="text-gray-600" size={28} />
            </div>
          </div>
        </div>
      </div>

      {/* Grid de dispositivos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {devices.map((device) => (
          <div 
            key={device.id} 
            className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border-l-4 border-blue-500 transform hover:-translate-y-1"
          >
            <div className="p-5 lg:p-6">
              {/* Header de la tarjeta */}
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-xl flex-shrink-0 shadow-md">
                    <Car className="text-white" size={24} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-lg text-gray-900 truncate">{device.name}</h3>
                    <span
                      className={`inline-block px-3 py-1 text-xs font-bold rounded-full mt-2 ${
                        device.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                        {/* Indicador de activo */}
                      {device.isActive ? '● Activo' : '○ Inactivo'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Información del dispositivo */}
              <div className="space-y-3 mb-5">
                <div className="flex items-center gap-2 text-sm bg-gray-50 p-3 rounded-lg">
                  <Hash size={16} className="text-gray-400 flex-shrink-0" />
                  <span className="text-gray-600 font-medium">ID:</span>
                  <span className="font-mono font-bold text-gray-900 text-xs truncate">{device.deviceId}</span>
                </div>
                {/* Modelo del vehículo */}
                {device.model && (
                  <div className="flex items-center gap-2 text-sm bg-gray-50 p-3 rounded-lg">
                    <Car size={16} className="text-gray-400 flex-shrink-0" />
                    <span className="text-gray-600 font-medium">Modelo:</span>
                    <span className="font-semibold text-gray-900 truncate">{device.model}</span>
                  </div>
                )}
                    {/* Placa */}
                {device.licensePlate && (
                  <div className="flex items-center gap-2 text-sm bg-gray-50 p-3 rounded-lg">
                    <span className="text-gray-400 font-bold text-lg flex-shrink-0">🚗</span>
                    <span className="text-gray-600 font-medium">Placa:</span>
                    <span className="font-bold text-gray-900">{device.licensePlate}</span>
                  </div>
                )}
                    {/* Fecha de registro */}
                <div className="flex items-center gap-2 text-sm bg-gray-50 p-3 rounded-lg">
                  <Calendar size={16} className="text-gray-400 flex-shrink-0" />
                  <span className="text-gray-600 font-medium">Creado:</span>
                  <span className="text-gray-900">{new Date(device.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="grid grid-cols-3 gap-2 pt-4 border-t border-gray-100">
                <button
                  onClick={() => setSelectedDevice(device)}
                  className="col-span-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium py-2.5 px-3 rounded-lg transition-all text-sm flex items-center justify-center gap-1"
                  title="Ver detalles"
                >
                    {/* Botón para ver detalles */}
                  <Info size={16} />
                  <span className="hidden sm:inline">Info</span>
                </button>
                <button
                  onClick={() => handleEdit(device)}
                  className="col-span-1 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 font-medium py-2.5 px-3 rounded-lg transition-all text-sm flex items-center justify-center gap-1"
                  title="Editar"
                >
                    {/* Botón para editar */}
                  <Edit size={16} />
                  <span className="hidden sm:inline">Editar</span>
                </button>
                <button
                  onClick={() => handleDelete(device)}
                  className="col-span-1 bg-red-50 hover:bg-red-100 text-red-700 font-medium py-2.5 px-3 rounded-lg transition-all text-sm flex items-center justify-center gap-1"
                  title="Eliminar"
                >
                    {/* Botón para eliminar */}
                  <Trash2 size={16} />
                  <span className="hidden sm:inline">Borrar</span>
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Empty state */}
        {devices.length === 0 && (
          <div className="col-span-full">
            <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-2xl shadow-xl p-12 lg:p-16 text-center border-2 border-dashed border-purple-300">
              <Car className="mx-auto text-purple-600 mb-6" size={80} />
              <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3">
                No hay dispositivos registrados
              </h3>
              <p className="text-gray-600 text-base lg:text-lg mb-8 max-w-md mx-auto">
                Crea tu primer dispositivo IoT para comenzar a monitorear tu flota vehicular
              </p>
              <button onClick={openNewModal} className="btn btn-primary text-base lg:text-lg px-8 py-4 shadow-lg hover:shadow-xl">
                <Plus size={24} className="inline mr-2" />
                Crear Primer Dispositivo
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal crear/editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 lg:p-8 relative transform transition-all">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-all"
            >
              <X size={24} />
            </button>

            <div className="mb-6">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                {editingDevice ? <Edit className="text-white" size={24} /> : <Plus className="text-white" size={24} />}
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                {editingDevice ? 'Editar Dispositivo' : 'Nuevo Dispositivo IoT'}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {editingDevice ? 'Actualiza la información del dispositivo' : 'Completa los datos del nuevo dispositivo'}
              </p>
            </div>
                {/* Formulario para crear/editar dispositivo */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                  <p className="text-red-700 text-sm font-medium">{error}</p>
                </div>
              )}
                {/* Campos para crear/editar dispositivo */}
              {!editingDevice && (
                <div>
                  <label htmlFor="deviceId" className="label">
                    Device ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="deviceId"
                    name="deviceId"
                    type="text"
                    value={formData.deviceId}
                    onChange={handleChange}
                    className="input"
                    placeholder="DEV-ABCD-1234"
                    required
                    disabled={submitting}
                  />
                  <p className="text-xs text-gray-500 mt-1">Identificador único del dispositivo</p>
                </div>
              )}
                {/* Campo para nombre del vehículo */}
              <div>
                <label htmlFor="name" className="label">
                  Nombre del Vehículo <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  className="input"
                  placeholder="Ej: Camión de Reparto #1"
                  required
                  disabled={submitting}
                />
              </div>
                {/* Campo para modelo del vehículo */}  
              <div>
                <label htmlFor="model" className="label">
                  Modelo del Vehículo
                </label>
                <input
                  id="model"
                  name="model"
                  type="text"
                  value={formData.model}
                  onChange={handleChange}
                  className="input"
                  placeholder="Ej: Toyota Corolla 2024"
                  disabled={submitting}
                />
              </div>
                {/* Campo para placa */}
              <div>
                <label htmlFor="licensePlate" className="label">
                  Placa
                </label>
                <input
                  id="licensePlate"
                  name="licensePlate"
                  type="text"
                  value={formData.licensePlate}
                  onChange={handleChange}
                  className="input"
                  placeholder="Ej: ABC-123"
                  disabled={submitting}
                />
              </div>
                {/* Botones de acción */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                  className="flex-1 btn btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 btn btn-primary"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Guardando...
                    </>
                  ) : (
                    <>
                      {editingDevice ? (
                        <>
                          <Edit size={18} />
                          Actualizar
                        </>
                      ) : (
                        <>
                          <Plus size={18} />
                          Crear
                        </>
                      )}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de detalles */}
      {selectedDevice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 lg:p-8 relative">
            <button
              onClick={() => setSelectedDevice(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-all"
            >
              <X size={24} />
            </button>
                {/* Vista de detalles del dispositivo */}
            <div className="flex items-center gap-4 mb-8">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-4 rounded-2xl shadow-lg">
                <Car className="text-white" size={40} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{selectedDevice.name}</h3>
                <span
                  className={`inline-block px-3 py-1 text-xs font-bold rounded-full mt-2 ${
                    selectedDevice.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {selectedDevice.isActive ? '● Activo' : '○ Inactivo'}
                </span>
              </div>
            </div>
                    {/* ID del dispositivo */}
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border-l-4 border-blue-500">
                <p className="text-sm text-gray-600 font-medium mb-1">Device ID</p>
                <p className="font-mono font-bold text-base text-gray-900">{selectedDevice.deviceId}</p>
              </div>
                    {/* Modelo del vehículo */}
              {selectedDevice.model && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-600 font-medium mb-1">Modelo del Vehículo</p>
                  <p className="font-bold text-base text-gray-900">{selectedDevice.model}</p>
                </div>
              )}
                    {/* Placa */}
              {selectedDevice.licensePlate && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-600 font-medium mb-1">Placa</p>
                  <p className="font-bold text-xl text-gray-900">{selectedDevice.licensePlate}</p>
                </div>
              )}
                    {/* Fecha de registro */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-600 font-medium mb-1">Fecha de Registro</p>
                <p className="font-semibold text-base text-gray-900">
                  {new Date(selectedDevice.createdAt).toLocaleString('es-ES', {
                    dateStyle: 'full',
                    timeStyle: 'short'
                  })}
                </p>
              </div>
            </div>
                    {/* Botón para cerrar modal */}
            <button
              onClick={() => setSelectedDevice(null)}
              className="w-full btn btn-primary mt-8"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Devices;
