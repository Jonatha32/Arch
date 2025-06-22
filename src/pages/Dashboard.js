import React, { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { collection, addDoc, query, where, onSnapshot, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/firebaseConfig';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import StatsCard from '../components/StatsCard';
import ProductivityAnalytics from '../components/ProductivityAnalytics';
import GoalsSystem from '../components/GoalsSystem';
import ThemeToggle from '../components/ThemeToggle';

function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedPriority, setSelectedPriority] = useState('medium');
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [activeView, setActiveView] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'tasks'),
      where('userId', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tasksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate()
      }));
      setTasks(tasksData);
    });

    return () => unsubscribe();
  }, []);

  const addTask = async (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    await addDoc(collection(db, 'tasks'), {
      text: newTask,
      completed: false,
      date: currentDate,
      priority: selectedPriority,
      userId: auth.currentUser.uid,
      createdAt: new Date()
    });

    setNewTask('');
    setShowQuickAdd(false);
  };

  const toggleTask = async (taskId, completed) => {
    await updateDoc(doc(db, 'tasks', taskId), { completed: !completed });
  };

  const deleteTask = async (taskId) => {
    await deleteDoc(doc(db, 'tasks', taskId));
  };

  const handleLogout = () => signOut(auth);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getTasksForDay = (day) => {
    return tasks.filter(task => task.date && isSameDay(task.date, day));
  };

  const getFilteredTasks = () => {
    let filtered = tasks;
    if (searchTerm) {
      filtered = filtered.filter(task => 
        task.text.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return filtered.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority || 'medium'] - priorityOrder[a.priority || 'medium'];
    });
  };

  const getStats = () => {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const today = new Date();
    const todayTasks = getTasksForDay(today);
    const todayCompleted = todayTasks.filter(task => task.completed).length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { total, completed, todayTasks: todayTasks.length, todayCompleted, completionRate };
  };

  const stats = getStats();

  return (
    <div className="container" style={{ padding: '2rem 1rem', maxWidth: '1400px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'left', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'left', alignItems: 'center', flex: 1 }}>
          <img 
            src="/images/a90f4370-8522-4e30-afb6-84c1dbeba61f.png" 
            alt="Logo" 
            style={{ width: '110px', objectFit: 'contain' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <ThemeToggle />
          <button onClick={handleLogout} className="btn btn-secondary">
            👋 Salir
          </button>
        </div>
      </header>

      {/* Navigation */}
      <nav style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {[
            { key: 'overview', label: '📊 Resumen', icon: '📊' },
            { key: 'tasks', label: '✅ Tareas', icon: '✅' },
            { key: 'calendar', label: '📅 Calendario', icon: '📅' },
            { key: 'analytics', label: '📈 Análisis', icon: '📈' },
            { key: 'goals', label: '🎯 Metas', icon: '🎯' }
          ].map(view => (
            <button
              key={view.key}
              onClick={() => setActiveView(view.key)}
              className={`btn ${activeView === view.key ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.9rem' }}
            >
              {view.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Stats Overview */}
      {activeView === 'overview' && (
        <div>
          <div className="stats-grid">
            <StatsCard 
              title="Total Tareas" 
              value={stats.total} 
              icon="📝" 
              color="var(--gradient)" 
            />
            <StatsCard 
              title="Completadas" 
              value={stats.completed} 
              icon="✅" 
              color="var(--gradient-alt)" 
              trend={stats.completionRate > 70 ? 15 : -5}
            />
            <StatsCard 
              title="Hoy" 
              value={`${stats.todayCompleted}/${stats.todayTasks}`} 
              icon="🎯" 
              color="var(--secondary)" 
            />
            <StatsCard 
              title="Eficiencia" 
              value={`${stats.completionRate}%`} 
              icon="⚡" 
              color="var(--success)" 
              trend={stats.completionRate > 80 ? 12 : -3}
            />
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
            <ProductivityAnalytics tasks={tasks} />
            <GoalsSystem tasks={tasks} />
          </div>
        </div>
      )}

      {/* Tasks View */}
      {activeView === 'tasks' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', alignItems: 'start' }}>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', margin: 0 }}>✨ Nueva Tarea</h2>
              <button 
                className="btn btn-icon btn-primary"
                onClick={() => setShowQuickAdd(!showQuickAdd)}
                title="Agregar rápido"
              >
                +
              </button>
            </div>
            
            <form onSubmit={addTask}>
              <div className="form-group">
                <input
                  type="text"
                  placeholder="¿Qué quieres lograr hoy?"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  style={{ fontSize: '1rem', padding: '1rem' }}
                />
              </div>
              
              <div className="form-group">
                <label style={{ fontSize: '0.9rem', fontWeight: '500' }}>Prioridad</label>
                <select 
                  value={selectedPriority} 
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', width: '100%' }}
                >
                  <option value="low">🟢 Baja</option>
                  <option value="medium">🟡 Media</option>
                  <option value="high">🔴 Alta</option>
                </select>
              </div>
              
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                🚀 Agregar Tarea
              </button>
            </form>

            <div style={{ marginTop: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.1rem', margin: 0 }}>📋 Mis Tareas</h3>
                <input
                  type="text"
                  placeholder="🔍 Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ 
                    padding: '0.5rem', 
                    borderRadius: '0.5rem', 
                    border: '1px solid var(--border)',
                    width: '150px',
                    fontSize: '0.9rem'
                  }}
                />
              </div>
              
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {getFilteredTasks().slice(0, 10).map(task => (
                  <div key={task.id} className={`task ${task.completed ? 'completed' : ''}`}>
                    <div className={`task-priority ${task.priority || 'medium'}`}></div>
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTask(task.id, task.completed)}
                      style={{ marginRight: '0.75rem' }}
                    />
                    <span className="task-text" style={{ flex: 1, fontSize: '0.95rem' }}>{task.text}</span>
                    <span style={{ 
                      fontSize: '0.8rem', 
                      color: 'var(--text-light)',
                      marginRight: '0.5rem'
                    }}>
                      {task.priority === 'high' ? '🔴' : task.priority === 'low' ? '🟢' : '🟡'}
                    </span>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="btn btn-icon"
                      style={{ 
                        background: 'var(--danger)', 
                        color: 'white',
                        fontSize: '0.8rem',
                        width: '30px',
                        height: '30px'
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
                
                {getFilteredTasks().length === 0 && (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '3rem 1rem',
                    color: 'var(--text-light)'
                  }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎯</div>
                    <p>¡Perfecto! No tienes tareas pendientes.</p>
                    <p style={{ fontSize: '0.9rem' }}>Es momento de agregar nuevos objetivos.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <button
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                className="btn btn-secondary"
              >
                ← Anterior
              </button>
              <h2 style={{ textAlign: 'center', margin: 0 }}>
                📅 {format(currentDate, 'MMMM yyyy', { locale: es })}
              </h2>
              <button
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                className="btn btn-secondary"
              >
                Siguiente →
              </button>
            </div>

            <div className="calendar">
              {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                <div key={day} style={{ 
                  padding: '0.75rem', 
                  textAlign: 'center', 
                  fontWeight: '600', 
                  background: 'var(--gradient)',
                  color: 'white',
                  fontSize: '0.9rem'
                }}>
                  {day}
                </div>
              ))}
              {monthDays.map(day => {
                const dayTasks = getTasksForDay(day);
                const isSelected = isSameDay(day, currentDate);
                return (
                  <div
                    key={day.toString()}
                    className={`calendar-day ${
                      isToday(day) ? 'today' : isSelected ? 'selected' : ''
                    }`}
                    onClick={() => setCurrentDate(day)}
                  >
                    <div style={{ fontWeight: isToday(day) ? '700' : 'normal', marginBottom: '0.5rem' }}>
                      {format(day, 'd')}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px' }}>
                      {dayTasks.slice(0, 4).map((task, i) => (
                        <div 
                          key={i} 
                          className="task-dot" 
                          title={task.text}
                          style={{
                            background: task.priority === 'high' ? 'var(--danger)' : 
                                       task.priority === 'low' ? 'var(--success)' : 'var(--secondary)'
                          }}
                        ></div>
                      ))}
                      {dayTasks.length > 4 && (
                        <div style={{ 
                          fontSize: '0.7rem', 
                          color: 'var(--text-light)',
                          fontWeight: '600'
                        }}>
                          +{dayTasks.length - 4}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Calendar View */}
      {activeView === 'calendar' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
              className="btn btn-secondary"
            >
              ← Anterior
            </button>
            <h2 style={{ textAlign: 'center', margin: 0 }}>
              📅 {format(currentDate, 'MMMM yyyy', { locale: es })}
            </h2>
            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
              className="btn btn-secondary"
            >
              Siguiente →
            </button>
          </div>

          <div className="calendar" style={{ marginBottom: '2rem' }}>
            {['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].map(day => (
              <div key={day} style={{ 
                padding: '1rem', 
                textAlign: 'center', 
                fontWeight: '600', 
                background: 'var(--gradient)',
                color: 'white'
              }}>
                {day}
              </div>
            ))}
            {monthDays.map(day => {
              const dayTasks = getTasksForDay(day);
              const isSelected = isSameDay(day, currentDate);
              return (
                <div
                  key={day.toString()}
                  className={`calendar-day ${
                    isToday(day) ? 'today' : isSelected ? 'selected' : ''
                  }`}
                  onClick={() => setCurrentDate(day)}
                  style={{ minHeight: '140px' }}
                >
                  <div style={{ fontWeight: isToday(day) ? '700' : 'normal', marginBottom: '0.5rem' }}>
                    {format(day, 'd')}
                  </div>
                  <div>
                    {dayTasks.slice(0, 3).map((task, i) => (
                      <div 
                        key={i} 
                        style={{
                          fontSize: '0.7rem',
                          padding: '2px 4px',
                          margin: '1px 0',
                          borderRadius: '2px',
                          background: task.completed ? 'var(--success-light)' : 
                                     task.priority === 'high' ? 'var(--danger)' : 
                                     task.priority === 'low' ? 'var(--success)' : 'var(--secondary)',
                          color: 'white',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                        title={task.text}
                      >
                        {task.text}
                      </div>
                    ))}
                    {dayTasks.length > 3 && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-light)', fontWeight: '600' }}>
                        +{dayTasks.length - 3} más
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Selected Day Tasks */}
          <div className="card" style={{ background: 'var(--surface-alt)' }}>
            <h3 style={{ marginBottom: '1rem' }}>
              📋 Tareas para {format(currentDate, 'dd MMMM yyyy', { locale: es })}
            </h3>
            {getTasksForDay(currentDate).length === 0 ? (
              <p style={{ color: 'var(--text-light)', textAlign: 'center', padding: '2rem' }}>
                No hay tareas programadas para este día
              </p>
            ) : (
              getTasksForDay(currentDate).map(task => (
                <div key={task.id} className={`task ${task.completed ? 'completed' : ''}`}>
                  <div className={`task-priority ${task.priority || 'medium'}`}></div>
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleTask(task.id, task.completed)}
                  />
                  <span style={{ flex: 1 }}>{task.text}</span>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="btn btn-icon"
                    style={{ background: 'var(--danger)', color: 'white' }}
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Analytics View */}
      {activeView === 'analytics' && (
        <div>
          <ProductivityAnalytics tasks={tasks} />
        </div>
      )}

      {/* Goals View */}
      {activeView === 'goals' && (
        <div>
          <GoalsSystem tasks={tasks} />
        </div>
      )}

      {/* Floating Action Button */}
      <button 
        className="fab"
        onClick={() => {
          setActiveView('tasks');
          setShowQuickAdd(true);
        }}
        title="Agregar tarea rápida"
      >
        +
      </button>
    </div>
  );
}

export default Dashboard;