import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  Clock, 
  QrCode, 
  Plus, 
  LayoutGrid, 
  ChevronRight, 
  LogOut, 
  LogIn, 
  UserPlus,
  TrendingUp,
  Award,
  ShieldCheck,
  Menu,
  X,
  DollarSign,
  Camera
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { format } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Html5QrcodeScanner } from 'html5-qrcode';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Role = 'Admin' | 'Captain' | 'Supervisor' | 'Mainboy' | 'Juniorboy';

interface User {
  id: number;
  name: string;
  role: Role;
  wage_rate: number;
  qr_id: string;
  payment_method: string;
  email: string;
  phone: string;
  aadhaar: string;
  is_admin: boolean;
}

interface Dish {
  id: number;
  category_id: number;
  category_name: string;
  name: string;
  description: string;
  ingredients: string;
  price: number;
  photo_url: string;
}

interface Event {
  id: number;
  name: string;
  location: string;
  date: string;
  description: string;
}

interface Announcement {
  id: number;
  title: string;
  content: string;
  created_at: string;
  event_name: string | null;
}

interface Category {
  id: number;
  name: string;
}

interface Attendance {
  id: number;
  user_id: number;
  name: string;
  role: Role;
  check_in: string;
  check_out: string | null;
  total_wage: number | null;
  status: 'Pending' | 'Paid';
}

export default function App() {
  const [isJoining, setIsJoining] = useState(window.location.pathname === '/join');
  const [joinSuccess, setJoinSuccess] = useState<{ name: string, qr_id: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'staff' | 'categories' | 'attendance' | 'scan' | 'events' | 'announcements'>('dashboard');
  const [isAdmin, setIsAdmin] = useState(true); // Default to true for this demo, but controlled by toggle
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddDish, setShowAddDish] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [showAddAnnouncement, setShowAddAnnouncement] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', role: 'Juniorboy' as Role, wage_rate: 20, payment_method: 'Cash', email: '', phone: '', aadhaar: '', is_admin: false });
  const [newCategory, setNewCategory] = useState('');
  const [newDish, setNewDish] = useState({ category_id: 0, name: '', description: '', ingredients: '', price: 0, photo_url: '' });
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newEvent, setNewEvent] = useState({ name: '', location: '', date: '', description: '' });
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '', event_id: '' });
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [scanMode, setScanMode] = useState<'in' | 'out'>('in');
  const [scannerUser, setScannerUser] = useState<User | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === 'scan') {
      const scanner = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );
      
      scanner.render((decodedText) => {
        handleScan(decodedText, scanMode);
      }, (error) => {
        // console.warn(error);
      });
      
      scannerRef.current = scanner;
    } else {
      if (scannerRef.current) {
        scannerRef.current.clear();
        scannerRef.current = null;
      }
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
    };
  }, [activeTab, scanMode, scannerUser]);

  const fetchData = async () => {
    try {
      const [uRes, cRes, dRes, aRes, eRes, anRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/categories'),
        fetch('/api/dishes'),
        fetch('/api/attendance'),
        fetch('/api/events'),
        fetch('/api/announcements')
      ]);
      setUsers(await uRes.json());
      setCategories(await cRes.json());
      setDishes(await dRes.json());
      setAttendance(await aRes.json());
      setEvents(await eRes.json());
      setAnnouncements(await anRes.json());
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser)
    });
    const data = await res.json();
    if (isJoining) {
      setJoinSuccess({ name: newUser.name, qr_id: data.qr_id });
    } else {
      setShowAddUser(false);
      setNewUser({ name: '', role: 'Juniorboy', wage_rate: 20, payment_method: 'Cash', email: '', phone: '', aadhaar: '', is_admin: false });
      fetchData();
    }
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newEvent)
    });
    setShowAddEvent(false);
    setNewEvent({ name: '', location: '', date: '', description: '' });
    fetchData();
  };

  const handleAddAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAnnouncement)
    });
    setShowAddAnnouncement(false);
    setNewAnnouncement({ title: '', content: '', event_id: '' });
    fetchData();
  };

  const handleUpdateUser = async (userId: number, data: Partial<User>) => {
    await fetch(`/api/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    fetchData();
  };

  const handleMarkPaid = async (attendanceId: number) => {
    await fetch(`/api/attendance/${attendanceId}/pay`, {
      method: 'POST'
    });
    fetchData();
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategory) {
      await fetch(`/api/categories/${editingCategory.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategory })
      });
    } else {
      await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategory })
      });
    }
    setShowAddCategory(false);
    setEditingCategory(null);
    setNewCategory('');
    fetchData();
  };

  const handleDeleteCategory = async (id: number) => {
    if (confirm("Are you sure? This will delete all dishes in this category.")) {
      await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      fetchData();
    }
  };

  const handleAddDish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingDish) {
      await fetch(`/api/dishes/${editingDish.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDish)
      });
    } else {
      await fetch('/api/dishes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDish)
      });
    }
    setShowAddDish(false);
    setEditingDish(null);
    setNewDish({ category_id: 0, name: '', description: '', ingredients: '', price: 0, photo_url: '' });
    fetchData();
  };

  const handleDeleteDish = async (id: number) => {
    if (confirm("Are you sure you want to delete this dish?")) {
      await fetch(`/api/dishes/${id}`, { method: 'DELETE' });
      fetchData();
    }
  };

  const handleScan = async (qrId: string, type: 'in' | 'out') => {
    // If we are in "Scanner Login" mode
    if (!scannerUser) {
      const user = users.find(u => u.qr_id === qrId);
      if (user && (user.role === 'Captain' || user.role === 'Supervisor' || user.role === 'Admin')) {
        setScannerUser(user);
        setScanResult(`Authorized: ${user.name} (${user.role})`);
        setTimeout(() => setScanResult(null), 2000);
      } else {
        setScanResult("Error: Unauthorized. Only Captains or Supervisors can scan.");
        setTimeout(() => setScanResult(null), 3000);
      }
      return;
    }

    const endpoint = type === 'in' ? '/api/check-in' : '/api/check-out';
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        qr_id: qrId, 
        event_id: selectedEventId ? parseInt(selectedEventId) : null,
        scanner_qr_id: scannerUser.qr_id
      })
    });
    const data = await res.json();
    if (res.ok) {
      setScanResult(type === 'in' ? `Checked in: ${data.user.name}` : `Checked out! Wage: $${data.totalWage.toFixed(2)}`);
      fetchData();
    } else {
      setScanResult(`Error: ${data.error}`);
    }
    setTimeout(() => setScanResult(null), 3000);
  };

  const NavItem = ({ id, icon: Icon, label }: { id: typeof activeTab, icon: any, label: string }) => (
    <button
      onClick={() => { setActiveTab(id); setIsSidebarOpen(false); }}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 w-full text-left",
        activeTab === id 
          ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200" 
          : "text-stone-600 hover:bg-stone-100"
      )}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </button>
  );

  const copyJoinLink = () => {
    const link = `${window.location.origin}/join`;
    navigator.clipboard.writeText(link);
    alert("Join link copied to clipboard!");
  };

  if (isJoining) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
        >
          {!joinSuccess ? (
            <>
              <div className="p-8 bg-emerald-600 text-white text-center">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <UserPlus size={32} />
                </div>
                <h2 className="text-2xl font-bold">Join Cater Dishes</h2>
                <p className="text-emerald-100 text-sm mt-2">Enter your details to join our catering team.</p>
              </div>
              <form onSubmit={handleAddUser} className="p-8 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Full Name</label>
                  <input 
                    required
                    type="text" 
                    value={newUser.name}
                    onChange={e => setNewUser({...newUser, name: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    placeholder="John Doe"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Phone</label>
                    <input 
                      required
                      type="tel" 
                      value={newUser.phone}
                      onChange={e => setNewUser({...newUser, phone: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                      placeholder="9876543210"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Email</label>
                    <input 
                      required
                      type="email" 
                      value={newUser.email}
                      onChange={e => setNewUser({...newUser, email: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Aadhaar Name/ID</label>
                  <input 
                    required
                    type="text" 
                    value={newUser.aadhaar}
                    onChange={e => setNewUser({...newUser, aadhaar: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    placeholder="As per Aadhaar card"
                  />
                </div>
                <div className="pt-4">
                  <button type="submit" className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 active:scale-[0.98]">
                    Submit Application
                  </button>
                </div>
                <p className="text-[10px] text-stone-400 text-center uppercase font-bold tracking-widest">Cater Dishes Management System</p>
              </form>
            </>
          ) : (
            <div className="p-8 text-center space-y-6">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <ShieldCheck size={40} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-stone-900">Welcome, {joinSuccess.name}!</h2>
                <p className="text-stone-500 mt-2">Your profile has been created. Here is your unique QR ID for check-ins.</p>
              </div>
              <div className="p-6 bg-stone-50 rounded-3xl border border-stone-100 flex flex-col items-center gap-4">
                <QRCodeSVG value={joinSuccess.qr_id} size={160} />
                <p className="font-mono text-sm font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">{joinSuccess.qr_id}</p>
              </div>
              <div className="pt-4">
                <button 
                  onClick={() => { window.location.href = '/'; }}
                  className="w-full bg-stone-900 text-white py-4 rounded-xl font-bold hover:bg-stone-800 transition-all shadow-lg shadow-stone-200"
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-stone-50">
      {/* Mobile Menu Toggle */}
      <button 
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md"
      >
        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-stone-200 transition-transform duration-300 lg:translate-x-0 lg:static",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white">
              <Award size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Cater Dishes</h1>
              <p className="text-xs text-stone-500 font-medium uppercase tracking-wider">Management</p>
            </div>
          </div>

          <nav className="space-y-2">
            <NavItem id="dashboard" icon={TrendingUp} label="Dashboard" />
            <NavItem id="staff" icon={Users} label="Staff Directory" />
            <NavItem id="events" icon={Award} label="Events & Sites" />
            <NavItem id="announcements" icon={LogIn} label="Announcements" />
            <NavItem id="categories" icon={LayoutGrid} label="Categories" />
            <NavItem id="attendance" icon={Clock} label="Attendance" />
            <NavItem id="scan" icon={QrCode} label="Scan QR" />
          </nav>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-stone-100">
          <button 
            onClick={() => setIsAdmin(!isAdmin)}
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-xl transition-colors mb-4",
              isAdmin ? "bg-emerald-50 text-emerald-700" : "bg-stone-100 text-stone-600"
            )}
          >
            <ShieldCheck size={18} />
            <div className="text-left overflow-hidden">
              <p className="text-sm font-semibold truncate">{isAdmin ? 'Admin Mode' : 'Staff View'}</p>
              <p className="text-[10px] uppercase font-bold opacity-60">Toggle Access</p>
            </div>
          </button>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-stone-50">
            <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-stone-600">
              <Users size={18} />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold truncate">Cater Dishes</p>
              <p className="text-xs text-stone-500">v1.0.2</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <header>
                <h2 className="text-3xl font-bold text-stone-900">Welcome back, Admin</h2>
                <p className="text-stone-500">Here's what's happening with Cater Dishes today.</p>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'Total Staff', value: users.length, icon: Users, color: 'bg-blue-500' },
                  { label: 'Active Now', value: attendance.filter(a => !a.check_out).length, icon: Clock, color: 'bg-emerald-500' },
                  { label: 'Categories', value: categories.length, icon: LayoutGrid, color: 'bg-amber-500' },
                  isAdmin ? { label: 'Total Wages', value: `$${attendance.reduce((acc, curr) => acc + (curr.total_wage || 0), 0).toFixed(0)}`, icon: DollarSign, color: 'bg-purple-500' } : null,
                ].filter(Boolean).map((stat: any, i) => (
                  <div key={i} className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-white mb-4", stat.color)}>
                      <stat.icon size={24} />
                    </div>
                    <p className="text-stone-500 text-sm font-medium">{stat.label}</p>
                    <p className="text-2xl font-bold text-stone-900">{stat.value}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                  <div className="p-6 border-bottom border-stone-100 flex justify-between items-center">
                    <h3 className="font-bold text-lg">Recent Attendance</h3>
                    <button onClick={() => setActiveTab('attendance')} className="text-emerald-600 text-sm font-medium hover:underline">View all</button>
                  </div>
                  <div className="divide-y divide-stone-100">
                    {attendance.slice(0, 5).map((record) => (
                      <div key={record.id} className="p-4 flex items-center justify-between hover:bg-stone-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 font-bold">
                            {record.name[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{record.name}</p>
                            <p className="text-xs text-stone-500">{record.role}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-medium text-stone-900">{format(new Date(record.check_in), 'HH:mm')}</p>
                          <span className={cn(
                            "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase",
                            record.check_out ? "bg-stone-100 text-stone-600" : "bg-emerald-100 text-emerald-700"
                          )}>
                            {record.check_out ? 'Completed' : 'On Duty'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
                  <h3 className="font-bold text-lg mb-6">Staff Distribution</h3>
                  <div className="space-y-4">
                    {['Captain', 'Supervisor', 'Mainboy', 'Juniorboy'].map((role) => {
                      const count = users.filter(u => u.role === role).length;
                      const percentage = users.length ? (count / users.length) * 100 : 0;
                      return (
                        <div key={role}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium text-stone-600">{role}</span>
                            <span className="font-bold">{count}</span>
                          </div>
                          <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'events' && (
            <motion.div
              key="events"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">Events & Locations</h2>
                  <p className="text-stone-500">Manage auditorium sites and site assignments.</p>
                </div>
                {isAdmin && (
                  <button 
                    onClick={() => setShowAddEvent(true)}
                    className="bg-emerald-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-100"
                  >
                    <Plus size={18} />
                    <span>Add Location</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => (
                  <div key={event.id} className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                        <Award size={20} />
                      </div>
                      <h4 className="font-bold text-lg">{event.name}</h4>
                    </div>
                    <div className="space-y-2 text-sm text-stone-600">
                      <p className="flex items-center gap-2"><LayoutGrid size={14} /> {event.location}</p>
                      <p className="flex items-center gap-2"><Clock size={14} /> {format(new Date(event.date), 'PPP')}</p>
                      <p className="mt-4 text-stone-500 italic">{event.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'announcements' && (
            <motion.div
              key="announcements"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">Announcements</h2>
                  <p className="text-stone-500">Broadcast work updates and site joins to all staff.</p>
                </div>
                {isAdmin && (
                  <button 
                    onClick={() => setShowAddAnnouncement(true)}
                    className="bg-emerald-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-100"
                  >
                    <LogIn size={18} />
                    <span>New Announcement</span>
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {announcements.map((ann) => (
                  <div key={ann.id} className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-lg text-emerald-700">{ann.title}</h4>
                      <span className="text-xs text-stone-400">{format(new Date(ann.created_at), 'MMM d, HH:mm')}</span>
                    </div>
                    {ann.event_name && (
                      <span className="inline-block px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold uppercase rounded mb-3">
                        Event: {ann.event_name}
                      </span>
                    )}
                    <p className="text-stone-600 text-sm leading-relaxed">{ann.content}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'staff' && (
            <motion.div
              key="staff"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">Staff Directory</h2>
                  <p className="text-stone-500">Manage your catering team and their profiles.</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={copyJoinLink}
                    className="bg-stone-100 text-stone-700 px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-stone-200 transition-colors"
                  >
                    <QrCode size={18} />
                    <span>Copy Join Link</span>
                  </button>
                  <button 
                    onClick={() => setShowAddUser(true)}
                    className="bg-emerald-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-100"
                  >
                    <UserPlus size={18} />
                    <span>Add Staff</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {users.map((user) => (
                  <div key={user.id} className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 hover:shadow-md transition-shadow group">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                          <Users size={24} />
                        </div>
                        <div>
                          <h4 className="font-bold text-lg">{user.name}</h4>
                          <span className="text-xs font-bold uppercase tracking-wider text-stone-400">{user.role}</span>
                        </div>
                      </div>
                      <div className="p-2 bg-stone-50 rounded-lg group-hover:bg-emerald-50 transition-colors">
                        <QRCodeSVG value={user.qr_id} size={48} />
                      </div>
                    </div>
                    
                    <div className="space-y-3 pt-4 border-t border-stone-100">
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-stone-500 mb-2">
                        <div className="flex flex-col">
                          <span className="font-bold uppercase opacity-50">Phone</span>
                          <span className="text-stone-700">{user.phone || 'N/A'}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold uppercase opacity-50">Email</span>
                          <span className="text-stone-700 truncate">{user.email || 'N/A'}</span>
                        </div>
                        <div className="flex flex-col col-span-2 mt-1">
                          <span className="font-bold uppercase opacity-50">Aadhaar Name/ID</span>
                          <span className="text-stone-700">{user.aadhaar || 'N/A'}</span>
                        </div>
                      </div>
                      {isAdmin && (
                        <>
                          <div className="flex justify-between text-sm">
                            <span className="text-stone-500">Wage Rate</span>
                            <span className="font-bold text-emerald-600">${user.wage_rate}/hr</span>
                          </div>
                          <div className="flex justify-between text-sm items-center">
                            <span className="text-stone-500">Role & Admin</span>
                            <div className="flex gap-2">
                              <select 
                                value={user.role}
                                onChange={(e) => handleUpdateUser(user.id, { role: e.target.value as Role })}
                                className="text-xs font-bold bg-stone-100 px-2 py-1 rounded border-none outline-none"
                              >
                                <option value="Admin">Admin</option>
                                <option value="Captain">Captain</option>
                                <option value="Supervisor">Supervisor</option>
                                <option value="Mainboy">Main Boy</option>
                                <option value="Juniorboy">Junior Boy</option>
                              </select>
                              <button 
                                onClick={() => handleUpdateUser(user.id, { is_admin: !user.is_admin })}
                                className={cn(
                                  "text-[10px] font-bold px-2 py-1 rounded uppercase",
                                  user.is_admin ? "bg-emerald-600 text-white" : "bg-stone-200 text-stone-600"
                                )}
                              >
                                {user.is_admin ? 'Admin' : 'Staff'}
                              </button>
                            </div>
                          </div>
                          <div className="flex justify-between text-sm items-center">
                            <span className="text-stone-500">Payment Method</span>
                            <select 
                              value={user.payment_method}
                              onChange={(e) => handleUpdateUser(user.id, { payment_method: e.target.value })}
                              className="text-xs font-bold bg-stone-100 px-2 py-1 rounded border-none outline-none"
                            >
                              <option value="Cash">Cash</option>
                              <option value="Bank Transfer">Bank Transfer</option>
                              <option value="UPI">UPI</option>
                            </select>
                          </div>
                        </>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-stone-500">Access Type</span>
                        <span className="font-bold text-stone-700">
                          {(user.role === 'Captain' || user.role === 'Supervisor') ? 'Authorized Scanner' : 'Staff Member'}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-stone-500">QR ID</span>
                        <span className="font-mono text-xs bg-stone-100 px-2 py-0.5 rounded">{user.qr_id}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'categories' && (
            <motion.div
              key="categories"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-8"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">Menu Management</h2>
                  <p className="text-stone-500">Organize food categories and dishes.</p>
                </div>
                {isAdmin && (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => { setEditingCategory(null); setNewCategory(''); setShowAddCategory(true); }}
                      className="bg-stone-100 text-stone-700 px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-stone-200 transition-colors"
                    >
                      <Plus size={18} />
                      <span>New Category</span>
                    </button>
                    <button 
                      onClick={() => { setEditingDish(null); setNewDish({ category_id: categories[0]?.id || 0, name: '', description: '', ingredients: '', price: 0, photo_url: '' }); setShowAddDish(true); }}
                      className="bg-emerald-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-100"
                    >
                      <Plus size={18} />
                      <span>New Dish</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-12">
                {categories.map((cat) => (
                  <div key={cat.id} className="space-y-6">
                    <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                          <LayoutGrid size={20} />
                        </div>
                        <h3 className="text-xl font-bold text-stone-800">{cat.name}</h3>
                      </div>
                      {isAdmin && (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => { setEditingCategory(cat); setNewCategory(cat.name); setShowAddCategory(true); }}
                            className="text-stone-400 hover:text-emerald-600 text-xs font-bold uppercase"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDeleteCategory(cat.id)}
                            className="text-stone-400 hover:text-red-600 text-xs font-bold uppercase"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {dishes.filter(d => d.category_id === cat.id).map((dish) => (
                        <div key={dish.id} className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
                          {dish.photo_url && (
                            <div className="h-40 overflow-hidden">
                              <img src={dish.photo_url} alt={dish.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                            </div>
                          )}
                          <div className="p-5 space-y-3">
                            <div className="flex justify-between items-start">
                              <h4 className="font-bold text-lg">{dish.name}</h4>
                              <span className="text-emerald-600 font-bold">${dish.price}</span>
                            </div>
                            <p className="text-sm text-stone-500 line-clamp-2">{dish.description}</p>
                            <div className="pt-2">
                              <p className="text-[10px] font-bold text-stone-400 uppercase mb-1">Ingredients</p>
                              <p className="text-xs text-stone-600 truncate">{dish.ingredients}</p>
                            </div>
                            {isAdmin && (
                              <div className="flex gap-3 pt-4 border-t border-stone-50">
                                <button 
                                  onClick={() => { setEditingDish(dish); setNewDish({ ...dish }); setShowAddDish(true); }}
                                  className="flex-1 py-2 rounded-lg bg-stone-50 text-stone-600 text-xs font-bold hover:bg-stone-100 transition-colors"
                                >
                                  Edit Dish
                                </button>
                                <button 
                                  onClick={() => handleDeleteDish(dish.id)}
                                  className="flex-1 py-2 rounded-lg bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 transition-colors"
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      {dishes.filter(d => d.category_id === cat.id).length === 0 && (
                        <div className="col-span-full py-12 text-center bg-stone-50 rounded-2xl border-2 border-dashed border-stone-200">
                          <p className="text-stone-400 font-medium">No dishes in this category yet.</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'attendance' && (
            <motion.div
              key="attendance"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold">Attendance Log</h2>
                <p className="text-stone-500">Real-time tracking of staff check-ins and wage calculations.</p>
              </div>

              <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-stone-50 border-b border-stone-200">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-stone-500">Staff</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-stone-500">Event/Site</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-stone-500">Check In</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-stone-500">Check Out</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-stone-500">Status</th>
                      {isAdmin && <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-stone-500 text-right">Wage & Payment</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {attendance.map((record) => (
                      <tr key={record.id} className="hover:bg-stone-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 text-xs font-bold">
                              {record.name[0]}
                            </div>
                            <div>
                              <p className="font-semibold text-sm">{record.name}</p>
                              <p className="text-xs text-stone-400">{record.role}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-stone-600">
                          {record.event_name || 'General'}
                        </td>
                        <td className="px-6 py-4 text-sm text-stone-600">
                          {record.check_out ? format(new Date(record.check_out), 'HH:mm') : '-'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <span className={cn(
                              "px-2 py-1 rounded-full text-[10px] font-bold uppercase w-fit",
                              record.check_out ? "bg-stone-100 text-stone-600" : "bg-emerald-100 text-emerald-700"
                            )}>
                              {record.check_out ? 'Completed' : 'Active'}
                            </span>
                            {record.check_out && (
                              <span className={cn(
                                "px-2 py-1 rounded-full text-[10px] font-bold uppercase w-fit",
                                record.status === 'Paid' ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
                              )}>
                                {record.status}
                              </span>
                            )}
                          </div>
                        </td>
                        {isAdmin && (
                          <td className="px-6 py-4 text-right">
                            <div className="flex flex-col items-end gap-2">
                              <span className="font-bold text-emerald-600">
                                {record.total_wage ? `$${record.total_wage.toFixed(2)}` : '-'}
                              </span>
                              {record.check_out && record.status === 'Pending' && (
                                <button 
                                  onClick={() => handleMarkPaid(record.id)}
                                  className="text-[10px] bg-emerald-600 text-white px-2 py-1 rounded font-bold hover:bg-emerald-700 transition-colors"
                                >
                                  Mark Paid
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'scan' && (
            <motion.div
              key="scan"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-md mx-auto space-y-8 text-center"
            >
              <div>
                <h2 className="text-2xl font-bold">QR Terminal</h2>
                <p className="text-stone-500">
                  {!scannerUser ? "Scanner Authorization Required" : `Authorized: ${scannerUser.name}`}
                </p>
              </div>

              <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-xl space-y-6">
                {!scannerUser ? (
                  <div className="space-y-6">
                    <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                      <ShieldCheck size={40} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Scanner Login</h3>
                      <p className="text-sm text-stone-500 mt-1">Please scan your Captain or Supervisor QR code to unlock the terminal.</p>
                    </div>
                    <div className="aspect-square bg-stone-100 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-stone-300 relative overflow-hidden">
                      <div id="reader" className="w-full h-full"></div>
                      {!scannerRef.current && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-50/80 z-10">
                          <Camera size={48} className="text-stone-300 mb-2" />
                          <p className="text-xs text-stone-500 font-medium">Camera initializing...</p>
                        </div>
                      )}
                    </div>
                    <div className="pt-4 border-t border-stone-100">
                      <p className="text-[10px] text-stone-400 uppercase font-bold mb-2">Manual Entry (Simulation)</p>
                      <button 
                        onClick={() => {
                          const id = prompt("Enter Captain/Supervisor QR ID:");
                          if (id) handleScan(id, 'in');
                        }}
                        className="w-full py-3 rounded-xl bg-stone-50 text-stone-600 font-bold text-sm hover:bg-stone-100 transition-colors border border-stone-200"
                      >
                        Simulate Scanner Login
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-center bg-emerald-50 p-3 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                          {scannerUser.name[0]}
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-bold text-emerald-900">{scannerUser.name}</p>
                          <p className="text-[10px] text-emerald-700 uppercase font-bold">{scannerUser.role}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setScannerUser(null)}
                        className="text-[10px] font-bold text-emerald-700 uppercase hover:underline"
                      >
                        Logout
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div className="flex gap-2 p-1 bg-stone-100 rounded-xl">
                        <button 
                          onClick={() => setScanMode('in')}
                          className={cn(
                            "flex-1 py-2 rounded-lg font-bold text-sm transition-all",
                            scanMode === 'in' ? "bg-white text-emerald-600 shadow-sm" : "text-stone-500"
                          )}
                        >
                          Check In
                        </button>
                        <button 
                          onClick={() => setScanMode('out')}
                          className={cn(
                            "flex-1 py-2 rounded-lg font-bold text-sm transition-all",
                            scanMode === 'out' ? "bg-white text-emerald-600 shadow-sm" : "text-stone-500"
                          )}
                        >
                          Check Out
                        </button>
                      </div>

                      {scanMode === 'in' && (
                        <div className="text-left">
                          <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Select Event/Site</label>
                          <select 
                            value={selectedEventId}
                            onChange={(e) => setSelectedEventId(e.target.value)}
                            className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                          >
                            <option value="">General / No Specific Site</option>
                            {events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                          </select>
                        </div>
                      )}
                    </div>

                    <div className="aspect-square bg-stone-100 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-stone-300 relative overflow-hidden">
                      <div id="reader" className="w-full h-full"></div>
                      {!scannerRef.current && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-50/80 z-10">
                          <Camera size={48} className="text-stone-300 mb-2" />
                          <p className="text-xs text-stone-500 font-medium">Camera initializing...</p>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-stone-100">
                      <p className="text-[10px] text-stone-400 uppercase font-bold mb-2">Manual Entry (Simulation)</p>
                      <button 
                        onClick={() => {
                          const id = prompt("Enter Staff QR ID to simulate scan:");
                          if (id) handleScan(id, scanMode);
                        }}
                        className="w-full py-3 rounded-xl bg-stone-50 text-stone-600 font-bold text-sm hover:bg-stone-100 transition-colors border border-stone-200"
                      >
                        Simulate {scanMode === 'in' ? 'Check In' : 'Check Out'}
                      </button>
                    </div>
                  </>
                )}
              </div>

              {scanResult && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={cn(
                    "p-4 rounded-xl font-bold shadow-lg",
                    scanResult.startsWith('Error') ? "bg-red-50 text-red-600" : "bg-emerald-600 text-white"
                  )}
                >
                  {scanResult}
                </motion.div>
              )}

              <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-left">
                <p className="text-xs font-bold text-amber-800 uppercase mb-1">Security Note</p>
                <p className="text-xs text-amber-700 leading-relaxed">
                  Only authorized Captains and Supervisors can unlock this terminal to perform staff check-ins.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            <div className="p-6 border-b border-stone-100 flex justify-between items-center">
              <h3 className="text-xl font-bold">Add New Staff</h3>
              <button onClick={() => setShowAddUser(false)} className="text-stone-400 hover:text-stone-600"><X size={24} /></button>
            </div>
            <form onSubmit={handleAddUser} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">Full Name</label>
                <input 
                  required
                  type="text" 
                  value={newUser.name}
                  onChange={e => setNewUser({...newUser, name: e.target.value})}
                  className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="e.g. John Doe"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1">Phone</label>
                  <input 
                    required
                    type="tel" 
                    value={newUser.phone}
                    onChange={e => setNewUser({...newUser, phone: e.target.value})}
                    className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1">Email</label>
                  <input 
                    required
                    type="email" 
                    value={newUser.email}
                    onChange={e => setNewUser({...newUser, email: e.target.value})}
                    className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">Aadhaar Name/ID</label>
                <input 
                  required
                  type="text" 
                  value={newUser.aadhaar}
                  onChange={e => setNewUser({...newUser, aadhaar: e.target.value})}
                  className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">Role</label>
                <select 
                  value={newUser.role}
                  onChange={e => setNewUser({...newUser, role: e.target.value as Role})}
                  className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="Admin">Admin</option>
                  <option value="Captain">Captain</option>
                  <option value="Supervisor">Supervisor</option>
                  <option value="Mainboy">Main Boy</option>
                  <option value="Juniorboy">Junior Boy</option>
                </select>
              </div>
              <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl">
                <input 
                  type="checkbox" 
                  id="isAdmin"
                  checked={newUser.is_admin}
                  onChange={e => setNewUser({...newUser, is_admin: e.target.checked})}
                  className="w-5 h-5 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="isAdmin" className="text-sm font-bold text-stone-700">Grant Administrative Privileges</label>
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">Wage Rate ($/hr)</label>
                <input 
                  required
                  type="number" 
                  value={newUser.wage_rate}
                  onChange={e => setNewUser({...newUser, wage_rate: Number(e.target.value)})}
                  className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">Payment Method</label>
                <select 
                  value={newUser.payment_method}
                  onChange={e => setNewUser({...newUser, payment_method: e.target.value})}
                  className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="UPI">UPI</option>
                </select>
              </div>
              <button type="submit" className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-100">
                Create Profile
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Add Event Modal */}
      {showAddEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            <div className="p-6 border-b border-stone-100 flex justify-between items-center">
              <h3 className="text-xl font-bold">Add New Location/Site</h3>
              <button onClick={() => setShowAddEvent(false)} className="text-stone-400 hover:text-stone-600"><X size={24} /></button>
            </div>
            <form onSubmit={handleAddEvent} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">Auditorium/Site Name</label>
                <input 
                  required
                  type="text" 
                  value={newEvent.name}
                  onChange={e => setNewEvent({...newEvent, name: e.target.value})}
                  className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="e.g. Grand Plaza Auditorium"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">Location Address</label>
                <input 
                  required
                  type="text" 
                  value={newEvent.location}
                  onChange={e => setNewEvent({...newEvent, location: e.target.value})}
                  className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">Event Date</label>
                <input 
                  required
                  type="date" 
                  value={newEvent.date}
                  onChange={e => setNewEvent({...newEvent, date: e.target.value})}
                  className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">Description</label>
                <textarea 
                  value={newEvent.description}
                  onChange={e => setNewEvent({...newEvent, description: e.target.value})}
                  className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <button type="submit" className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-100">
                Create Event Site
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Add Announcement Modal */}
      {showAddAnnouncement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            <div className="p-6 border-b border-stone-100 flex justify-between items-center">
              <h3 className="text-xl font-bold">New Announcement</h3>
              <button onClick={() => setShowAddAnnouncement(false)} className="text-stone-400 hover:text-stone-600"><X size={24} /></button>
            </div>
            <form onSubmit={handleAddAnnouncement} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">Title</label>
                <input 
                  required
                  type="text" 
                  value={newAnnouncement.title}
                  onChange={e => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
                  className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="e.g. Work Assignment"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">Related Event (Optional)</label>
                <select 
                  value={newAnnouncement.event_id}
                  onChange={e => setNewAnnouncement({...newAnnouncement, event_id: e.target.value})}
                  className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="">None</option>
                  {events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">Content</label>
                <textarea 
                  required
                  rows={4}
                  value={newAnnouncement.content}
                  onChange={e => setNewAnnouncement({...newAnnouncement, content: e.target.value})}
                  className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="Announce work details or joining instructions..."
                />
              </div>
              <button type="submit" className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-100">
                Post Announcement
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Add Category Modal */}
      {showAddCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            <div className="p-6 border-b border-stone-100 flex justify-between items-center">
              <h3 className="text-xl font-bold">{editingCategory ? 'Edit Category' : 'Add New Category'}</h3>
              <button onClick={() => { setShowAddCategory(false); setEditingCategory(null); }} className="text-stone-400 hover:text-stone-600"><X size={24} /></button>
            </div>
            <form onSubmit={handleAddCategory} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">Category Name</label>
                <input 
                  required
                  type="text" 
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="e.g. Appetizers"
                />
              </div>
              <button type="submit" className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-100">
                {editingCategory ? 'Update Category' : 'Create Category'}
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Add Dish Modal */}
      {showAddDish && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            <div className="p-6 border-b border-stone-100 flex justify-between items-center">
              <h3 className="text-xl font-bold">{editingDish ? 'Edit Dish' : 'Add New Dish'}</h3>
              <button onClick={() => { setShowAddDish(false); setEditingDish(null); }} className="text-stone-400 hover:text-stone-600"><X size={24} /></button>
            </div>
            <form onSubmit={handleAddDish} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">Category</label>
                <select 
                  required
                  value={newDish.category_id}
                  onChange={e => setNewDish({...newDish, category_id: parseInt(e.target.value)})}
                  className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="">Select a category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">Dish Name</label>
                <input 
                  required
                  type="text" 
                  value={newDish.name}
                  onChange={e => setNewDish({...newDish, name: e.target.value})}
                  className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="e.g. Butter Chicken"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">Description</label>
                <textarea 
                  value={newDish.description}
                  onChange={e => setNewDish({...newDish, description: e.target.value})}
                  className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 outline-none h-24"
                  placeholder="Brief description of the dish..."
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">Ingredients</label>
                <input 
                  type="text" 
                  value={newDish.ingredients}
                  onChange={e => setNewDish({...newDish, ingredients: e.target.value})}
                  className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="e.g. Chicken, Butter, Spices"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1">Price ($)</label>
                  <input 
                    required
                    type="number" 
                    value={newDish.price}
                    onChange={e => setNewDish({...newDish, price: parseFloat(e.target.value)})}
                    className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1">Photo URL</label>
                  <input 
                    type="text" 
                    value={newDish.photo_url}
                    onChange={e => setNewDish({...newDish, photo_url: e.target.value})}
                    className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="https://..."
                  />
                </div>
              </div>
              <button type="submit" className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-100">
                {editingDish ? 'Update Dish' : 'Create Dish'}
              </button>
            </form>
          </motion.div>
        </div>
      )}

      <style>{`
        @keyframes scan {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(240px); }
        }
        .animate-scan {
          animation: scan 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
