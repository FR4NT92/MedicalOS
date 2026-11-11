'use client';

import { trpc } from '@/lib/trpc/client';
import { MedicalRecordsView } from './MedicalRecordsView';
import React, { useState, useRef, useEffect } from 'react';
import { BrainCircuit, 
  Home,
  Activity,
  Users,
  Calendar,
  FileText,
  CreditCard,
  TrendingUp,
  Settings,
  Mail,
  RefreshCw,
  Search,
  Plus,
  Trash2,
  Phone,
  CheckCircle,
  AlertCircle,
  X,
  Share2,
  Download,
  Send,
  Sparkles,
  ChevronRight,
  ChevronDown,
  ArrowUpRight,
  Mic,
  MessageSquare,
  Check,
  Clock,
  DollarSign,
  Palette,
  ExternalLink,
 } from 'lucide-react';

interface ToastItem {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'error';
}

interface TurnoItem {
  id: string;
  hora: string;
  paciente: string;
  tipo: string;
  telefono: string;
  dni: string;
  isLibre?: boolean;
}

interface LeadItem {
  id: string;
  paciente: string;
  telefono: string;
  canal: string;
  interes: string;
  horario: string;
  estado: 'nuevo' | 'propuesto' | 'espera' | 'aceptado';
}

interface PacienteRecord {
  id: string;
  nombre: string;
  dni: string;
  telefono: string;
  email: string;
  obraSocial: string;
  afiliado: string;
  edad: string;
  fechaNac: string;
  domicilio: string;
  emergencia: string;
  ultimoControl: string;
  diagnostico: string;
  ghlTags?: string[];
  source?: string;
}

const INITIAL_LEADS: LeadItem[] = [];

const INITIAL_TURNOS: TurnoItem[] = [];

const INITIAL_PACIENTES: PacienteRecord[] = [];

export default function ClinicOSDashboard() {
  const [activeTab, setActiveTab] = useState<'home' | 'pacientes' | 'agenda' | 'historial' | 'facturacion' | 'rendimiento' | 'configuracion'>('home');
  const [patientDetailTab, setPatientDetailTab] = useState<'datos' | 'hc' | 'presupuestos' | 'balance'>('hc');
  const [hcSubTab, setHcSubTab] = useState<'antecedentes' | 'evoluciones' | 'multimedia' | 'recetas'>('recetas');
  const [recetaType, setRecetaType] = useState<'med' | 'prac'>('med');
  const [calendarView, setCalendarView] = useState<'semanal' | 'mensual' | 'anual'>('semanal');
  const [historialFilter, setHistorialFilter] = useState<'todos' | 'atendido' | 'recibido' | 'cancelado'>('todos');

  // Custom Color State (Verde por defecto, modificable en Configuración)
  const [brandColor, setBrandColor] = useState('#589972');

  // Lists State
  
  
  const [leads, setLeads] = useState<LeadItem[]>(INITIAL_LEADS);
  
  const utils = trpc.useUtils();

  // TRPC Mutations

  // === 4 CORE PRODUCTION ACCELERATORS (ANTI-NO-SHOW, MERCADO PAGO, FIRMA DIGITAL, ARCA AFIP) ===
  const sendReminderMutation = trpc.appointment.sendWhatsAppReminder.useMutation();
  const simulateReplyMutation = trpc.appointment.simulatePatientReply.useMutation();
  const createMpPreferenceMutation = trpc.payment.createPreference.useMutation();
  const confirmDepositMutation = trpc.payment.confirmDeposit.useMutation();
  const dispatchArcaMutation = trpc.invoice.dispatchArca.useMutation();

  // Modal Seña Mercado Pago
  const [modalMpOpen, setModalMpOpen] = useState(false);
  const [mpSelectedTurno, setMpSelectedTurno] = useState<TurnoItem | null>(null);
  const [mpAmount, setMpAmount] = useState(25000);
  const [mpPreference, setMpPreference] = useState<any>(null);

  // Modal Factura ARCA (ex AFIP)
  const [facturaPatientName, setFacturaPatientName] = useState('Mariano López');
  const [facturaPatientDni, setFacturaPatientDni] = useState('32.489.102');
  const [facturaAmount, setFacturaAmount] = useState(35000);
  const [facturaType, setFacturaType] = useState<'FACTURA_B' | 'FACTURA_A'>('FACTURA_B');
  const [facturaConcept, setFacturaConcept] = useState('Honorarios Médicos - Traumatología');
  const [facturaResult, setFacturaResult] = useState<any>(null);

  // Modal Receta Digital con Firma Criptográfica
  const [recetaMed, setRecetaMed] = useState('Ketorolac 20mg sublingual');
  const [recetaIndicaciones, setRecetaIndicaciones] = useState('1 comprimido cada 8hs en caso de dolor moderado a severo por 3 días.');
  const [recetaSignedResult, setRecetaSignedResult] = useState<any>(null);

  const createPatientMutation = trpc.patient.create.useMutation();
  const createAppointmentMutation = trpc.appointment.create.useMutation();
  const updateAppointmentStatusMutation = trpc.appointment.updateStatus.useMutation();
  const updateLeadStatusMutation = trpc.triage.updateLeadStatus.useMutation();

  // Queries
  const { data: rawKanban, refetch: refetchKanban } = trpc.triage.getKanban.useQuery();

  const { data: dbPatients = [], isLoading: isLoadingPatients } = trpc.patient.list.useQuery({ limit: 100 });
  const { data: dbAppointments = [], isLoading: isLoadingAppointments } = trpc.appointment.getToday.useQuery();


  
  // Adapter para que la UI vieja siga funcionando sin romper JSX
  const pacientes: PacienteRecord[] = React.useMemo(() => {
    return dbPatients.map(p => ({
      id: p.id,
      nombre: p.firstName + ' ' + p.lastName,
      dni: p.dni || '-',
      telefono: p.phone,
      email: p.email || '-',
      obraSocial: p.healthInsuranceName || 'Particular',
      afiliado: p.affiliateNumber || '-',
      edad: '-',
      fechaNac: '-',
      domicilio: '-',
      emergencia: '-',
      ultimoControl: p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '-',
      diagnostico: p.triageNotes || '-',
      ghlTags: (p as any).ghlTags || [],
      source: (p as any).triageSource || 'HIGHLEVEL',
    }));
  }, [dbPatients]);

  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  
  // En vez de tener un estado aislado, selectedPatient deriva de la lista real.
  const selectedPatient = React.useMemo(() => {
    if (pacientes.length === 0) return null;
    if (selectedPatientId) return pacientes.find(p => p.id === selectedPatientId) || pacientes[0];
    return pacientes[0];
  }, [pacientes, selectedPatientId]);

  // Manejo de seleccin que reemplaza a `setSelectedPatient(p)`
  const handleSelectPatient = (p: PacienteRecord) => {
    setSelectedPatientId(p.id);
  };

  const [turnosExpanded, setTurnosExpanded] = useState(false);

  // In-App Toast System (ZERO native alerts)
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const showToast = (title: string, message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Modals state
  const [modalAgendarOpen, setModalAgendarOpen] = useState(false);
  const [modalConsultarOpen, setModalConsultarOpen] = useState(false);
  const [modalRecetaOpen, setModalRecetaOpen] = useState(false);
  const [modalFacturaOpen, setModalFacturaOpen] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isVoiceOverlayOpen, setIsVoiceOverlayOpen] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<'listening' | 'understood'>('listening');

  const [isPressing, setIsPressing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'es-AR';

        recognitionRef.current.onresult = (event: any) => {
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
             finalTranscript += event.results[i][0].transcript;
          }
          if (finalTranscript) setTranscript(finalTranscript);
        };
        recognitionRef.current.onerror = (e: any) => {
          console.error("Speech error", e.error);
          if (e.error !== 'no-speech') {
             setTranscript('Error de micrófono: ' + e.error);
          }
        };
      }
    }
  }, [isVoiceOverlayOpen]);


  // Form states
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoDni, setNuevoDni] = useState('');
  const [nuevoTel, setNuevoTel] = useState('');
  const [nuevoHora, setNuevoHora] = useState('14:30');
  const [nuevoTipo, setNuevoTipo] = useState('consulta');
  const [searchQuery, setSearchQuery] = useState('');
  const voiceCommandMutation = trpc.ai.processVoiceCommand.useMutation();
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<any[]>([]);


  // Voice Hold Handling
  const pressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pressStartTimeRef = useRef<number>(0);
  const isLongPressRef = useRef<boolean>(false);

  const handleSpherePressStart = () => {
    isLongPressRef.current = false;
    pressStartTimeRef.current = Date.now();
    setIsPressing(true);
    pressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      setIsVoiceOverlayOpen(true);
      setVoiceStatus('listening');
      setTranscript('');
      if (recognitionRef.current) {
        try { recognitionRef.current.start(); } catch(e) {}
      }
    }, 700); // reduced to 0.7s for better UX
  };

  const handleSpherePressEnd = () => {
    setIsPressing(false);
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
    if (!isLongPressRef.current && Date.now() - pressStartTimeRef.current < 500) {
      setIsCopilotOpen((prev) => !prev);
    } else if (isLongPressRef.current) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch(e) {}
      }
      if (transcript.trim()) {
         setVoiceStatus('understood');
         voiceCommandMutation.mutateAsync({ commandText: transcript }).then(res => {
            setIsVoiceOverlayOpen(false);
            setChatMessages(prev => [...prev, {role: 'user', text: transcript}, {role: 'ai', text: res.message}]);
            setIsCopilotOpen(true);
         }).catch(() => {
            setIsVoiceOverlayOpen(false);
            showToast('Error', 'No se pudo procesar el comando.', 'error');
         });
      } else {
         setIsVoiceOverlayOpen(false);
      }
    }
  };

  // Turnos derived from DB appointments
  const turnos: TurnoItem[] = React.useMemo(() => {
    const slots: string[] = [];
    for (let i = 9; i <= 17; i++) {
      slots.push(`${i.toString().padStart(2, '0')}:00`);
      slots.push(`${i.toString().padStart(2, '0')}:30`);
    }
    const emptySlot = (hora: string): TurnoItem => ({ id: hora, hora: `${hora}hs`, paciente: '', tipo: '', telefono: '', dni: '', isLibre: true });
    if (!dbAppointments || !(dbAppointments as any).appointments) return slots.map(emptySlot);
    const bookedMap = new Map<string, any>();
    ((dbAppointments as any).appointments || []).forEach((app: any) => {
      const date = new Date(app.startTimeUtc);
      const slot = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
      bookedMap.set(slot, app);
    });
    return slots.map(hora => {
      const booked = bookedMap.get(hora);
      if (booked) {
        return { id: booked.id, hora: `${hora}hs`, paciente: booked.patientName, tipo: booked.type === 'SURGERY' ? 'Cirugía' : booked.type === 'FOLLOW_UP' ? 'Control' : 'Consulta', telefono: booked.patientPhone || '', dni: '', isLibre: false, status: booked.status, reminder24hSent: booked.reminder24hSent, patientId: booked.patientId };
      }
      return emptySlot(hora);
    });
  }, [dbAppointments]);

  const turnosOcupados = turnos.filter((t) => !t.isLibre).length;
  const totalSlots = 8;
  const porcentajeOcupacion = Math.round((turnosOcupados / totalSlots) * 100);

  const handleCancelarTurno = async (id: string, nombre: string) => {
    try {
      await updateAppointmentStatusMutation.mutateAsync({ appointmentId: id, status: "CANCELLED" });
      showToast('Turno Cancelado', `El turno de ${nombre} fue cancelado en la base de datos.`, 'info');
      utils.appointment.getToday.invalidate();
    } catch (e) {
      showToast('Error', 'No se pudo cancelar el turno.', 'error');
    }
  };

  const handleCrearTurno = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombre.trim()) return;

    try {
      const [firstName, ...lastNames] = nuevoNombre.split(' ');
      const newPatient = await createPatientMutation.mutateAsync({
        firstName,
        lastName: lastNames.join(' ') || '-',
        phone: nuevoTel || '+5491100000000',
        dni: nuevoDni || undefined,
      });

      const today = new Date();
      const [hours, minutes] = nuevoHora.replace('hs', '').split(':');
      today.setHours(parseInt(hours, 10), parseInt(minutes || '0', 10), 0, 0);

      let mappedType: "CONSULTATION" | "SURGERY" | "FOLLOW_UP" | "PROCEDURE" = "CONSULTATION";
      if (nuevoTipo === 'Cirugía') mappedType = "SURGERY";
      if (nuevoTipo === 'Control') mappedType = "FOLLOW_UP";
      if (nuevoTipo === 'Procedimiento') mappedType = "PROCEDURE";

      await createAppointmentMutation.mutateAsync({
        patientId: newPatient.id,
        startTimeUtc: today.toISOString(),
        durationMinutes: 30,
        type: mappedType,
      });

      showToast('Paciente Agendado', `${nuevoNombre} agendado a las ${nuevoHora} y guardado en la base de datos.`, 'success');
      utils.patient.list.invalidate();
      utils.appointment.getToday.invalidate();
      utils.triage.getKanban.invalidate();

      setNuevoNombre('');
      setNuevoDni('');
      setNuevoTel('');
      setNuevoHora('');
      setNuevoTipo('Consulta');
      setModalAgendarOpen(false);
    } catch (error) {
      showToast('Error', 'No se pudo guardar el turno en la base de datos.', 'error');
    }
  };

  const pacientesFiltrados = pacientes.filter(
    (p) => p.nombre.toLowerCase().includes(searchQuery.toLowerCase()) || p.dni.includes(searchQuery)
  );

  return (
    <div className="h-screen bg-[#EAECEF] text-[#0B0F19] p-3 sm:p-5 select-none font-sans flex flex-col overflow-hidden">
      {/* FRAME CONTENEDOR PRINCIPAL */}
      <div className="max-w-[1360px] w-full mx-auto bg-white rounded-[28px] border border-[#DCE1E7] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] flex flex-col flex-1 min-h-0 overflow-hidden relative">
        
        {/* 1. TOP HEADER */}
        <header className="px-6 py-4 flex items-center justify-between border-b border-[#F0F2F5] bg-white shrink-0">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('home')}>
            <div className="w-10 h-10 rounded-[14px] bg-[#363B42] flex items-center justify-center text-white shadow-xs">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="18" height="18" rx="5" fill="#363B42" />
                <path d="M12 7v10M7 12h10" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
            <span className="font-bold text-xl text-[#0B0F19] tracking-tight block">Clinic-OS</span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => showToast('Buzón Clínico', 'Mensajes internos de la clínica sincronizados.', 'info')}
              className="w-9 h-9 rounded-full bg-white border border-[#E5E7EB] flex items-center justify-center text-[#6B7280] hover:text-[#0B0F19]"
            >
              <Mail className="w-4 h-4" />
            </button>
            <button
              onClick={() => showToast('Sincronización en la Nube', 'Todos los servicios clínicos operan en tiempo real.', 'success')}
              className="w-9 h-9 rounded-full bg-white border border-[#E5E7EB] flex items-center justify-center text-[#6B7280] hover:text-[#0B0F19]"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <div
              className="w-9 h-9 rounded-full overflow-hidden border border-[#E5E7EB] cursor-pointer"
              onClick={() => showToast('Sesión Activa', 'Dra. Mariana Morales · Especialista Traumatología (MN 142.890)', 'info')}
            >
              <img
                src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=120"
                alt="Doctora"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </header>

        {/* 2. BODY CON SIDEBAR Y CONTENIDO */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          
          {/* SIDEBAR IZQUIERDA */}
          <aside className="w-48 border-r border-[#F0F2F5] p-4 flex flex-col justify-between shrink-0 bg-white overflow-y-auto">
            <nav className="space-y-1">
              {[
                { id: 'home', label: 'Home', icon: Home },
                                { id: 'pacientes', label: 'Pacientes', icon: Users },
                { id: 'agenda', label: 'Agenda', icon: Calendar },
                { id: 'historial', label: 'Historial', icon: FileText },
                { id: 'facturacion', label: 'Facturación', icon: CreditCard },
                { id: 'rendimiento', label: 'Rendimiento', icon: TrendingUp },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as any)}
                  className={`w-full flex items-center gap-3 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                    activeTab === id ? 'bg-[#ECEEF1] text-[#0B0F19]' : 'text-[#6B7280] hover:text-[#0B0F19] hover:bg-[#F3F4F6]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </button>
              ))}
            </nav>

            <div className="pt-4 border-t border-[#F0F2F5]">
              <button
                onClick={() => setActiveTab('configuracion')}
                className={`w-full flex items-center gap-3 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                  activeTab === 'configuracion' ? 'bg-[#ECEEF1] text-[#0B0F19]' : 'text-[#6B7280] hover:text-[#0B0F19] hover:bg-[#F3F4F6]'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Configuración</span>
              </button>
            </div>
          </aside>

          {/* CONTENIDO CENTRAL */}
          <main className="flex-1 min-h-0 p-6 overflow-y-auto pb-16">
            
            {/* VIEW: HOME */}
            {activeTab === 'home' && (
              <div className="grid grid-cols-12 gap-6">
                
                {/* COLUMNA PRINCIPAL */}
                <div className="col-span-12 lg:col-span-8 space-y-5">
                  
                  {/* BOX PRINCIPAL VERDE */}
                  <div
                    onClick={() => setActiveTab('rendimiento')}
                    className="rounded-[20px] p-6 text-white cursor-pointer transition-all duration-200 hover:-translate-y-0.5 shadow-md"
                    style={{ background: `linear-gradient(135deg, ${brandColor}dd 0%, ${brandColor} 100%)` }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-xl font-bold tracking-tight text-white">Clínica Buenos Aires</h2>
                        <span className="text-xs text-white/90 font-medium block mt-0.5">Sucursal Palermo</span>
                        <span className="text-[11px] text-white/75 block mt-0.5">Viernes, 11 de septiembre 2026</span>
                      </div>
                      <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white backdrop-blur-xs">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>

                    <div className="mt-8 flex justify-between items-end border-t border-white/20 pt-4">
                      <span className="text-xs text-white font-medium">14 pacientes pre-calificados en proceso de cierre quirúrgico</span>
                      <span className="bg-white/20 backdrop-blur-xs px-2.5 py-1 rounded-full text-xs font-bold text-white inline-flex items-center gap-1">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        +18,5% mes
                      </span>
                    </div>
                  </div>

                  {/* BOX TURNOS HOY (ALINEACIÓN HORIZONTAL SOLICITADA) */}
                  <div className="bg-white border border-[#E5E7EB] rounded-[20px] p-5 shadow-xs space-y-4">
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => setTurnosExpanded(!turnosExpanded)}
                    >
                      <div className="flex items-center space-x-3">
                        <div style={{ color: brandColor }}>
                          <Calendar className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-semibold text-[#6B7280]">Turnos hoy</span>
                      </div>

                      <div className="flex items-center space-x-2 text-xs text-[#6B7280]">
                        <span className="font-medium text-[11px]" style={{ color: brandColor }}>
                          {turnosExpanded ? 'Ocultar agenda' : 'Toca para ver agenda'}
                        </span>
                        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${turnosExpanded ? 'rotate-180' : ''}`} />
                      </div>
                    </div>

                    {/* Fila Horizontal Alineada */}
                    <div className="space-y-2.5 pt-1">
                      <div className="flex items-baseline space-x-2">
                        <span className="text-2xl font-bold text-[#0B0F19]">{turnosOcupados}</span>
                        <span className="text-xs text-[#6B7280]">
                          {turnosOcupados}/{totalSlots} ocupados <span className="text-[#0B0F19] font-medium">| ¡Excelente!</span>
                        </span>
                      </div>

                      {/* BARRA DE PROGRESO Y HUECO LIBRE EN LA MISMA LÍNEA HORIZONTAL */}
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 bg-[#E8F3ED] h-2.5 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${porcentajeOcupacion}%`, backgroundColor: brandColor }}
                          ></div>
                        </div>

                        <div className="flex items-center space-x-2 shrink-0">
                          <span className="text-xs text-[#6B7280]">turno libre 14:30hs</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setNuevoHora('14:30');
                              setModalAgendarOpen(true);
                            }}
                            className="px-3 py-1 rounded-full text-xs font-semibold bg-[#EABABA] text-[#6A2525] hover:bg-[#E3A8A8] transition-colors"
                          >
                            Llenar hueco
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Lista desplegada de turnos del día */}
                    {turnosExpanded && (
                      <div className="space-y-2 pt-3 border-t border-[#F0F2F5]">
                        {turnos.map((item) => (
                          <div
                            key={item.id}
                            className={`p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs border ${
                              item.isLibre ? 'bg-white border-dashed border-[#CBD5E1]' : 'bg-[#F9FAFB] border-[#F0F2F5]'
                            }`}
                          >
                            <div className="flex items-center space-x-4">
                              <span className="font-mono text-[#6B7280] w-14">{item.hora}</span>
                              {item.isLibre ? (
                                <span className="text-[#9CA3AF] italic">Libre</span>
                              ) : (
                                <>
                                  <strong className="text-[#0B0F19] w-28">{item.paciente}</strong>
                                  <span className="text-[#6B7280]">{item.tipo}</span>
                                </>
                              )}
                            </div>

                            <div className="flex items-center space-x-2">
                              {item.isLibre ? (
                                <button
                                  onClick={() => {
                                    setNuevoHora(item.hora.replace('hs', ''));
                                    setModalAgendarOpen(true);
                                  }}
                                  className="px-4 py-1.5 bg-[#F0F2F5] hover:bg-[#E5E7EB] text-[#0B0F19] rounded-md font-medium transition-colors"
                                >
                                  Rellenar slot de agenda
                                </button>
                              ) : (
                                <>
                                  <button
                                    onClick={() => {
                                      const p = pacientes.find((x) => x.nombre === item.paciente) || pacientes[0];
                                      if (p) handleSelectPatient(p);
                                      setActiveTab('pacientes');
                                      setPatientDetailTab('hc');
                                    }}
                                    className="w-7 h-7 rounded-md bg-[#8C96A3] text-white flex items-center justify-center hover:bg-[#737D8A]"
                                    title="Revisar Historia Clínica"
                                  >
                                    <FileText className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    onClick={() => handleCancelarTurno(item.id, item.paciente)}
                                    className="w-7 h-7 rounded-md bg-[#C83737] text-white flex items-center justify-center hover:bg-[#A92A2A]"
                                    title="Cancelar turno"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    onClick={() => showToast('WhatsApp Clínico', `Abierto canal directo con ${item.paciente} (${item.telefono})`, 'info')}
                                    className="px-3 py-1 bg-[#D1E7DA] text-[#1A422B] rounded-md font-semibold hover:bg-[#C2DFCD]"
                                  >
                                    Contactar
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* ACCESOS RÁPIDOS */}
                  <div className="space-y-3">
                    <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider block">Accesos Rápidos</span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div
                        onClick={() => setModalAgendarOpen(true)}
                        className="bg-white border border-[#E5E7EB] rounded-[18px] p-4 flex items-center justify-center gap-2 text-xs font-semibold text-[#0B0F19] cursor-pointer hover:border-[#589972] hover:-translate-y-0.5 transition-all shadow-xs"
                      >
                        <Plus className="w-4 h-4" style={{ color: brandColor }} />
                        <span>Agendar paciente</span>
                      </div>

                      <div
                        onClick={() => setModalConsultarOpen(true)}
                        className="bg-white border border-[#E5E7EB] rounded-[18px] p-4 flex items-center justify-center gap-2 text-xs font-semibold text-[#0B0F19] cursor-pointer hover:border-[#589972] hover:-translate-y-0.5 transition-all shadow-xs"
                      >
                        <Search className="w-4 h-4" style={{ color: brandColor }} />
                        <span>Consultar paciente</span>
                      </div>

                      <div
                        onClick={() => setModalRecetaOpen(true)}
                        className="bg-white border border-[#E5E7EB] rounded-[18px] p-4 flex items-center justify-center gap-2 text-xs font-semibold text-[#0B0F19] cursor-pointer hover:border-[#589972] hover:-translate-y-0.5 transition-all shadow-xs"
                      >
                        <FileText className="w-4 h-4" style={{ color: brandColor }} />
                        <span>Nueva receta</span>
                      </div>

                      <div
                        onClick={() => setModalFacturaOpen(true)}
                        className="bg-white border border-[#E5E7EB] rounded-[18px] p-4 flex items-center justify-center gap-2 text-xs font-semibold text-[#0B0F19] cursor-pointer hover:border-[#589972] hover:-translate-y-0.5 transition-all shadow-xs"
                      >
                        <CreditCard className="w-4 h-4" style={{ color: brandColor }} />
                        <span>Nueva factura</span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* COLUMNA DERECHA: NOTIFICACIONES DE PRIORIDAD */}
                <div className="col-span-12 lg:col-span-4 space-y-4">
                  <div className="bg-white border border-[#E5E7EB] rounded-[20px] p-5 shadow-xs space-y-3">
                    <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider block">Notificaciones de Prioridad</span>
                    <div className="space-y-2.5">
                      <div className="bg-[#FFFFFF] border border-[#EAECEF] rounded-[14px] p-3 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[#6B7280] text-[11px]">Hoy</span>
                          <span className="px-2 py-0.5 bg-[#D1E7DA] text-[#1A422B] rounded text-[10px] font-semibold">Confirmado</span>
                        </div>
                        <p className="text-[#0B0F19] font-medium leading-snug">
                          Depósito confirmado por <strong>$500 USD</strong> correspondiente a seña quirúrgica de el paciente.
                        </p>
                      </div>

                      <div className="bg-[#FFFFFF] border border-[#EAECEF] rounded-[14px] p-3 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[#6B7280] text-[11px]">Esta semana</span>
                          <span className="px-2 py-0.5 bg-[#F0F2F5] text-[#4B5563] rounded text-[10px] font-semibold">Aviso</span>
                        </div>
                        <p className="text-[#0B0F19] font-medium leading-snug">
                          3 presupuestos de prótesis importadas pendientes de aprobación en quirófano central.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}

            
                        {/* VIEW: PACIENTES (DIRECTORIO Y DETALLE CON 4 PESTAÑAS) */}
            {activeTab === 'pacientes' && (
              <div className="space-y-5">
                {/* Selector de Pacientes / Sincronizados de HighLevel */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider shrink-0">Directorio:</span>
                  {pacientes.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPatientId(p.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all flex items-center gap-1.5 border ${
                        selectedPatient?.id === p.id
                          ? 'bg-[#0B0F19] text-white border-[#0B0F19] shadow-xs'
                          : 'bg-white text-[#6B7280] border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      <span>{p.nombre}</span>
                      {p.ghlTags && p.ghlTags.length > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[9px] font-bold">
                          {p.ghlTags[0]}
                        </span>
                      )}
                    </button>
                  ))}
                  <button
                    onClick={() => setModalConsultarOpen(true)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 text-white flex items-center gap-1"
                    style={{ backgroundColor: brandColor }}
                  >
                    + Nuevo
                  </button>
                </div>

                {/* Cabecera del Paciente Seleccionado */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-[#0B0F19]">{selectedPatient?.nombre}</h2>
                      {selectedPatient?.source === 'HIGHLEVEL' && (
                        <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200">
                          Sincronizado GoHighLevel
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-[#6B7280]">DNI: {selectedPatient?.dni} · HC-902</span>
                      {selectedPatient?.ghlTags && selectedPatient.ghlTags.map((tag, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-[10px] font-medium">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 4 Pestañas Solicitadas por el Usuario (1:1 Imagen Adjunta) */}
                <div className="flex items-center space-x-6 border-b border-[#E5E7EB] pb-2 text-xs font-semibold text-[#6B7280]">
                  <button
                    onClick={() => setPatientDetailTab('datos')}
                    className={`pb-1 ${patientDetailTab === 'datos' ? 'text-[#0B0F19] font-bold border-b-2 border-[#0B0F19]' : 'hover:text-[#0B0F19]'}`}
                  >
                    Datos personales
                  </button>
                  <button
                    onClick={() => setPatientDetailTab('hc')}
                    className={`px-3 py-1 rounded-full border ${patientDetailTab === 'hc' ? 'border-[#0B0F19] text-[#0B0F19] font-bold' : 'border-transparent hover:text-[#0B0F19]'}`}
                  >
                    Historia Clínica
                  </button>
                  <button
                    onClick={() => setPatientDetailTab('presupuestos')}
                    className={`pb-1 ${patientDetailTab === 'presupuestos' ? 'text-[#0B0F19] font-bold border-b-2 border-[#0B0F19]' : 'hover:text-[#0B0F19]'}`}
                  >
                    Presupuestos
                  </button>
                  <button
                    onClick={() => setPatientDetailTab('balance')}
                    className={`pb-1 ${patientDetailTab === 'balance' ? 'text-[#0B0F19] font-bold border-b-2 border-[#0B0F19]' : 'hover:text-[#0B0F19]'}`}
                  >
                    Balance
                  </button>
                </div>

                {/* Tab 1: Datos Personales */}
                {patientDetailTab === 'datos' && (
                  <div className="bg-white border border-[#E5E7EB] rounded-[20px] p-6 shadow-xs space-y-4">
                    <h3 className="font-bold text-sm text-[#0B0F19]">Ficha de Filiación & Cobertura</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                      <div className="p-3 bg-[#F9FAFB] rounded-xl border border-[#F0F2F5]">
                        <span className="text-[#6B7280] block">DNI & Nacimiento</span>
                        <strong className="text-[#0B0F19] block">{selectedPatient?.dni}</strong>
                        <span className="text-[11px] text-[#6B7280]">{selectedPatient?.edad} ({selectedPatient?.fechaNac})</span>
                      </div>
                      <div className="p-3 bg-[#F9FAFB] rounded-xl border border-[#F0F2F5]">
                        <span className="text-[#6B7280] block">Contacto</span>
                        <strong className="text-[#0B0F19] block">{selectedPatient?.telefono}</strong>
                        <span className="text-[11px] text-[#6B7280]">{selectedPatient?.email}</span>
                      </div>
                      <div className="p-3 bg-[#F9FAFB] rounded-xl border border-[#F0F2F5]">
                        <span className="text-[#6B7280] block">Cobertura</span>
                        <strong className="text-[#0B0F19] block">{selectedPatient?.obraSocial}</strong>
                        <span className="text-[11px] text-[#6B7280]">Afiliado: {selectedPatient?.afiliado}</span>
                      </div>
                      <div className="p-3 bg-[#F9FAFB] rounded-xl border border-[#F0F2F5]">
                        <span className="text-[#6B7280] block">Domicilio</span>
                        <strong className="text-[#0B0F19] block">{selectedPatient?.domicilio}</strong>
                      </div>
                      <div className="p-3 bg-[#F9FAFB] rounded-xl border border-[#F0F2F5]">
                        <span className="text-[#6B7280] block">Contacto Emergencia</span>
                        <strong className="text-[#0B0F19] block">{selectedPatient?.emergencia}</strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 2: Historia Clínica (Con Sub-sidebar de Antecedentes, Evoluciones, Multimedia, Recetas) */}
                {patientDetailTab === 'hc' && (
                  <div className="grid grid-cols-12 gap-6 pt-1">
                    <div className="col-span-12 sm:col-span-3 space-y-1.5 text-xs">
                      {[
                        { id: 'antecedentes', label: 'Antecedentes' },
                        { id: 'evoluciones', label: 'Evoluciones' },
                        { id: 'multimedia', label: 'Multimedia' },
                        { id: 'recetas', label: 'Recetas' },
                      ].map((item) => (
                        <div
                          key={item.id}
                          onClick={() => setHcSubTab(item.id as any)}
                          className={`p-2.5 rounded-xl cursor-pointer font-medium transition-colors ${
                            hcSubTab === item.id ? 'bg-[#ECEEF1] text-[#0B0F19] font-bold' : 'text-[#6B7280] hover:bg-[#F3F4F6]'
                          }`}
                        >
                          {item.label}
                        </div>
                      ))}
                    </div>

                    <div className="col-span-12 sm:col-span-9 space-y-4">
                      {hcSubTab === 'recetas' && (
                        <div className="space-y-4">
                          <div className="flex items-center space-x-6 text-xs font-semibold text-[#6B7280]">
                            <span
                              onClick={() => setRecetaType('med')}
                              className={`cursor-pointer pb-1 ${recetaType === 'med' ? 'text-[#0B0F19] font-bold border-b-2 border-[#0B0F19]' : ''}`}
                            >
                              Recetas de medicamentos
                            </span>
                            <span
                              onClick={() => setRecetaType('prac')}
                              className={`cursor-pointer pb-1 ${recetaType === 'prac' ? 'text-[#0B0F19] font-bold border-b-2 border-[#0B0F19]' : ''}`}
                            >
                              Recetas de prácticas
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="relative w-64">
                              <input
                                type="text"
                                placeholder="Buscar por código..."
                                className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#E5E7EB] rounded-xl text-xs outline-none"
                              />
                              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-gray-400" />
                            </div>
                            <button
                              onClick={() => setModalRecetaOpen(true)}
                              className="px-3.5 py-1.5 text-white rounded-full text-xs font-semibold flex items-center gap-1"
                              style={{ backgroundColor: brandColor }}
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Nueva receta
                            </button>
                          </div>

                          <div className="border-t border-[#F0F2F5] pt-2">
                            <table className="w-full text-left text-xs">
                              <thead>
                                <tr className="text-[#6B7280] border-b border-[#F0F2F5]">
                                  <th className="py-2">Fecha ⬍</th>
                                  <th className="py-2">Código</th>
                                  <th className="py-2">Medicamentos</th>
                                  <th className="py-2 text-right">Acciones</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#F0F2F5]">
                                <tr>
                                  <td className="py-3 text-[#6B7280]">07/08/2026</td>
                                  <td className="py-3 font-mono text-[#0B0F19]">29090511...</td>
                                  <td className="py-3 text-[#0B0F19]">ACTRON - Ibuprofeno - Caps. 600mg</td>
                                  <td className="py-3 text-right space-x-1">
                                    <button
                                      onClick={() => showToast('Código QR Copiado', 'Enlace seguro de farmacia copiado al portapapeles.', 'info')}
                                      className="p-1.5 bg-[#8C96A3] text-white rounded-md hover:bg-[#737D8A]"
                                    >
                                      <Share2 className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => showToast('Receta Archivada', 'La receta se archivó correctamente en el historial clínico.', 'info')}
                                      className="p-1.5 bg-[#C83737] text-white rounded-md hover:bg-[#A92A2A]"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {hcSubTab === 'antecedentes' && (
                        <div className="p-4 bg-white border border-[#E5E7EB] rounded-2xl text-xs space-y-2">
                          <p><strong>Alergias:</strong> Sin registros de alergias.</p>
                          <p><strong>Quirúrgicos:</strong> Sin antecedentes quirúrgicos.</p>
                          <p><strong>Patologías de base:</strong> Sin patologías de base registradas.</p>
                        </div>
                      )}
                      {hcSubTab === 'evoluciones' && ( <MedicalRecordsView patientId={selectedPatient?.id || ''} /> )}
                    </div>
                  </div>
                )}

                {/* Tab 3: Presupuestos */}
                {patientDetailTab === 'presupuestos' && (
                  <div className="bg-white border border-[#E5E7EB] rounded-[20px] p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm text-[#0B0F19]">Presupuestos Quirúrgicos Emitidos</h3>
                      <button
                        onClick={() => showToast('Nuevo Presupuesto', 'Generando cotización de honorarios y quirófano.', 'info')}
                        className="px-3.5 py-1.5 text-white rounded-full text-xs font-semibold"
                        style={{ backgroundColor: brandColor }}
                      >
                        + Crear Presupuesto
                      </button>
                    </div>

                    <div className="divide-y divide-[#F0F2F5] text-xs">
                      <div className="py-3 flex items-center justify-between">
                        <div>
                          <strong className="text-[#0B0F19] text-sm block">No hay presupuestos</strong>
                          <span className="text-[#6B7280]">Seña de $500 USD abonada · Saldo en cuotas</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="font-bold text-sm text-[#0B0F19]"></span>
                          <span className="px-2 py-0.5 rounded-full bg-[#D1E7DA] text-[#1A422B] font-bold text-[10px]"></span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 4: Balance */}
                {patientDetailTab === 'balance' && (
                  <div className="bg-white border border-[#E5E7EB] rounded-[20px] p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm text-[#0B0F19]">Balance Contable del Paciente</h3>
                      <button
                        onClick={() => setModalFacturaOpen(true)}
                        className="px-3.5 py-1.5 text-white rounded-full text-xs font-semibold"
                        style={{ backgroundColor: brandColor }}
                      >
                        + Emitir Factura ARCA
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-xs">
                      <div className="p-3 bg-[#F9FAFB] rounded-xl border border-[#F0F2F5]">
                        <span className="text-[#6B7280]">Saldo Actual</span>
                        <div className="text-lg font-bold text-emerald-600">0</div>
                      </div>
                      <div className="p-3 bg-[#F9FAFB] rounded-xl border border-[#F0F2F5]">
                        <span className="text-[#6B7280]">Seña Registrada</span>
                        <div className="text-lg font-bold text-[#0B0F19]">0</div>
                      </div>
                      <div className="p-3 bg-[#F9FAFB] rounded-xl border border-[#F0F2F5]">
                        <span className="text-[#6B7280]">Total Facturado</span>
                        <div className="text-lg font-bold text-[#0B0F19]">0</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* VIEW: AGENDA (1:1 GOOGLE CALENDAR SEMANAL, MENSUAL, ANUAL) */}
            {activeTab === 'agenda' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <h2 className="text-xl font-bold text-[#0B0F19]">Agenda Médica</h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F5EE] text-[#2C6E49]">
                      Google Calendar Sincronizado
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="bg-[#F0F2F5] p-1 rounded-xl flex text-xs font-semibold text-[#6B7280]">
                      {(['semanal', 'mensual', 'anual'] as const).map((view) => (
                        <button
                          key={view}
                          onClick={() => setCalendarView(view)}
                          className={`px-3 py-1 rounded-lg capitalize ${
                            calendarView === view ? 'bg-white text-[#0B0F19] shadow-xs' : 'hover:text-[#0B0F19]'
                          }`}
                        >
                          {view}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setModalAgendarOpen(true)}
                      className="px-3.5 py-1.5 text-white rounded-full text-xs font-semibold"
                      style={{ backgroundColor: brandColor }}
                    >
                      + Nuevo Turno
                    </button>
                  </div>
                </div>

                <div className="bg-white border border-[#E5E7EB] rounded-[20px] p-5 shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-xs">
                      <thead>
                        <tr className="text-center text-[#6B7280] border-b border-[#F0F2F5]">
                          <th className="p-2 w-16 text-left font-normal">Hora</th>
                          <th>Lun 7</th>
                          <th>Mar 8</th>
                          <th>Mié 9</th>
                          <th>Jue 10</th>
                          <th className="font-bold text-[#0B0F19] bg-[#F9FAFB] rounded-t-lg">Vie 11 (Hoy)</th>
                          <th>Sáb 12</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F0F2F5]">
                        <tr className="h-14">
                          <td className="p-2 text-[#9CA3AF] font-mono">12:30</td>
                          <td></td><td></td><td></td><td></td>
                          <td className="p-1 bg-[#F9FAFB]">
                            
                          </td>
                          <td></td>
                        </tr>
                        <tr className="h-14">
                          <td className="p-2 text-[#9CA3AF] font-mono">14:30</td>
                          <td></td><td></td><td></td><td></td>
                          <td className="p-1 bg-[#F9FAFB]">
                            <div
                              onClick={() => {
                                setNuevoHora('14:30');
                                setModalAgendarOpen(true);
                              }}
                              className="h-full border border-dashed border-red-300 rounded-md flex items-center justify-between px-2 text-[10px] bg-red-50/50 cursor-pointer"
                            >
                              <span className="text-red-700 font-semibold">Hueco libre</span>
                              <span className="px-2 py-0.5 bg-[#EABABA] text-[#6A2525] rounded font-bold">Llenar</span>
                            </div>
                          </td>
                          <td></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW: HISTORIAL (MENSUAL FILTRABLE) */}
            {activeTab === 'historial' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-[#0B0F19]">Historial de Turnos Médicos</h2>
                  <div className="flex items-center space-x-2">
                    <select className="px-3 py-1.5 bg-white border border-[#E5E7EB] rounded-xl text-xs font-semibold">
                      <option>Septiembre 2026</option>
                      <option>Agosto 2026</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-xs font-semibold">
                  {(['todos', 'atendido', 'recibido', 'cancelado'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setHistorialFilter(filter)}
                      className={`px-3 py-1.5 rounded-full capitalize ${
                        historialFilter === filter ? 'bg-[#0B0F19] text-white' : 'bg-white border border-[#E5E7EB] text-[#6B7280]'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>

                <div className="bg-white border border-[#E5E7EB] rounded-[20px] overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F9FAFB] text-[#6B7280] font-semibold border-b border-[#F0F2F5]">
                      <tr>
                        <th className="py-3 px-4">Fecha y Hora</th>
                        <th className="py-3 px-4">Paciente</th>
                        <th className="py-3 px-4">Motivo</th>
                        <th className="py-3 px-4">Estado</th>
                        <th className="py-3 px-4 text-right">Detalle</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0F2F5]">
                      <tr className="hover:bg-[#FBFDFB]">
                        <td className="py-3.5 px-4 font-mono text-[#6B7280]">11/09 · 10:00hs</td>
                        <td className="py-3.5 px-4 font-semibold text-[#0B0F19]">Gonzalo Morales</td>
                        <td className="py-3.5 px-4 text-[#4B5563]">Hipertensión Arterial</td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-full bg-[#E8F5EE] text-[#2C6E49] font-bold text-[10px]">Atendido</span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => showToast('Detalle Clínico', 'Consulta cerrada con indicación de laboratorio.', 'info')}
                            className="px-2.5 py-1 bg-[#F0F2F5] rounded-md font-semibold text-xs"
                          >
                            Ver HC
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* VIEW: RENDIMIENTO (DATOS DUROS + CAMPAÑAS MARKETING) */}
            {activeTab === 'rendimiento' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-[#0B0F19]">Rendimiento Integral & Campañas</h2>
                  <span className="px-3 py-1 bg-[#E8F5EE] text-[#2C6E49] rounded-full text-xs font-bold">
                    Período Septiembre 2026
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
                  <div className="p-4 bg-white border border-[#E5E7EB] rounded-2xl space-y-1 shadow-xs">
                    <span className="text-[#6B7280]">Pipeline Quirúrgico</span>
                    <div className="text-2xl font-bold text-[#0B0F19]">$95.500 USD</div>
                    <span className="text-[10px] text-[#589972] font-semibold">+18,5% mes</span>
                  </div>
                  <div className="p-4 bg-white border border-[#E5E7EB] rounded-2xl space-y-1 shadow-xs">
                    <span className="text-[#6B7280]">Facturación Total ARCA</span>
                    <div className="text-2xl font-bold text-[#0B0F19]">$14.280.000</div>
                    <span className="text-[10px] text-[#6B7280]">138 comprobantes con CAE</span>
                  </div>
                  <div className="p-4 bg-white border border-[#E5E7EB] rounded-2xl space-y-1 shadow-xs">
                    <span className="text-[#6B7280]">Tasa de Ausentismo</span>
                    <div className="text-2xl font-bold text-emerald-600">3.2%</div>
                    <span className="text-[10px] text-[#6B7280]">Reducida por WhatsApp</span>
                  </div>
                  <div className="p-4 bg-white border border-[#E5E7EB] rounded-2xl space-y-1 shadow-xs">
                    <span className="text-[#6B7280]">Ticket Promedio</span>
                    <div className="text-2xl font-bold text-[#0B0F19]">$850 USD</div>
                    <span className="text-[10px] text-[#6B7280]">Por procedimiento</span>
                  </div>
                </div>

                {/* Métricas de Campañas */}
                <div className="space-y-3 pt-2">
                  <h3 className="font-bold text-sm text-[#0B0F19]">Campañas Activas (GoHighLevel / Meta Ads)</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-4 bg-white border border-[#E5E7EB] rounded-2xl shadow-xs space-y-2">
                      <div className="flex justify-between items-center">
                        <strong className="text-sm">Rinoplastía Palermo (Meta Ads)</strong>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">ROAS 6.8x</span>
                      </div>
                      <div className="flex justify-between text-[#6B7280] pt-1 border-t border-gray-100">
                        <span>Inversión: $600 USD</span>
                        <span>48 leads generados</span>
                        <strong className="text-emerald-700">6 cirugías ($4.5M ARS)</strong>
                      </div>
                    </div>

                    <div className="p-4 bg-white border border-[#E5E7EB] rounded-2xl shadow-xs space-y-2">
                      <div className="flex justify-between items-center">
                        <strong className="text-sm">Traumatología & Rodilla (Google Ads)</strong>
                        <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-[10px]">ROAS 5.4x</span>
                      </div>
                      <div className="flex justify-between text-[#6B7280] pt-1 border-t border-gray-100">
                        <span>Inversión: $550 USD</span>
                        <span>62 leads generados</span>
                        <strong className="text-blue-700">29 turnos</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW: CONFIGURACIÓN (CONEXIONES CRM, WHATSAPP, GOOGLE + CAMBIO DE COLOR EN VIVO) */}
            {activeTab === 'configuracion' && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-[#0B0F19]">Configuración & Personalización</h2>
                  <p className="text-xs text-[#6B7280]">Ajustes de marca, conexiones con CRM y servicios externos.</p>
                </div>

                {/* 1. Selector de Color de Marca */}
                <div className="bg-white border border-[#E5E7EB] rounded-[20px] p-6 shadow-xs space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-sm text-[#0B0F19]">Color de Acento de la Plataforma</h3>
                      <p className="text-xs text-[#6B7280]">Modifica en tiempo real todo lo que se encuentra en verde.</p>
                    </div>
                    <span className="text-xs font-bold px-2 py-1 rounded-md bg-gray-100 text-[#0B0F19]">
                      Color: {brandColor}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    {[
                      { name: 'Verde Esmeralda', hex: '#589972' },
                      { name: 'Azul Médico', hex: '#2563EB' },
                      { name: 'Violeta Quirúrgico', hex: '#7C3AED' },
                      { name: 'Turquesa Clínico', hex: '#0D9488' },
                      { name: 'Burdeos', hex: '#9F1239' },
                      { name: 'Obsidian Black', hex: '#18181B' },
                    ].map(({ name, hex }) => (
                      <button
                        key={hex}
                        onClick={() => {
                          setBrandColor(hex);
                          showToast('Color de Marca', `Plataforma actualizada con tono ${name}.`, 'success');
                        }}
                        className="flex items-center space-x-2 px-3 py-1.5 rounded-full border border-gray-200 hover:border-gray-400 text-xs"
                      >
                        <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: hex }}></span>
                        <span>{name}</span>
                      </button>
                    ))}

                    <div className="flex items-center space-x-2 pl-2 border-l border-gray-200">
                      <input
                        type="color"
                        value={brandColor}
                        onChange={(e) => setBrandColor(e.target.value)}
                        className="w-7 h-7 rounded-lg cursor-pointer border-0 p-0"
                      />
                      <span className="text-xs text-gray-500">Libre</span>
                    </div>
                  </div>
                </div>

                {/* 2. Conexiones Externas */}
                <div className="bg-white border border-[#E5E7EB] rounded-[20px] p-6 shadow-xs space-y-4">
                  <h3 className="font-bold text-sm text-[#0B0F19]">Conexiones & Canales Integrados</h3>
                  <div className="divide-y divide-[#F0F2F5] text-xs">
                    <div className="py-3 flex items-center justify-between">
                      <div>
                        <strong className="text-sm block">WhatsApp Business API Oficial</strong>
                        <span className="text-[#6B7280]">Envío automático de recetas, recordatorios y confirmación de turnos.</span>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#E8F5EE] text-[#2C6E49]">Conectado</span>
                    </div>

                    <div className="py-3 flex items-center justify-between">
                      <div>
                        <strong className="text-sm block">CRM GoHighLevel (Leads & Funnels)</strong>
                        <span className="text-[#6B7280]">Sincronización en tiempo real de oportunidades y etiquetas de marketing.</span>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#E8F5EE] text-[#2C6E49]">Sincronizado</span>
                    </div>

                    <div className="py-3 flex items-center justify-between">
                      <div>
                        <strong className="text-sm block">Google Calendar & Google Meet</strong>
                        <span className="text-[#6B7280]">Integración bidireccional con agenda y salas virtuales.</span>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#E8F5EE] text-[#2C6E49]">Activo</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW: FACTURACIÓN */}
            {activeTab === 'facturacion' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-[#0B0F19]">Facturación Electrónica ARCA</h2>
                  <button
                    onClick={() => setModalFacturaOpen(true)}
                    className="px-3.5 py-1.5 text-white rounded-full text-xs font-semibold"
                    style={{ backgroundColor: brandColor }}
                  >
                    + Nueva Factura con CAE
                  </button>
                </div>
                <div className="p-6 bg-white border border-[#E5E7EB] rounded-[20px] shadow-xs">
                  <p className="text-xs text-[#6B7280]">Punto de Venta 0004 habilitado. Comprobantes A y B emitidos automáticamente.</p>
                </div>
              </div>
            )}

          </main>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BOTÓN VIVO DE IA: GIRO CONTINUO 3D + CLICK CHAT + LONG PRESS 1.5S VOZ     */}
      {/* ========================================================================= */}
      <div
        className="fixed bottom-8 right-8 z-40 flex items-center gap-3 cursor-pointer select-none"
        onMouseDown={handleSpherePressStart}
        onMouseUp={handleSpherePressEnd}
        onTouchStart={handleSpherePressStart}
        onTouchEnd={handleSpherePressEnd}
      >
        

        {/* Esfera verde 3D con giro continuo y levitación */}
        <div
          className={`w-14 h-14 rounded-full cursor-pointer relative shadow-lg transition-all duration-300 animate-[spin_10s_linear_infinite] ${isPressing ? "scale-75 blur-[2px] shadow-[0_0_20px_rgba(88,153,114,0.8)]" : "hover:scale-105 hover:shadow-[0_0_15px_rgba(88,153,114,0.5)]"}`}
          style={{
            background: 'radial-gradient(circle at 35% 35%, rgba(235, 252, 243, 0.98) 0%, rgba(152, 219, 180, 0.9) 30%, rgba(75, 158, 110, 0.82) 60%, rgba(26, 77, 49, 0.95) 100%)',
            boxShadow: '0 8px 24px rgba(78, 163, 114, 0.45), inset 0 2px 5px rgba(255, 255, 255, 0.9)',
          }}
          title="Clic: Chat IA | Mantén presionado (1.5s): Dictado por Voz"
        ></div>
      </div>

      {/* OVERLAY MODO VOZ INMERSIVO FULLSCREEN */}
      {isVoiceOverlayOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xl flex flex-col items-center justify-center p-4">
          <button
            onClick={() => {
              try { recognitionRef.current?.stop(); } catch(e) {}
              setIsVoiceOverlayOpen(false);
            }}
            className="absolute top-8 right-8 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="max-w-2xl w-full flex flex-col items-center space-y-12">
            <div className="relative">
              <div className={`absolute inset-0 bg-emerald-500 rounded-full blur-[100px] ${voiceStatus === 'listening' ? 'opacity-40 animate-pulse' : 'opacity-20 transition-opacity duration-1000'}`}></div>
              
              <div className="relative w-40 h-40 rounded-full border border-white/20 bg-gradient-to-br from-[#1A422B] to-[#589972] shadow-2xl flex items-center justify-center">
                <Mic className={`w-12 h-12 text-white ${voiceStatus === 'listening' ? 'animate-bounce' : ''}`} />
              </div>
            </div>

            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold text-white tracking-tight">
                {voiceStatus === 'listening' ? 'Te estoy escuchando...' : 'Procesando comando...'}
              </h2>
              <p className="text-lg text-emerald-100/70 font-light max-w-lg mx-auto">
                {voiceStatus === 'listening' 
                  ? (transcript ? transcript : "Mantén presionado y habla...") 
                  : "Generando acciones y actualizando registros."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* COPILOTO CHAT DRAWER */}
      {isCopilotOpen && (
        <div className="fixed inset-y-0 right-0 w-96 bg-white border-l border-[#E5E7EB] shadow-2xl z-50 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between p-4 border-b border-[#F0F2F5] bg-[#FBFDFB]">
              <h3 className="font-bold text-sm text-[#0B0F19] flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#589972] text-white flex items-center justify-center"><BrainCircuit className="w-3 h-3"/></div>
                Asistente Clínico Autónomo
              </h3>
              <button onClick={() => setIsCopilotOpen(false)} className="text-gray-400 hover:text-black p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto max-h-[60vh]">
              {chatMessages.length === 0 ? (
                <div className="text-center text-gray-400 text-xs py-10">
                  Escribe o dicta tu instrucción clínica...<br/><br/>
                  <span className="opacity-50">Ej: "Agenda un turno quirúrgico para el paciente mañana a las 14:00hs"</span>
                </div>
              ) : chatMessages.map((msg, i) => (
                <div key={i} className={"p-3 rounded-2xl text-xs leading-relaxed " + (msg.role === 'ai' ? 'bg-[#E8F5EE] text-[#1A422B] mr-6' : 'bg-[#F3F4F6] text-[#374151] ml-6')}>
                  {msg.text}
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 border-t border-[#F0F2F5] bg-gray-50 flex gap-2">
            <input
              type="text"
              placeholder="Instrucción clínica..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={async (e) => {
                if (e.key === 'Enter' && chatInput.trim()) {
                  const val = chatInput.trim();
                  setChatInput('');
                  setChatMessages((prev) => [...prev, {role: 'user', text: val}]);
                  try {
                    const res = await voiceCommandMutation.mutateAsync({ commandText: val });
                    setChatMessages((prev) => [...prev, {role: 'ai', text: res.message}]);
                  } catch (err) {
                    setChatMessages((prev) => [...prev, {role: 'ai', text: 'Error de conexión.'}]);
                  }
                }
              }}
              className="w-full p-2.5 bg-white border border-[#E5E7EB] rounded-xl text-xs outline-none focus:border-[#589972]"
            />
            <button onClick={async () => {
              if (chatInput.trim()) {
                  const val = chatInput.trim();
                  setChatInput('');
                  setChatMessages((prev) => [...prev, {role: 'user', text: val}]);
                  try {
                    const res = await voiceCommandMutation.mutateAsync({ commandText: val });
                    setChatMessages((prev) => [...prev, {role: 'ai', text: res.message}]);
                  } catch (err) {
                    setChatMessages((prev) => [...prev, {role: 'ai', text: 'Error de conexión.'}]);
                  }
                }
            }} className="px-3 bg-[#589972] text-white rounded-xl shadow-sm">
              <Send className="w-4 h-4"/>
            </button>
          </div>
        </div>
      )}

      {/* MODALES DE ACCESOS RÁPIDOS */}
      {modalAgendarOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[24px] border border-[#E5E7EB] max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0F2F5]">
              <h3 className="font-bold text-base text-[#0B0F19]">Agendar Nuevo Paciente</h3>
              <button onClick={() => setModalAgendarOpen(false)} className="text-gray-400 hover:text-black">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCrearTurno} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Nombre Completo del Paciente</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Marcelo Soria"
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  className="w-full p-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl outline-none focus:border-[#589972]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">DNI</label>
                  <input
                    type="text"
                    value={nuevoDni}
                    onChange={(e) => setNuevoDni(e.target.value)}
                    className="w-full p-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Teléfono (Para WhatsApp)</label>
                  <input
                    type="text"
                    value={nuevoTel}
                    onChange={(e) => setNuevoTel(e.target.value)}
                    className="w-full p-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl outline-none"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Horario Asignado</label>
                  <input
                    type="time"
                    required
                    value={nuevoHora.replace('hs','')}
                    onChange={(e) => setNuevoHora(e.target.value)}
                    className="w-full p-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Motivo (Tipo de Agenda)</label>
                  <select
                    value={nuevoTipo}
                    onChange={(e) => setNuevoTipo(e.target.value)}
                    className="w-full p-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl outline-none"
                  >
                    <option value="Consulta">Consulta General</option>
                    <option value="Cirugía">Cirugía Quirófano</option>
                    <option value="Control">Control Post-op</option>
                    <option value="Procedimiento">Procedimiento Menor</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-[#F0F2F5] flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setModalAgendarOpen(false)}
                  className="px-4 py-2 bg-[#F3F4F6] text-[#374151] rounded-xl font-semibold hover:bg-[#E5E7EB] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#111827] text-white rounded-xl font-bold hover:bg-black transition-colors"
                >
                  Confirmar Turno
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      

      {/* MODAL CONSULTAR */}
      {modalConsultarOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[24px] border border-[#E5E7EB] max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0F2F5]">
              <h3 className="font-bold text-base text-[#0B0F19]">Consultar Paciente</h3>
              <button onClick={() => setModalConsultarOpen(false)} className="text-gray-400 hover:text-black">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 bg-gray-50 text-gray-500 rounded-xl text-sm text-center">
              Busca un paciente en la base de datos de la clínica.
            </div>
            <div className="space-y-3">
              <input type="text" placeholder="Nombre, apellido o DNI..." className="w-full p-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl outline-none focus:border-[#589972] transition-colors" />
            </div>
            <div className="pt-3 border-t border-[#F0F2F5] flex justify-end space-x-2">
              <button onClick={() => setModalConsultarOpen(false)} className="px-4 py-2 bg-[#F3F4F6] text-[#374151] rounded-xl font-semibold">Cancelar</button>
              <button onClick={() => {
                setModalConsultarOpen(false);
                showToast('Búsqueda', 'Funcionalidad de búsqueda en desarrollo.', 'info');
              }} className="px-4 py-2 bg-[#111827] text-white rounded-xl font-bold">Buscar Paciente</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL RECETA */}
      {modalRecetaOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[24px] border border-[#E5E7EB] max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0F2F5]">
              <h3 className="font-bold text-base text-[#0B0F19]">Nueva Receta Digital</h3>
              <button onClick={() => setModalRecetaOpen(false)} className="text-gray-400 hover:text-black">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <input type="text" placeholder="Medicamento o Práctica..." className="w-full p-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl outline-none" />
              <textarea placeholder="Indicaciones..." className="w-full p-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl outline-none" rows={3}></textarea>
            </div>
            <div className="pt-3 border-t border-[#F0F2F5] flex justify-end space-x-2">
              <button onClick={() => setModalRecetaOpen(false)} className="px-4 py-2 bg-[#F3F4F6] text-[#374151] rounded-xl font-semibold">Cancelar</button>
              <button onClick={() => {
                setModalRecetaOpen(false);
                showToast('Receta Emitida', 'La receta digital fue firmada exitosamente.');
              }} className="px-4 py-2 bg-[#589972] text-white rounded-xl font-bold">Emitir y Firmar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL FACTURA */}
      {modalFacturaOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[24px] border border-[#E5E7EB] max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0F2F5]">
              <h3 className="font-bold text-base text-[#0B0F19]">Emitir Factura ARCA</h3>
              <button onClick={() => setModalFacturaOpen(false)} className="text-gray-400 hover:text-black">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <input type="text" placeholder="DNI o CUIT del pagador..." className="w-full p-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl outline-none" />
              <input type="number" placeholder="Monto ($ ARS)..." className="w-full p-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl outline-none" />
            </div>
            <div className="pt-3 border-t border-[#F0F2F5] flex justify-end space-x-2">
              <button onClick={() => setModalFacturaOpen(false)} className="px-4 py-2 bg-[#F3F4F6] text-[#374151] rounded-xl font-semibold">Cancelar</button>
              <button onClick={() => {
                setModalFacturaOpen(false);
                showToast('Factura Creada', 'Factura electrónica autorizada por ARCA.', 'info');
              }} className="px-4 py-2 bg-[#111827] text-white rounded-xl font-bold">Emitir Factura</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL COBRO DE SEÑA AUTOMÁTICO CON MERCADO PAGO */}
      {modalMpOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-[24px] border border-[#E5E7EB] max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0F2F5]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold text-xs border border-sky-200">
                  MP
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#0B0F19]">Cobro de Seña Mercado Pago</h3>
                  <span className="text-[11px] text-[#6B7280]">Reserva Quirúrgica y Bloqueo Anti-Cancelación</span>
                </div>
              </div>
              <button onClick={() => { setModalMpOpen(false); setMpPreference(null); }} className="text-gray-400 hover:text-black">
                <X className="w-5 h-5" />
              </button>
            </div>

            {!mpPreference ? (
              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="font-bold block mb-1 text-gray-700">Paciente</label>
                  <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 font-semibold flex justify-between items-center">
                    <span>{mpSelectedTurno?.paciente || 'Paciente'}</span>
                    <span className="text-[11px] text-gray-500 font-normal">{mpSelectedTurno?.telefono || 'Sin teléfono'}</span>
                  </div>
                </div>

                <div>
                  <label className="font-bold block mb-1 text-gray-700">Monto de Seña Solicitado ($ ARS)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-400 font-bold">$</span>
                    <input
                      type="number"
                      value={mpAmount}
                      onChange={(e) => setMpAmount(Number(e.target.value))}
                      className="w-full p-2.5 pl-7 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl outline-none font-bold text-sm text-[#0B0F19]"
                    />
                  </div>
                  <span className="text-[10px] text-gray-500 mt-1 block">El enlace caduca en 4 horas si no es abonado.</span>
                </div>

                <div className="pt-2 border-t border-[#F0F2F5] flex justify-end space-x-2">
                  <button
                    onClick={() => { setModalMpOpen(false); setMpPreference(null); }}
                    className="px-4 py-2 bg-[#F3F4F6] text-[#374151] rounded-xl font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        const targetPatient = pacientes.find(p => p.nombre === mpSelectedTurno?.paciente) || pacientes[0];
                        const res = await createMpPreferenceMutation.mutateAsync({
                          patientId: targetPatient ? targetPatient.id : 'demo_id',
                          appointmentId: mpSelectedTurno?.id,
                          amount: mpAmount,
                          title: `Seña Quirúrgica - ${mpSelectedTurno?.tipo || 'Consulta'}`,
                        });
                        setMpPreference(res);
                        showToast('Link de Seña Creado', `Preferencia de pago por ${mpAmount.toLocaleString()} lista.`, 'success');
                      } catch (err: any) {
                        showToast('Error', err.message || 'Error al generar preferencia.', 'error');
                      }
                    }}
                    className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    <CreditCard className="w-4 h-4" />
                    Generar Enlace de Seña MP
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-sky-600 text-white flex items-center justify-center mx-auto shadow-sm">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-sm text-sky-950">Enlace de Seña Activo</h4>
                  <p className="text-[11px] text-sky-800">
                    Monto: <strong>$ {mpPreference.amount.toLocaleString('es-AR')} ARS</strong> · Vence en 4 hs.
                  </p>
                  
                  <div className="p-2.5 bg-white rounded-xl border border-sky-200 flex items-center justify-between text-left">
                    <span className="font-mono text-[11px] text-gray-600 truncate max-w-[220px]">
                      {mpPreference.initPoint}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(mpPreference.initPoint);
                        showToast('Copiado', 'Enlace de Mercado Pago copiado al portapapeles.', 'info');
                      }}
                      className="px-2.5 py-1 bg-sky-100 hover:bg-sky-200 text-sky-900 rounded-lg font-bold text-[10px] flex items-center gap-1 shrink-0"
                    >
                      <Copy className="w-3 h-3" />
                      Copiar
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl flex items-center justify-between text-gray-700">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-gray-600" />
                    <div>
                      <strong className="block text-[11px]">Cobro en Mostrador</strong>
                      <span className="text-[10px] text-gray-500">QR activo para escanear en recepción</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-between items-center gap-2">
                  {/* Simulate instantaneous approved webhook settlement */}
                  <button
                    onClick={async () => {
                      try {
                        const targetPatient = pacientes.find(p => p.nombre === mpSelectedTurno?.paciente) || pacientes[0];
                        await confirmDepositMutation.mutateAsync({
                          patientId: targetPatient ? targetPatient.id : 'demo_id',
                          appointmentId: mpSelectedTurno?.id,
                          amount: mpAmount,
                          referenceId: mpPreference.referenceId,
                        });
                        showToast('Seña Acreditada', `Pago de ${mpAmount.toLocaleString()} confirmado. Turno GARANTIZADO.`, 'success');
                        utils.appointment.getToday.invalidate();
                        utils.patient.list.invalidate();
                        setModalMpOpen(false);
                        setMpPreference(null);
                      } catch (err: any) {
                        showToast('Error', err.message, 'error');
                      }
                    }}
                    className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Simular Pago Acreditado (Webhook)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SISTEMA DE TOASTS FLOTANTES INTEGRADO (SIN ALERTS) */}
      <div className="fixed bottom-6 left-6 z-50 flex flex-col-reverse gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto bg-white border border-[#E5E7EB] shadow-xl rounded-2xl p-4 flex items-center gap-3 max-w-sm animate-fade-in"
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
              toast.type === 'success' ? 'bg-[#E8F5EE] text-[#2C6E49]' : toast.type === 'info' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'
            }`}>
              {toast.type === 'success' ? '✓' : toast.type === 'info' ? 'i' : '✕'}
            </div>
            <div className="flex-1">
              <strong className="text-xs text-[#0B0F19] block">{toast.title}</strong>
              <span className="text-[11px] text-[#6B7280] leading-snug">{toast.message}</span>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
