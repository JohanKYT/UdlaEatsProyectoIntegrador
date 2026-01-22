import { useState, useEffect } from 'react'

const IP_PC = '192.168.100.212'; //Tu IPv4
const API_BASE = `http://${IP_PC}:8081`; 

function App() {
  const [usuario, setUsuario] = useState(null)
  const [productos, setProductos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [filtroCategoria, setFiltroCategoria] = useState('todos') 
  const [seccion, setSeccion] = useState('menu') 
  const [modalAbierto, setModalAbierto] = useState(false)
  const [modalCategorias, setModalCategorias] = useState(false) 
  const [modoEdicion, setModoEdicion] = useState(false)
  const [platoActual, setPlatoActual] = useState({ id: null, nombre: '', descripcion: '', precio: '', imagenUrl: '', disponible: true, categoriaId: '' })
  const [nuevaCategoria, setNuevaCategoria] = useState('')
  const [esRegistro, setEsRegistro] = useState(false) 
  const [loginForm, setLoginForm] = useState({ usuario: '', password: '' })
  const [registroForm, setRegistroForm] = useState({ usuario: '', password: '', nombrePublico: '', campus: 'Granados', logoUrl: '' })
  const [errorLogin, setErrorLogin] = useState('')
  const [listaPedidos, setListaPedidos] = useState([])
  const [historial, setHistorial] = useState([]);
  const [ultimoPedidoId, setUltimoPedidoId] = useState(0); 
  const [notificacionNueva, setNotificacionNueva] = useState(false);

  useEffect(() => {
    const usuarioGuardado = localStorage.getItem('udlaeats_usuario');
    if (usuarioGuardado) setUsuario(JSON.parse(usuarioGuardado));
  }, [])

  useEffect(() => {
    if (!usuario) return;
    const intervalo = setInterval(() => {
        fetch(`${API_BASE}/api/pedidos/restaurante/${usuario.id}`)
            .then(res => res.json())
            .then(data => {
                if (data.length > 0) {
                    data.sort((a, b) => b.id - a.id);
                    const masReciente = data[0].id;
                    if (masReciente > ultimoPedidoId && ultimoPedidoId !== 0) {
                        setNotificacionNueva(true);
                        const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
                        audio.play().catch(() => {});
                    }
                    setUltimoPedidoId(masReciente);
                }
                setListaPedidos(data);
            })
            .catch(console.error)
    }, 5000);
    return () => clearInterval(intervalo);
  }, [usuario, ultimoPedidoId]);

  useEffect(() => { if (usuario) cargarDatos() }, [usuario])

  const cargarDatos = () => {
    fetch(`${API_BASE}/api/productos?restauranteId=${usuario.id}`).then(res => res.json()).then(setProductos)
    fetch(`${API_BASE}/api/categorias?restauranteId=${usuario.id}`).then(res => res.json()).then(setCategorias)
  }

  const cargarHistorial = () => {
    fetch(`${API_BASE}/api/pedidos/historial/${usuario.id}`).then(r => r.json()).then(setHistorial);
  }

  const completarPedido = (id) => {
      fetch(`${API_BASE}/api/pedidos/${id}/estado`, {
          method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify("LISTO")
      }).then(() => {
          alert("✅ Pedido marcado como LISTO. Se notificó al repartidor.");
          fetch(`${API_BASE}/api/pedidos/restaurante/${usuario.id}`).then(r=>r.json()).then(setListaPedidos);
      })
  }

  const handleLogin = (e) => {
    e.preventDefault(); setErrorLogin('');
    fetch(`${API_BASE}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(loginForm) })
    .then(async res => { if (!res.ok) throw new Error("Credenciales incorrectas"); return res.json(); })
    .then(data => { localStorage.setItem('udlaeats_usuario', JSON.stringify(data)); setUsuario(data); })
    .catch(err => setErrorLogin("Error: " + err.message));
  }

  const handleRegistro = (e) => {
      e.preventDefault(); setErrorLogin('');
      fetch(`${API_BASE}/api/auth/registro`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(registroForm) })
      .then(res => res.json()).then(data => { localStorage.setItem('udlaeats_usuario', JSON.stringify(data)); setUsuario(data); })
      .catch(err => setErrorLogin("Error al registrar."));
  }

  const handleLogout = () => { localStorage.removeItem('udlaeats_usuario'); setUsuario(null); }

  const eliminarCuenta = () => {
    if (confirm("⚠️ ¿ESTÁS SEGURO? Se borrará todo.")) {
        fetch(`${API_BASE}/api/auth/eliminar/${usuario.id}`, { method: 'DELETE' })
        .then(res => { if(res.ok) { alert("Cuenta eliminada."); handleLogout(); } })
    }
  }

  const crearCategoria = (e) => { e.preventDefault(); fetch(`${API_BASE}/api/categorias`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nombre: nuevaCategoria, restauranteId: usuario.id }) }).then(() => { setNuevaCategoria(''); cargarDatos(); }) }
  const eliminarCategoria = (id) => { fetch(`${API_BASE}/api/categorias/${id}`, { method: 'DELETE' }).then(() => cargarDatos()) }
  const guardarPlato = (e) => { e.preventDefault(); const url = modoEdicion ? `${API_BASE}/api/productos/${platoActual.id}` : `${API_BASE}/api/productos`; const metodo = modoEdicion ? 'PUT' : 'POST'; fetch(url, { method: metodo, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...platoActual, restauranteId: usuario.id }) }).then(() => { setModalAbierto(false); cargarDatos(); }) }
  const toggleStock = (producto) => { fetch(`${API_BASE}/api/productos/${producto.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...producto, disponible: !producto.disponible, restauranteId: usuario.id }) }).then(() => cargarDatos()) }
  const eliminarPlato = (id) => { if (confirm("¿Eliminar plato?")) { fetch(`${API_BASE}/api/productos/${id}`, { method: 'DELETE' }).then(() => cargarDatos()); } }
  
  const abrirModal = (producto = null) => { setModoEdicion(!!producto); setPlatoActual(producto || { id: null, nombre: '', descripcion: '', precio: '', imagenUrl: '', disponible: true, categoriaId: '' }); setModalAbierto(true); }
  const productosFiltrados = filtroCategoria === 'todos' ? productos : productos.filter(p => p.categoriaId === filtroCategoria);

  if (!usuario) return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
            <h1 className="text-3xl font-bold text-center mb-6">Udla<span className="text-red-600">Eats</span> <span className="text-sm font-normal block text-gray-500">Restaurantes</span></h1>
            {errorLogin && <div className="bg-red-50 text-red-600 p-2 mb-4 text-sm font-bold">{errorLogin}</div>}
            {!esRegistro ? (
                <form onSubmit={handleLogin} className="flex flex-col gap-4">
                    <input placeholder="Usuario" className="border p-3 rounded" value={loginForm.usuario} onChange={e=>setLoginForm({...loginForm, usuario:e.target.value})} />
                    <input type="password" placeholder="Contraseña" className="border p-3 rounded" value={loginForm.password} onChange={e=>setLoginForm({...loginForm, password:e.target.value})} />
                    <button className="bg-red-700 text-white p-3 rounded font-bold">ENTRAR</button>
                    <button type="button" onClick={()=>setEsRegistro(true)} className="text-sm text-gray-500">¿Crear cuenta?</button>
                </form>
            ) : (
                <form onSubmit={handleRegistro} className="flex flex-col gap-4">
                    <input placeholder="Nombre Local" className="border p-3 rounded" value={registroForm.nombrePublico} onChange={e=>setRegistroForm({...registroForm, nombrePublico:e.target.value})} />
                    <input placeholder="Usuario" className="border p-3 rounded" value={registroForm.usuario} onChange={e=>setRegistroForm({...registroForm, usuario:e.target.value})} />
                    <input type="password" placeholder="Contraseña" className="border p-3 rounded" value={registroForm.password} onChange={e=>setRegistroForm({...registroForm, password:e.target.value})} />
                    <input placeholder="URL del Logo (Opcional)" className="border p-3 rounded" value={registroForm.logoUrl} onChange={e=>setRegistroForm({...registroForm, logoUrl:e.target.value})} />
                    <select className="border p-3 rounded" value={registroForm.campus} onChange={e=>setRegistroForm({...registroForm, campus:e.target.value})}><option>Granados</option><option>UdlaPark</option><option>Colón</option></select>
                    <button className="bg-gray-800 text-white p-3 rounded font-bold">REGISTRAR</button>
                    <button type="button" onClick={()=>setEsRegistro(false)} className="text-sm text-gray-500">Volver al Login</button>
                </form>
            )}
        </div>
      </div>
  );

  return (
    <div className="flex h-screen bg-gray-100 font-sans text-gray-800">
      <div className="w-64 bg-black text-white flex flex-col p-6 border-r border-red-900 shadow-xl z-20">
        <div className="flex flex-col items-center text-center mb-8 pb-8 border-b border-gray-800">
             <div className="w-20 h-20 rounded-full bg-white p-1 mb-3 overflow-hidden border-2 border-red-600 shadow-lg">
                 {usuario.logoUrl ? ( <img src={usuario.logoUrl} alt="Logo" className="w-full h-full object-cover rounded-full" /> ) : ( <div className="w-full h-full bg-red-800 flex items-center justify-center text-2xl font-bold rounded-full">{usuario.nombrePublico.charAt(0)}</div> )}
             </div>
             <h2 className="font-bold text-lg leading-tight">{usuario.nombrePublico}</h2>
             <span className="bg-red-900 text-red-100 text-[10px] font-bold px-2 py-0.5 rounded-full mt-2 uppercase tracking-wider">Campus {usuario.campus}</span>
        </div>
        <nav className="flex flex-col gap-2">
            <button onClick={() => setSeccion('menu')} className={`p-3 text-left rounded-lg transition-all flex items-center gap-3 font-medium ${seccion === 'menu' ? 'bg-gradient-to-r from-red-900 to-black text-white border-l-4 border-red-600' : 'text-gray-400 hover:bg-neutral-900 hover:text-white'}`}><span>📦</span> Menú</button>
            <button onClick={() => setSeccion('pedidos')} className={`p-3 text-left rounded-lg transition-all flex items-center gap-3 font-medium ${seccion === 'pedidos' ? 'bg-gradient-to-r from-red-900 to-black text-white border-l-4 border-red-600' : 'text-gray-400 hover:bg-neutral-900 hover:text-white'}`}><span>🔔</span> Pedidos</button>
            <button onClick={() => { setSeccion('historial'); cargarHistorial(); }} className={`p-3 text-left rounded-lg transition-all flex items-center gap-3 font-medium ${seccion === 'historial' ? 'bg-gradient-to-r from-red-900 to-black text-white border-l-4 border-red-600' : 'text-gray-400 hover:bg-neutral-900 hover:text-white'}`}><span>💰</span> Historial</button>
        </nav>
        <div className="mt-auto pt-6 border-t border-gray-900">
            <button onClick={handleLogout} className="w-full text-red-400 text-sm font-bold hover:text-white transition-colors">Cerrar Sesión</button>
            <button onClick={eliminarCuenta} className="w-full text-red-900 text-[10px] mt-3 hover:text-red-600 transition-colors">Eliminar Cuenta</button>
        </div>
      </div>

      <div className="flex-1 p-8 overflow-y-auto">
        {seccion === 'menu' && (
            <div>
                <div className="flex justify-between mb-6"><h2 className="text-3xl font-bold">Gestión de Menú</h2><div className="flex gap-2"><button onClick={() => setModalCategorias(true)} className="bg-white border p-2 rounded">Categorías</button><button onClick={() => abrirModal(null)} className="bg-red-700 text-white px-4 py-2 rounded font-bold">+ Nuevo Plato</button></div></div>
                <div className="flex gap-4 mb-6 overflow-x-auto pb-2"><button onClick={() => setFiltroCategoria('todos')} className={`font-bold ${filtroCategoria==='todos'?'text-red-700 underline':'text-gray-400'}`}>Todos</button>{categorias.map(c => <button key={c.id} onClick={() => setFiltroCategoria(c.id)} className={`font-bold ${filtroCategoria===c.id?'text-red-700 underline':'text-gray-400'}`}>{c.nombre}</button>)}</div>
                <div className="grid grid-cols-3 gap-6">{productosFiltrados.map(p => (<div key={p.id} className={`bg-white rounded-xl shadow p-4 ${!p.disponible && 'opacity-60'}`}><div className="h-40 bg-gray-100 rounded mb-4 flex items-center justify-center overflow-hidden"><img src={p.imagenUrl || "/burger.jpg"} className="w-full h-full object-cover"/></div><h3 className="font-bold">{p.nombre}</h3><p className="text-sm text-gray-500 h-10 overflow-hidden">{p.descripcion}</p><div className="flex justify-between items-center mt-4"><span className="font-bold">${p.precio}</span><div className="flex gap-2"><button onClick={() => toggleStock(p)} className={`text-xs px-2 py-1 rounded text-white ${p.disponible ? 'bg-black' : 'bg-green-600'}`}>{p.disponible ? 'PAUSAR' : 'ACTIVAR'}</button><button onClick={() => abrirModal(p)}>✏️</button><button onClick={() => eliminarPlato(p.id)}>🗑️</button></div></div></div>))}</div>
            </div>
        )}

        {seccion === 'pedidos' && (
            <div>
                <h2 className="text-3xl font-bold mb-6">Monitor de Pedidos</h2>
                {listaPedidos.length === 0 && <p className="text-gray-400">No hay pedidos activos.</p>}
                
                <div className="space-y-4">
                    {listaPedidos.map(p => (
                        <div key={p.id} className={`bg-white p-6 rounded-xl shadow border-l-8 flex justify-between items-center transition-all ${p.estado === 'PENDIENTE' ? 'border-yellow-400' : p.estado === 'ACEPTADO' ? 'border-orange-400' : p.estado === 'LISTO' ? 'border-blue-400 bg-blue-50' : 'border-green-500 bg-green-50'}`}>
                            <div>
                                <div className="flex items-center gap-3"><h3 className="text-xl font-bold">Orden #{p.id}</h3><span className={`px-2 py-1 rounded text-xs font-bold ${p.estado === 'PENDIENTE' ? 'bg-yellow-100 text-yellow-800' : p.estado === 'ACEPTADO' ? 'bg-orange-100 text-orange-800' : p.estado === 'LISTO' ? 'bg-blue-200 text-blue-800' : 'bg-green-200 text-green-800'}`}>{p.estado === 'PENDIENTE' && '🔥 EN COCINA'}{p.estado === 'ACEPTADO' && '👨‍🍳 COCINANDO (Repartidor asignado)'}{p.estado === 'LISTO' && '⏳ ESPERANDO RECOGIDA'}{p.estado === 'EN_CAMINO' && '🛵 EN RUTA (Recogido)'}{p.estado === 'LLEGO' && '📍 LLEGÓ (Esperando entrega)'}</span></div>
                                <p className="text-gray-600 mt-1">👤 {p.clienteNombre}</p>
                                <div className="bg-white/50 p-2 mt-2 rounded text-sm text-gray-700 border border-gray-100">{p.descripcionPedido}</div>
                            </div>
                            
                            <div className="text-right">
                                <p className="text-2xl font-bold mb-2">${p.total}</p>
                                {/* BOTÓN SI ESTÁ PENDIENTE O ACEPTADO */}
                                {(p.estado === 'PENDIENTE' || p.estado === 'ACEPTADO') ? (
                                    <button onClick={() => completarPedido(p.id)} className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold shadow hover:bg-green-700 active:scale-95 transition-all">✅ MARCAR LISTO</button>
                                ) : (
                                    <div className="text-center"><p className="text-xs text-gray-400 font-bold uppercase mb-1">CÓDIGO DE SEGURIDAD</p><p className="text-[10px] text-gray-400 bg-white px-2 py-1 rounded border border-gray-200">🔒 Oculto</p></div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {seccion === 'historial' && (
             <div>
                <h2 className="text-3xl font-bold mb-6">Historial de Ventas</h2>
                <div className="bg-white rounded-xl shadow overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-100"><tr><th className="p-4">Fecha</th><th className="p-4">Cliente</th><th className="p-4">Detalle</th><th className="p-4">Estado</th><th className="p-4 text-right">Total</th></tr></thead>
                        <tbody>{historial.map(p => (<tr key={p.id} className="border-b"><td className="p-4 text-sm">{new Date(p.fecha).toLocaleString()}</td><td className="p-4 font-medium">{p.clienteNombre}</td><td className="p-4 text-sm text-gray-500 truncate max-w-xs">{p.descripcionPedido}</td><td className="p-4"><span className={`text-xs font-bold px-2 py-1 rounded ${p.estado === 'ENTREGADO' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{p.estado}</span></td><td className="p-4 text-right font-bold text-green-700">${p.total}</td></tr>))}</tbody>
                    </table>
                </div>
             </div>
        )}
      </div>

      {modalAbierto && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"><form onSubmit={guardarPlato} className="bg-white p-6 rounded-xl w-full max-w-md"><h3 className="font-bold text-xl mb-4">{modoEdicion ? 'Editar' : 'Nuevo'} Plato</h3><div className="space-y-3"><input placeholder="Nombre" className="w-full border p-2 rounded" value={platoActual.nombre} onChange={e=>setPlatoActual({...platoActual, nombre:e.target.value})} required/><select className="w-full border p-2 rounded" value={platoActual.categoriaId} onChange={e=>setPlatoActual({...platoActual, categoriaId:e.target.value})} required><option value="">Categoría</option>{categorias.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}</select><textarea placeholder="Descripción" className="w-full border p-2 rounded" value={platoActual.descripcion} onChange={e=>setPlatoActual({...platoActual, descripcion:e.target.value})} required/><div className="flex gap-2"><input type="number" step="0.01" placeholder="Precio" className="w-full border p-2 rounded" value={platoActual.precio} onChange={e=>setPlatoActual({...platoActual, precio:e.target.value})} required/><input placeholder="URL Imagen" className="w-full border p-2 rounded" value={platoActual.imagenUrl} onChange={e=>setPlatoActual({...platoActual, imagenUrl:e.target.value})}/></div></div><div className="flex justify-end gap-2 mt-4"><button type="button" onClick={()=>setModalAbierto(false)} className="text-gray-500 font-bold">Cancelar</button><button className="bg-red-700 text-white px-4 py-2 rounded font-bold">Guardar</button></div></form></div>)}
      {modalCategorias && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"><div className="bg-white p-6 rounded-xl w-full max-w-sm"><h3 className="font-bold text-xl mb-4">Categorías</h3><form onSubmit={crearCategoria} className="flex gap-2 mb-4"><input placeholder="Nueva" className="border p-2 rounded flex-1" value={nuevaCategoria} onChange={e=>setNuevaCategoria(e.target.value)} required/><button className="bg-black text-white px-3 rounded">+</button></form><div className="space-y-2">{categorias.map(c=><div key={c.id} className="flex justify-between bg-gray-50 p-2 rounded"><span>{c.nombre}</span><button onClick={()=>eliminarCategoria(c.id)} className="text-red-500">x</button></div>)}</div><button onClick={()=>setModalCategorias(false)} className="mt-4 w-full bg-gray-200 py-2 rounded font-bold">Cerrar</button></div></div>)}
      {notificacionNueva && (<div className="fixed bottom-5 right-5 bg-red-600 text-white p-4 rounded-xl shadow-xl animate-bounce flex items-center gap-4 cursor-pointer" onClick={() => { setSeccion('pedidos'); setNotificacionNueva(false); }}><span className="text-2xl">🔔</span><div><h4 className="font-bold">¡NUEVO PEDIDO!</h4><p className="text-xs">Revisa la cola.</p></div></div>)}
    </div>
  )
}

export default App