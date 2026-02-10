import { useState, FormEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Eye, EyeOff, Truck, User } from 'lucide-react';

export function LoginFormTest() {
  const { signIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  const [state, setState] = useState<'Admin' | 'Mensajero'>('Admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    console.log('Tipo de usuario:', state);
    console.log('Usuario:', email);
    
    // Aquí puedes adaptar la lógica según si es Admin o Mensajero
    const { error } = await signIn(email, password);
    
    if (error) {
      setError(error.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gray-100">
      {/* COLUMNA IZQUIERDA */}
      <div className="hidden lg:flex flex-col justify-center items-center w-1/2 bg-gradient-to-br from-blue-700 to-sky-500 text-white p-10 relative rounded-r-[4rem] shadow-lg">
        {/* Puedes reemplazar este bloque de texto con una imagen */}
        <h1 className="text-5xl font-bold leading-tight mb-4">
          Bienvenido a <br /> JS Logistics
        </h1>
        <p className="text-lg text-blue-100 max-w-md text-center">
          Simplifica tu gestión de envíos con nuestra plataforma inteligente.  
          Inicia sesión para acceder a tus herramientas administrativas.
        </p>
        <div className="absolute bottom-8 text-sm text-blue-200">
          © {new Date().getFullYear()} JS Logistics
        </div>
      </div>

      {/* COLUMNA DERECHA */}
      <div className="flex flex-1 justify-center items-center px-6 sm:px-10 bg-white shadow-2xl lg:rounded-l-[4rem]">
        <div className="w-full max-w-md py-10">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg mb-6">
            {state === 'Admin' ? (
              <Truck className="w-8 h-8 text-white" />
            ) : (
              <User className="w-8 h-8 text-white" />
            )}
            
          </div>
          
          <h2 className="text-2xl sm:text-3xl font-semibold text-gray-800 text-center mb-8">
            Iniciar Sesión{' '}
            <span className="text-blue-600">
              {state === 'Admin' ? 'Admin' : 'Mensajero'}
            </span>
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Correo
              </label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Tu Correo"
                className="w-full p-3 rounded-lg border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-blue-400 outline-none"
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
                  className="w-full p-3 pr-12 rounded-lg border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-blue-400 outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Iniciando sesión...
                </>
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          {/* TOGGLE ENTRE ADMIN Y MENSAJERO */}
          <div className="text-center mt-6 text-sm text-gray-600">
            {state === 'Admin' ? (
              <p>
                ¿Eres mensajero?{' '}
                <span
                  onClick={() => {
                    setState('Mensajero');
                    setError(null);
                  }}
                  className="text-blue-600 font-semibold cursor-pointer hover:underline"
                >
                  Accede aquí
                </span>
              </p>
            ) : (
              <p>
                ¿Eres administrador?{' '}
                <span
                  onClick={() => {
                    setState('Admin');
                    setError(null);
                  }}
                  className="text-blue-600 font-semibold cursor-pointer hover:underline"
                >
                  Accede aquí
                </span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}