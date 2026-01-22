import { useState, useEffect, useRef } from 'react'

// ⚠️ VERIFICA TU IP
const IP_PC = '192.168.100.212'; 

const API_RESTAURANTE = `http://${IP_PC}:8081`;
const API_CLIENTE     = `http://${IP_PC}:8082`;
const API_LOGISTICA   = `http://${IP_PC}:8083`;

function App() {
  const [estudiante, setEstudiante] = useState(null)
  const [pantalla, setPantalla] = useState('login') 
  const [campus, setCampus] = useState('Granados')
  const [restaurantes, setRestaurantes] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [restauranteSeleccionado, setRestauranteSeleccionado] = useState(null)
  const [menu, setMenu] = useState([])
  const [carrito, setCarrito] = useState([])
  const [historialPedidos, setHistorialPedidos] = useState([])
  const [minutosPasados, setMinutosPasados] = useState({}) 
  const pedidosNotificados = useRef(new Set()) 
  const [esRegistro, setEsRegistro] = useState(false)
  const [form, setForm] = useState({ email: '', password: '', nombre: '', campus: 'Granados', celular: '' })
  const [error, setError] = useState('')
  const [platoParaAgregar, setPlatoParaAgregar] = useState(null)
  const [notaPedido, setNotaPedido] = useState('')
  const [mensajeChat, setMensajeChat] = useState('')

  // UBICACIÓN
  const [pisoSeleccionado, setPisoSeleccionado] = useState('')
  const [aulaEscrita, setAulaEscrita] = useState('')

  const estructuraCampus = {
      'Granados': ['Planta Baja', 'Piso 1', 'Piso 2', 'Piso 3', 'Piso 4', 'Piso 5'],
      'Colón': ['Planta Baja', 'Piso 1', 'Piso 2', 'Piso 3'],
      'UdlaPark': ['Piso 6', 'Piso 5', 'Piso 4', 'Piso 3', 'Piso 2', 'Piso 1', 'Planta Baja', 'Subsuelo 1', 'Subsuelo 2', 'Subsuelo 3', 'Subsuelo 4', 'Subsuelo 5']
  };

  useEffect(() => {
    try {
        const guardado = localStorage.getItem('udlaeats_estudiante');
        if (guardado) { 
            const u = JSON.parse(guardado);
            setEstudiante(u); setCampus(u.campus || 'Granados'); setPantalla('inicio'); 
        }
    } catch(e) { localStorage.removeItem('udlaeats_estudiante'); }
    if ("Notification" in window) Notification.requestPermission();
  }, [])

  useEffect(() => { 
      fetch(`${API_RESTAURANTE}/api/publico/restaurantes`)
        .then(r => r.json())
        .then(data => { if(Array.isArray(data)) setRestaurantes(data); })
        .catch(err => console.log("Error API Restaurantes")) 
  }, [])

  // CORRECCIÓN CLAVE EN EL POLLING 
  useEffect(() => {
    if (!estudiante) return;
    const actualizarPedidos = () => {
        fetch(`${API_RESTAURANTE}/api/pedidos/cliente/${estudiante.id}`)
            .then(r => r.json())
            .then(async pedidos => {
                if(!Array.isArray(pedidos)) return;
                const pedidosActualizados = await Promise.all(pedidos.map(async (p) => {
                    // Solo consultamos logística si el pedido está activo
                    if (p.estado !== 'PENDIENTE' && p.estado !== 'ENTREGADO') {
                        try {
                            const resLog = await fetch(`${API_LOGISTICA}/api/logistica/pedido-original/${p.id}?t=${Date.now()}`);
                            if(resLog.ok) {
                                const dataLog = await resLog.json();
                                return { 
                                    ...p, 
                                    descripcionPedido: dataLog.descripcionPaquete, // Aquí viene el chat actualizado
                                    estado: dataLog.estado, 
                                    codigoVerificacion: dataLog.codigoSeguridad 
                                }; 
                            }
                        } catch (e) { return p; }
                    }
                    return p;
                }));
                setHistorialPedidos(pedidosActualizados);
                
                // Notificaciones
                const tiempos = {};
                pedidosActualizados.forEach(p => {
                    tiempos[p.id] = Math.floor((new Date().getTime() - new Date(p.fecha).getTime()) / 60000);
                    if (p.estado === 'LLEGO' && !pedidosNotificados.current.has(p.id)) {
                        pedidosNotificados.current.add(p.id);
                        if(Notification.permission === "granted") new Notification("📍 ¡Llegaron!", { body: "Tu pedido está afuera." });
                    }
                });
                setMinutosPasados(tiempos);
            }).catch(() => {});
    };
    actualizarPedidos(); 
    const intervalo = setInterval(actualizarPedidos, 3000); // Cada 3 segundos
    return () => clearInterval(intervalo);
  }, [estudiante]);

  // Funciones auxiliares
  const agregarAlCarrito = () => {
      const restId = restauranteSeleccionado?.id || platoParaAgregar.restauranteId || 1;
      const nuevoItem = { ...platoParaAgregar, nota: notaPedido, restauranteId: restId };
      setCarrito([...carrito, nuevoItem]); setPlatoParaAgregar(null); setNotaPedido('');
  }
  const eliminarDelCarrito = (index) => { const n = carrito.filter((_, i) => i !== index); setCarrito(n); }
  const vaciarCarrito = () => { if(confirm("¿Vaciar?")) setCarrito([]); }

  const handleAuth = (e) => {
      e.preventDefault(); setError('');
      if (!form.email.endsWith('@udla.edu.ec')) { setError("Usa correo @udla.edu.ec"); return; }
      const endpoint = esRegistro ? '/api/cliente/registro' : '/api/cliente/login';
      fetch(`${API_CLIENTE}${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      .then(async res => { if (!res.ok) throw new Error(await res.text()); return res.json(); })
      .then(data => { localStorage.setItem('udlaeats_estudiante', JSON.stringify(data)); setEstudiante(data); setCampus(data.campus); setPantalla('inicio'); })
      .catch(() => setError("Credenciales incorrectas"));
  }

  const enviarPedido = () => {
      if(carrito.length===0) return alert("Carrito vacío");
      if(!pisoSeleccionado || !aulaEscrita) return alert("⚠️ FALTAN DATOS:\nSelecciona Piso y escribe el Aula.");

      const subtotal = carrito.reduce((a,b)=>a+parseFloat(b.precio),0);
      const totalFinal = (subtotal + 0.50).toFixed(2);
      const ubicacionFinal = `${campus} - ${pisoSeleccionado}, ${aulaEscrita}`;

      //  Agregamos la nota al texto
      const descripcionConNotas = carrito.map(i => {
          const notaTexto = i.nota ? ` (${i.nota})` : ''; // Si hay nota, la pone entre paréntesis
          return `1x ${i.nombre}${notaTexto}`;
      }).join(', ');

      const pedido = { 
          clienteNombre: estudiante.nombre, 
          clienteId: estudiante.id, 
          restauranteId: carrito[0].restauranteId, 
          campus: ubicacionFinal, 
          total: totalFinal, 
          descripcionPedido: descripcionConNotas, // Enviamos el texto corregido
          estado: 'PENDIENTE' 
      };

      fetch(`${API_RESTAURANTE}/api/pedidos`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(pedido) })
      .then(async res => { 
          if(res.ok) { 
              // --- INICIO INTEGRACIÓN LAMBDA (Estimación de Tiempo) ---
              try {
                  // Contamos cuántos platos son
                  const totalPlatos = carrito.length;
                  
                  // Llamamos a la Lambda en el puerto 8084
                  const resLambda = await fetch(`http://${IP_PC}:8084/estimarTiempo`, {
                      method: 'POST',
                      headers: {'Content-Type': 'application/json'},
                      body: String(totalPlatos) 
                  });

                  if (resLambda.ok) {
                      const mensajeTiempo = await resLambda.text();
                      alert(`✅ PEDIDO ENVIADO\nTotal: $${totalFinal}\n\n${mensajeTiempo}`);
                  } else {
                      // Si la lambda falla, mostramos solo el éxito normal
                      alert(`✅ PEDIDO ENVIADO\nTotal: $${totalFinal}`); 
                  }
              } catch (e) {
                  // Si la lambda está apagada, no rompemos el flujo
                  alert(`✅ PEDIDO ENVIADO\nTotal: $${totalFinal}`); 
              }
              setCarrito([]); setPisoSeleccionado(''); setAulaEscrita(''); setPantalla('historial'); 
          } else {
              const texto = await res.text();
              alert("❌ Error del Servidor: " + texto);
          }
      })
      .catch(() => alert("❌ Error de Conexión."));
  }
  
  const verRestaurante = (rest) => { 
      setRestauranteSeleccionado(rest); setMenu([]); setPantalla('menu'); 
      fetch(`${API_RESTAURANTE}/api/publico/productos?restauranteId=${rest.id}`)
        .then(r => {if(!r.ok) throw new Error(); return r.json()})
        .then(d => { if(Array.isArray(d)) setMenu(d); })
        .catch(() => fetch(`${API_RESTAURANTE}/api/productos?restauranteId=${rest.id}`).then(r=>r.json()).then(d=>{if(Array.isArray(d))setMenu(d)}));
  }

  const enviarMensaje = (pid) => {
    if(!mensajeChat) return;
    // Buscamos el ID real de la entrega en logística
    fetch(`${API_LOGISTICA}/api/logistica/pedido-original/${pid}?t=${Date.now()}`)
    .then(r => r.json())
    .then(e => {
        fetch(`${API_LOGISTICA}/api/logistica/${e.id}/chat`, { 
            method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(`Cliente: ${mensajeChat}`) 
        }).then(() => {
            setMensajeChat('');
            // Forzamos actualización inmediata visual
            const nuevosPedidos = historialPedidos.map(p => {
                if(p.id === pid) return {...p, descripcionPedido: p.descripcionPedido + "|MSG|Cliente: " + mensajeChat};
                return p;
            });
            setHistorialPedidos(nuevosPedidos);
        });
    }).catch(() => alert("El repartidor aún no acepta el pedido."));
  };

  const cerrarSesion = () => { localStorage.removeItem('udlaeats_estudiante'); setEstudiante(null); setPantalla('login'); }
  const eliminarCuenta = () => { if(confirm("¿Borrar cuenta?")) fetch(`${API_CLIENTE}/api/cliente/${estudiante.id}`, { method: 'DELETE' }).then(() => cerrarSesion()); }
  const obtenerLogo = (r) => (r.logoUrl && r.logoUrl.length > 5) ? r.logoUrl : "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500";

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center font-sans text-gray-800">
      <div className="w-full max-w-md bg-white min-h-screen shadow-2xl relative overflow-hidden flex flex-col">
        {(!estudiante || pantalla === 'login') ? ( 
            <div className="flex-1 flex flex-col justify-center p-8">
                <h1 className="text-4xl font-black text-center mb-1 italic">Udla<span className="text-red-600">Eats</span></h1>
                {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-center text-sm font-bold">{error}</div>}
                <form onSubmit={handleAuth} className="flex flex-col gap-4">
                    {esRegistro && <input required placeholder="Nombre" className="bg-gray-50 border p-4 rounded-xl" value={form.nombre} onChange={e=>setForm({...form, nombre:e.target.value})} />}
                    <input required placeholder="Correo @udla.edu.ec" className="bg-gray-50 border p-4 rounded-xl" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} />
                    <input required type="password" placeholder="Contraseña" className="bg-gray-50 border p-4 rounded-xl" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} />
                    <button className="bg-red-700 text-white font-bold py-4 rounded-xl shadow-lg mt-2">{esRegistro ? 'REGISTRARME' : 'INGRESAR'}</button>
                </form>
                <button onClick={() => setEsRegistro(!esRegistro)} className="text-center mt-6 text-gray-500 text-sm font-bold">Cambiar a {esRegistro ? 'Login' : 'Registro'}</button>
            </div>
        ) : (
            <>
            <div className="bg-white px-5 py-4 sticky top-0 z-10 shadow-sm flex justify-between items-center border-b border-gray-100">
                {pantalla!=='inicio' ? <button onClick={()=>setPantalla('inicio')} className="text-2xl">⬅️</button> : <div className="w-8"/>}
                <h1 className="font-black italic text-xl">Udla<span className="text-red-600">Eats</span></h1>
                <div onClick={()=>setPantalla('carrito')} className="relative cursor-pointer"><span className="text-2xl">🛍️</span>{carrito.length>0 && <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold animate-bounce">{carrito.length}</span>}</div>
            </div>

            <div className="flex-1 overflow-y-auto pb-24 scrollbar-hide">
                {pantalla === 'inicio' && <div className="p-6 text-center space-y-4 pt-10">
                    <h2 className="text-3xl font-black text-gray-900 mb-8">Hola, {estudiante.nombre.split(' ')[0]} 👋</h2>
                    {['Granados', 'UdlaPark', 'Colón'].map(c=>(<button key={c} onClick={()=>{setCampus(c); setPantalla('restaurantes')}} className="w-full bg-white py-6 rounded-2xl shadow-sm border font-bold text-lg flex items-center px-6 gap-4"><span className="bg-red-50 p-3 rounded-full text-2xl">📍</span>{c}</button>))}
                </div>}
                
                {pantalla === 'restaurantes' && <div className="p-4 space-y-4">
                    <input placeholder="🔍 Buscar..." className="w-full p-4 rounded-xl border bg-gray-50" value={busqueda} onChange={e=>setBusqueda(e.target.value)} />
                    {Array.isArray(restaurantes) && restaurantes.filter(r=>r.campus.toLowerCase()===campus.toLowerCase() && r.nombrePublico.toLowerCase().includes(busqueda.toLowerCase())).map(r=>(<div key={r.id} onClick={()=>verRestaurante(r)} className="bg-white rounded-2xl shadow-sm h-40 relative overflow-hidden cursor-pointer"><img src={obtenerLogo(r)} className="w-full h-full object-cover"/><div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent p-4 flex flex-col justify-end"><h3 className="text-white font-bold text-xl">{r.nombrePublico}</h3><p className="text-gray-300 text-xs">🕒 15 min • $0.25 Envio</p></div></div>))}
                </div>}

                {pantalla === 'menu' && <div className="p-4">
                    <h2 className="text-2xl font-bold mb-4 px-2">{restauranteSeleccionado?.nombrePublico}</h2>
                    <div className="space-y-4">
                        {Array.isArray(menu) && menu.length > 0 ? (
                            // CAMBIO: .filter(p => p.disponible)
                            menu.filter(p => p.disponible).map(p=>(
                                <div key={p.id} className="bg-white p-4 rounded-2xl flex shadow-sm gap-4">
                                    <div className="flex-1">
                                        <h4 className="font-bold">{p.nombre}</h4>
                                        <p className="text-xs text-gray-500">{p.descripcion}</p>
                                        <div className="mt-3 flex justify-between">
                                            <span className="font-black">${p.precio}</span>
                                            <button onClick={()=>{setPlatoParaAgregar(p); setNotaPedido('')}} className="bg-red-50 text-red-700 px-4 py-1 rounded-lg text-xs font-bold">AGREGAR</button>
                                        </div>
                                    </div>
                                    {p.imagenUrl && <img src={p.imagenUrl} className="w-20 h-20 rounded-xl object-cover"/>}
                                </div>
                            ))
                        ) : <p className="text-center text-gray-400 py-10">Cargando menú...</p>}
                    </div>
                </div>}

                {pantalla === 'carrito' && <div className="p-6">
                    <div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-bold">Tu Carrito</h2>{carrito.length > 0 && <button onClick={vaciarCarrito} className="text-xs text-red-500 underline font-bold">Vaciar</button>}</div>
                    {carrito.length === 0 ? <p className="text-gray-400 text-center">Vacío.</p> : (
                        <div className="space-y-4">
                            {carrito.map((i,x)=>(<div key={x} className="flex justify-between items-center bg-white p-4 rounded-xl border"><div><p className="font-bold">{i.nombre}</p>{i.nota && <p className="text-[10px] text-gray-400">"{i.nota}"</p>}</div><div className="flex gap-3"><b className="text-lg">${i.precio}</b><button onClick={() => eliminarDelCarrito(x)} className="text-red-500 font-bold">✕</button></div></div>))}
                            
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                <h4 className="font-bold text-blue-800 mb-2 text-sm">📍 Ubicación en {campus}</h4>
                                <select className="w-full p-2 rounded border mb-2 text-sm bg-white" value={pisoSeleccionado} onChange={e=>setPisoSeleccionado(e.target.value)}>
                                    <option value="">-- Selecciona Piso --</option>
                                    {(estructuraCampus[campus] || []).map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                                <input className="w-full p-2 rounded border text-sm" placeholder="Ej: Aula 302, Biblioteca..." value={aulaEscrita} onChange={e=>setAulaEscrita(e.target.value)} />
                            </div>

                            <div className="bg-gray-50 p-4 rounded-xl space-y-2 mt-4 text-sm text-gray-600"><div className="flex justify-between"><span>Comida:</span><span>${carrito.reduce((a,b)=>a+parseFloat(b.precio),0).toFixed(2)}</span></div><div className="flex justify-between"><span>Servicios:</span><span>$0.50</span></div><div className="border-t pt-2 mt-2 flex justify-between text-xl font-black text-gray-900"><span>TOTAL</span><span>${(carrito.reduce((a,b)=>a+parseFloat(b.precio),0) + 0.50).toFixed(2)}</span></div></div>
                            <button onClick={enviarPedido} className="w-full bg-red-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg">PEDIR AHORA</button>
                        </div>
                    )}
                </div>}

                {pantalla === 'historial' && (
                    <div className="p-4 space-y-4">
                        <h2 className="text-xl font-bold mb-4">Mis Pedidos</h2>
                        {historialPedidos.map(p => (
                            <div key={p.id} className="bg-white p-5 rounded-2xl border shadow-sm">
                                <div className="flex justify-between mb-3">
                                    <span className={`px-2 py-1 rounded text-[9px] font-bold uppercase ${p.estado==='PENDIENTE'?'bg-yellow-100 text-yellow-800':p.estado==='ACEPTADO'?'bg-orange-100 text-orange-800':p.estado==='LISTO'?'bg-blue-100 text-blue-800':'bg-green-100 text-green-800'}`}>
                                        {p.estado === 'PENDIENTE' && '🔥 BUSCANDO REPARTIDOR'}
                                        {p.estado === 'ACEPTADO' && '👨‍🍳 COCINANDO (Repartidor Asignado)'}
                                        {p.estado === 'LISTO' && '🥡 LISTO PARA RECOGER'}
                                        {p.estado === 'EN_CAMINO' && '🛵 EN CAMINO'}
                                        {p.estado === 'LLEGO' && '📍 LLEGÓ (Entrega Código)'}
                                        {p.estado === 'ENTREGADO' && '✅ ENTREGADO'}
                                    </span>
                                </div>
                                <p className="font-bold mb-2 text-sm">{p.descripcionPedido?.split('|MSG|')[0]}</p>
                                
                                {/* CHAT */}
                                {(p.estado === 'EN_CAMINO' || p.estado === 'LLEGO') && <div className="mt-4 bg-green-50 border-2 border-dashed border-green-500 p-4 rounded-xl text-center"><p className="text-[10px] font-bold text-green-800 uppercase">CÓDIGO</p><p className="text-4xl font-mono font-black text-gray-800">{p.codigoVerificacion}</p></div>}
                                
                                {(p.estado !== 'PENDIENTE' && p.estado !== 'ENTREGADO') && (
                                    <div className="mt-4 border-t pt-3">
                                        <div className="max-h-32 overflow-y-auto mb-2 space-y-2 pr-1 bg-gray-50 p-2 rounded">
                                            {p.descripcionPedido.includes('|MSG|') ? 
                                                p.descripcionPedido.split('|MSG|').slice(1).map((m,i)=>(
                                                    <div key={i} className={`p-2 rounded-lg text-xs max-w-[85%] ${m.startsWith('Cliente')?'bg-red-100 text-red-800 ml-auto':'bg-white border text-gray-700'}`}>{m.replace('Cliente: ', '').replace('Repartidor: ', '')}</div>
                                                )) 
                                            : <p className="text-xs text-gray-400 italic text-center">Inicia el chat...</p>}
                                        </div>
                                        <div className="flex gap-2">
                                            <input className="flex-1 text-xs border p-2 rounded" placeholder="Escribe..." value={mensajeChat} onChange={e=>setMensajeChat(e.target.value)} />
                                            <button onClick={()=>enviarMensaje(p.id)} className="bg-blue-600 text-white px-3 rounded text-xs">Enviar</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {pantalla === 'perfil' && <div className="p-6 text-center"><div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl">{estudiante.nombre.charAt(0)}</div><h2 className="text-2xl font-bold">{estudiante.nombre}</h2><p className="text-gray-500 mb-6">{estudiante.email}</p><div className="space-y-3"><button onClick={cerrarSesion} className="w-full bg-gray-800 text-white py-4 rounded-xl font-bold">Cerrar Sesión</button><button onClick={eliminarCuenta} className="w-full border-2 border-red-100 text-red-600 py-4 rounded-xl font-bold">Eliminar Cuenta</button></div></div>}
            </div>

            {platoParaAgregar && <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50 p-6"><div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-fade-in"><h3 className="font-bold text-xl mb-1">{platoParaAgregar.nombre}</h3><p className="text-sm text-gray-500 mb-4">${platoParaAgregar.precio}</p><textarea className="w-full bg-gray-50 border p-3 rounded-xl mb-4 text-sm outline-none" placeholder="¿Notas extra? (Sin cebolla, etc)" value={notaPedido} onChange={e=>setNotaPedido(e.target.value)}/><div className="flex gap-3"><button onClick={()=>setPlatoParaAgregar(null)} className="flex-1 bg-gray-100 py-3 rounded-xl font-bold text-gray-600">Cerrar</button><button onClick={agregarAlCarrito} className="flex-1 bg-red-700 text-white py-3 rounded-xl font-bold shadow-lg">Agregar</button></div></div></div>}

            <div className="bg-white border-t flex justify-around p-3 pb-6 sticky bottom-0 z-20"><button onClick={()=>setPantalla('inicio')} className="text-2xl">🏠</button><button onClick={()=>setPantalla('restaurantes')} className="text-2xl">🍔</button><button onClick={()=>setPantalla('historial')} className="text-2xl">📄</button><button onClick={()=>setPantalla('perfil')} className="text-2xl">👤</button></div>
            </>
        )}
      </div>
    </div>
  )
}
export default App