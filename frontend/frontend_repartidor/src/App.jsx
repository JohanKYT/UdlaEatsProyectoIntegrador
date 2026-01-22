import { useState, useEffect } from 'react'

const IP_PC = '192.168.100.212'; 
const API_LOGISTICA = `http://${IP_PC}:8083`;

function App() {
  const [repartidor, setRepartidor] = useState(null)
  const [pantalla, setPantalla] = useState('radar') 
  const [entregasDisponibles, setEntregasDisponibles] = useState([])
  const [pedidoEnCurso, setPedidoEnCurso] = useState(null)
  const [historialEntregas, setHistorialEntregas] = useState([])
  const [ganancias, setGanancias] = useState(0.0)
  const [codigoInput, setCodigoInput] = useState('')
  const [mensajeChat, setMensajeChat] = useState('')
  const [esRegistro, setEsRegistro] = useState(false)
  const [loginForm, setLoginForm] = useState({ email: '', password: '', nombre: '', vehiculo: 'Moto' })
  const [errorAuth, setErrorAuth] = useState('')

  useEffect(() => {
    const savedUser = localStorage.getItem('udla_driver_user');
    if(savedUser) { setRepartidor(JSON.parse(savedUser)); cargarHistorial(JSON.parse(savedUser).id); }
    const idActivo = localStorage.getItem('repartidor_pedido_act_id');
    if (idActivo) fetch(`${API_LOGISTICA}/api/logistica/${idActivo}`).then(r => r.json()).then(p => { if (p.estado !== 'ENTREGADO') { setPedidoEnCurso(p); setPantalla('curso'); } else localStorage.removeItem('repartidor_pedido_act_id'); }).catch(() => localStorage.removeItem('repartidor_pedido_act_id'));
  }, [])

  const cargarHistorial = (id) => fetch(`${API_LOGISTICA}/api/logistica/historial/${id}`).then(r => r.json()).then(d => { setHistorialEntregas(d); setGanancias(d.reduce((acc, curr) => acc + (curr.ganancia || 0.25), 0)); });

  useEffect(() => {
    if(!repartidor) return;
    const interval = setInterval(() => {
        if (pedidoEnCurso) fetch(`${API_LOGISTICA}/api/logistica/${pedidoEnCurso.id}`).then(r => r.json()).then(d => { setPedidoEnCurso(d); if(d.estado === 'ENTREGADO') { setPedidoEnCurso(null); localStorage.removeItem('repartidor_pedido_act_id'); setPantalla('historial'); cargarHistorial(repartidor.id); } });
        else if (pantalla === 'radar') fetch(`${API_LOGISTICA}/api/logistica/disponibles`).then(r => r.json()).then(setEntregasDisponibles);
        else if (pantalla === 'historial') cargarHistorial(repartidor.id);
    }, 2000); 
    return () => clearInterval(interval);
  }, [pedidoEnCurso, repartidor, pantalla]);

  const handleLogin = (e) => { e.preventDefault(); fetch(`${API_LOGISTICA}/api/auth/login`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ email: loginForm.email, password: loginForm.password }) }).then(r=>{if(!r.ok)throw new Error();return r.json()}).then(d=>{localStorage.setItem('udla_driver_user', JSON.stringify(d)); setRepartidor(d); cargarHistorial(d.id);}).catch(()=>setErrorAuth("Error credenciales")); }
  const handleRegistro = (e) => { e.preventDefault(); fetch(`${API_LOGISTICA}/api/auth/registro`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(loginForm) }).then(r=>{if(!r.ok)throw new Error();return r.json()}).then(d=>{localStorage.setItem('udla_driver_user', JSON.stringify(d)); setRepartidor(d);}).catch(()=>setErrorAuth("Error registro")); }
  const cerrarSesion = () => { localStorage.removeItem('udla_driver_user'); setRepartidor(null); }

  // ELIMINAR CUENTA 
  const eliminarCuenta = () => {
      if(confirm("⚠ ¿ESTÁS SEGURO?\nSe borrará tu cuenta y tu historial de ganancias permanentemente.")) {
          fetch(`${API_LOGISTICA}/api/auth/${repartidor.id}`, { method: 'DELETE' })
          .then(res => {
              if(res.ok) {
                  alert("Cuenta eliminada correctamente.");
                  cerrarSesion();
              } else {
                  alert("No se pudo eliminar la cuenta (Quizás tienes pedidos pendientes).");
              }
          });
      }
  }

  const aceptarPedido = (id) => { fetch(`${API_LOGISTICA}/api/logistica/${id}/tomar/${repartidor.id}`, { method: 'PUT' }).then(r => r.json()).then(p => { setPedidoEnCurso(p); localStorage.setItem('repartidor_pedido_act_id', p.id); setPantalla('curso'); }); }
  const enviarChat = () => { if(!mensajeChat)return; fetch(`${API_LOGISTICA}/api/logistica/${pedidoEnCurso.id}/chat`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(`Repartidor: ${mensajeChat}`) }).then(() => { setMensajeChat(''); fetch(`${API_LOGISTICA}/api/logistica/${pedidoEnCurso.id}`).then(r=>r.json()).then(setPedidoEnCurso); }); }
  const finalizarEntrega = () => { fetch(`${API_LOGISTICA}/api/logistica/${pedidoEnCurso.id}/finalizar`, { method: 'PUT', headers: {'Content-Type': 'text/plain'}, body: codigoInput }).then(r => { if(r.ok) { alert("✅ ¡Ganaste $0.25!"); localStorage.removeItem('repartidor_pedido_act_id'); setPedidoEnCurso(null); setCodigoInput(''); setPantalla('historial'); } else alert("❌ Código incorrecto"); }); }
  const cancelarPedido = () => { if(!confirm("¿Cancelar pedido?")) return; fetch(`${API_LOGISTICA}/api/logistica/${pedidoEnCurso.id}/cancelar`, { method: 'PUT' }).then(r => { if(r.ok) { setPedidoEnCurso(null); localStorage.removeItem('repartidor_pedido_act_id'); setPantalla('radar'); } }); }

  if (!repartidor) return (<div className="min-h-screen bg-neutral-900 flex items-center justify-center p-6"><div className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl"><h1 className="text-3xl font-black text-center mb-2">UDLA <span className="text-red-600 italic">Walkers</span></h1>{errorAuth && <div className="bg-red-100 text-red-600 p-3 rounded-xl mb-4 text-xs font-bold">{errorAuth}</div>}{!esRegistro ? (<form onSubmit={handleLogin} className="flex flex-col gap-4"><input className="bg-gray-50 border p-4 rounded-xl" placeholder="Email" value={loginForm.email} onChange={e=>setLoginForm({...loginForm, email:e.target.value})} /><input className="bg-gray-50 border p-4 rounded-xl" type="password" placeholder="Contraseña" value={loginForm.password} onChange={e=>setLoginForm({...loginForm, password:e.target.value})} /><button className="bg-red-700 text-white font-bold py-4 rounded-xl shadow-lg mt-2">ENTRAR</button><button type="button" onClick={()=>setEsRegistro(true)} className="text-gray-400 text-sm">Registrarme</button></form>) : (<form onSubmit={handleRegistro} className="flex flex-col gap-4"><input className="bg-gray-50 border p-4 rounded-xl" placeholder="Nombre" value={loginForm.nombre} onChange={e=>setLoginForm({...loginForm, nombre:e.target.value})} /><input className="bg-gray-50 border p-4 rounded-xl" placeholder="Email" value={loginForm.email} onChange={e=>setLoginForm({...loginForm, email:e.target.value})} /><input className="bg-gray-50 border p-4 rounded-xl" type="password" placeholder="Contraseña" value={loginForm.password} onChange={e=>setLoginForm({...loginForm, password:e.target.value})} /><button className="bg-black text-white font-bold py-4 rounded-xl shadow-lg mt-2">CREAR</button><button type="button" onClick={()=>setEsRegistro(false)} className="text-gray-400 text-sm">Volver</button></form>)}</div></div>);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto shadow-xl border-x">
      <div className="bg-white p-4 border-b flex justify-between items-center sticky top-0 z-20 shadow-sm">
          <div><h1 className="font-black text-red-700 italic">UDLA WALKERS</h1><p className="text-xs font-bold text-gray-400">{repartidor.nombre}</p></div>
          <div className="flex gap-2 items-center">
              <div className="text-right bg-green-50 px-2 py-1 rounded border border-green-200"><p className="text-[8px] font-bold text-green-600 uppercase">Ganancias</p><p className="font-mono font-black text-green-700 text-sm">${ganancias.toFixed(2)}</p></div>
              {/* BOTÓN ELIMINAR AGREGADO */}
              <button onClick={eliminarCuenta} className="text-[10px] text-red-500 font-bold border border-red-200 px-2 py-1 rounded hover:bg-red-50 transition-colors">Eliminar</button>
              <button onClick={cerrarSesion} className="text-xs bg-gray-200 px-3 py-1 rounded font-bold text-gray-600">Salir</button>
          </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-20">
          {pantalla === 'radar' && !pedidoEnCurso && (
              <div className="space-y-4">
                  <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Radar de Pedidos</h2>
                  {entregasDisponibles.length === 0 && <div className="text-center py-10 opacity-50"><span className="text-4xl">📡</span><p className="mt-2">Buscando...</p></div>}
                  {entregasDisponibles.map(p => (
                      <div key={p.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                          <div className="flex justify-between border-b pb-2 mb-2"><span className="font-bold text-sm text-blue-900">{p.restauranteNombre}</span><span className="text-green-600 font-bold text-xs bg-green-100 px-2 py-1 rounded">+$0.25</span></div>
                          <p className="text-xs text-gray-500 mb-1 font-bold">📍 {p.direccionRecogida}</p>
                          <p className="text-xs text-gray-400 mb-3">{p.clienteNombre}</p>
                          <button onClick={() => aceptarPedido(p.id)} className="w-full bg-red-700 text-white font-bold py-3 rounded-xl shadow-lg">ACEPTAR VIAJE</button>
                      </div>
                  ))}
              </div>
          )}

          {pedidoEnCurso && (
              <div className="animate-fade-in">
                  <div className="bg-black text-white p-5 rounded-2xl mb-4 shadow-xl">
                      <p className="text-xs text-gray-400 font-bold uppercase mb-1">{pedidoEnCurso.restauranteNombre}</p>
                      <h2 className="text-xl font-bold">{pedidoEnCurso.clienteNombre}</h2>
                      <p className="text-[10px] opacity-60 mt-1 uppercase tracking-widest bg-white/20 inline-block px-2 rounded">{pedidoEnCurso.estado.replace('_',' ')}</p>
                  </div>

                  <div className="bg-white rounded-2xl p-4 mb-4 h-64 flex flex-col border shadow-inner">
                      <div className="flex-1 overflow-y-auto space-y-2 mb-2 pr-1">
                          {pedidoEnCurso.descripcionPaquete.includes('|MSG|') ? 
                             pedidoEnCurso.descripcionPaquete.split('|MSG|').slice(1).map((m, i) => (<div key={i} className={`p-2 rounded-lg max-w-[85%] text-sm ${m.startsWith('Repartidor') ? 'bg-blue-600 text-white ml-auto' : 'bg-gray-100 text-gray-800'}`}>{m.split(': ')[1]}</div>)) 
                             : <div className="h-full flex items-center justify-center text-gray-300 italic text-sm">Chat vacío</div>}
                      </div>
                      <div className="flex gap-2"><input className="flex-1 border p-3 rounded-xl text-sm" placeholder="Mensaje..." value={mensajeChat} onChange={e=>setMensajeChat(e.target.value)} /><button onClick={enviarChat} className="bg-blue-600 text-white px-4 rounded-xl font-bold">➤</button></div>
                  </div>
                  
                  <div className="space-y-3">
                      {(pedidoEnCurso.estado === 'ACEPTADO' || pedidoEnCurso.estado === 'PENDIENTE') && (
                          <>
                            <div className="p-4 bg-orange-50 text-orange-700 rounded-xl text-center font-bold border border-orange-200">⏳ Esperando al Restaurante...</div>
                            <button onClick={cancelarPedido} className="w-full bg-gray-200 text-gray-600 font-bold py-3 rounded-xl text-xs hover:bg-red-100 hover:text-red-600 transition-colors">CANCELAR Y LIBERAR</button>
                          </>
                      )}
                      {pedidoEnCurso.estado === 'LISTO' && <button onClick={() => fetch(`${API_LOGISTICA}/api/logistica/${pedidoEnCurso.id}/recoger`, {method:'PUT'})} className="w-full bg-orange-500 text-white font-bold py-4 rounded-xl shadow-lg animate-bounce">🎒 RECOGER PEDIDO</button>}
                      {pedidoEnCurso.estado === 'EN_CAMINO' && <button onClick={() => fetch(`${API_LOGISTICA}/api/logistica/${pedidoEnCurso.id}/llegue`, {method:'PUT'})} className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg">📍 YA LLEGUÉ (PEDIR CÓDIGO)</button>}
                      {pedidoEnCurso.estado === 'LLEGO' && (
                          <div className="bg-white p-4 rounded-2xl border-2 border-green-500 shadow-xl">
                              <p className="text-center text-xs font-bold text-gray-400 mb-2 uppercase">Ingresa Código del Cliente</p>
                              <input className="w-full border-b-2 p-2 text-center text-3xl font-mono mb-4 outline-none" placeholder="0000" value={codigoInput} onChange={e=>setCodigoInput(e.target.value)} />
                              <button onClick={finalizarEntrega} className="w-full bg-green-600 text-white font-bold py-4 rounded-xl shadow-lg">FINALIZAR ENTREGA</button>
                          </div>
                      )}
                  </div>
              </div>
          )}

          {pantalla === 'historial' && (
              <div className="space-y-4">
                  <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Mis Ganancias</h2>
                  {historialEntregas.map(h => (
                      <div key={h.id} className="bg-white p-3 rounded-xl border flex justify-between items-center text-sm shadow-sm">
                          <div><p className="font-bold">{h.clienteNombre}</p><p className="text-[10px] text-gray-400">{h.restauranteNombre}</p></div>
                          <span className="font-bold text-green-600 bg-green-50 px-2 py-1 rounded">+$0.25</span>
                      </div>
                  ))}
              </div>
          )}
      </div>
      <div className="bg-white border-t p-3 flex justify-around sticky bottom-0 z-20"><button onClick={() => setPantalla('radar')} className="text-2xl">📡</button><button onClick={() => { if(pedidoEnCurso) setPantalla('curso') }} className="text-2xl">🛵</button><button onClick={() => setPantalla('historial')} className="text-2xl">💰</button></div>
    </div>
  )
}
export default App