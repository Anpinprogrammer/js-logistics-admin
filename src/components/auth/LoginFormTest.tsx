import { useState, FormEvent } from 'react';
import { useAuth } from '@/contexts/AuthContextTest';
import { Loader2, Eye, EyeOff, Truck, ShieldCheck } from 'lucide-react';

export function LoginFormTest() {
  const { signIn, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [mode, setMode] = useState<'Admin' | 'Mensajero'>('Admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const isAdmin = mode === 'Admin';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: signInError, role: userRole } = await signIn(email, password);

    if (signInError) {
      setError(signInError.message);
    } else if (isAdmin && userRole !== 'admin') {
      await signOut();
      setError('Acceso denegado. Esta sección es exclusiva para administradores.');
    }

    setLoading(false);
  };

  const switchMode = (newMode: 'Admin' | 'Mensajero') => {
    setMode(newMode);
    setError(null);
    setEmail('');
    setPassword('');
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gray-100">

      {/* LEFT PANEL */}
      <div
        className={`hidden lg:flex flex-col justify-center items-center w-1/2 text-white p-10 relative rounded-r-[4rem] shadow-lg transition-colors duration-500 ${
          isAdmin
            ? 'bg-gradient-to-br from-slate-800 to-blue-900'
            : 'bg-gradient-to-br from-teal-800 to-emerald-900'
        }`}
      >
        <div
          className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-inner ${
            isAdmin ? 'bg-blue-700/60' : 'bg-teal-700/60'
          }`}
        >
          {isAdmin ? (
            <ShieldCheck className="w-10 h-10 text-white" />
          ) : (
            <Truck className="w-10 h-10 text-white" />
          )}
        </div>

        <h1 className="text-5xl font-bold leading-tight mb-4 text-center">
          {isAdmin ? (
            <>Portal<br />Administrativo</>
          ) : (
            <>Portal de<br />Mensajeros</>
          )}
        </h1>

        <p className={`text-lg max-w-md text-center ${isAdmin ? 'text-blue-200' : 'text-teal-200'}`}>
          {isAdmin
            ? 'Gestiona envíos, usuarios y operaciones desde el panel administrativo de JS Logistics.'
            : 'Accede a tus rutas, paquetes asignados y actualizaciones de entrega en tiempo real.'}
        </p>

        <div className={`absolute bottom-8 text-sm ${isAdmin ? 'text-blue-300' : 'text-teal-300'}`}>
          © {new Date().getFullYear()} JS Logistics
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex flex-1 justify-center items-center px-6 sm:px-10 bg-white shadow-2xl lg:rounded-l-[4rem]">
        <div className="w-full max-w-md py-10">

          {/* TAB SWITCHER */}
          <div className="flex rounded-xl bg-gray-100 p-1 mb-8">
            <button
              type="button"
              onClick={() => switchMode('Admin')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                isAdmin
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              Administrador
            </button>
            <button
              type="button"
              onClick={() => switchMode('Mensajero')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                !isAdmin
                  ? 'bg-white text-teal-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Truck className="w-4 h-4" />
              Mensajero
            </button>
          </div>

          {/* HEADER */}
          <div className="text-center mb-8">
            <div
              className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center shadow-md mb-4 ${
                isAdmin ? 'bg-blue-700' : 'bg-teal-700'
              }`}
            >
              {isAdmin ? (
                <ShieldCheck className="w-8 h-8 text-white" />
              ) : (
                <Truck className="w-8 h-8 text-white" />
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold text-gray-800">
              Iniciar Sesión
            </h2>
            <p className={`text-sm mt-1 font-medium ${isAdmin ? 'text-blue-600' : 'text-teal-600'}`}>
              {isAdmin
                ? 'Acceso exclusivo para administradores'
                : 'Portal de mensajeros y repartidores'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tucorreo@ejemplo.com"
                className={`w-full p-3 rounded-lg border border-gray-300 bg-gray-50 outline-none transition focus:border-transparent ${
                  isAdmin ? 'focus:ring-2 focus:ring-blue-400' : 'focus:ring-2 focus:ring-teal-400'
                }`}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full p-3 pr-12 rounded-lg border border-gray-300 bg-gray-50 outline-none transition focus:border-transparent ${
                    isAdmin ? 'focus:ring-2 focus:ring-blue-400' : 'focus:ring-2 focus:ring-teal-400'
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 p-3 rounded-lg">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full text-white py-3 rounded-lg font-semibold transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center ${
                isAdmin
                  ? 'bg-blue-700 hover:bg-blue-800'
                  : 'bg-teal-700 hover:bg-teal-800'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Iniciando sesión...
                </>
              ) : (
                `Entrar como ${isAdmin ? 'Administrador' : 'Mensajero'}`
              )}
            </button>
          </form>

          {isAdmin && (
            <p className="text-center mt-4 text-xs text-gray-400 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              Solo cuentas con rol de administrador pueden acceder aquí
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
