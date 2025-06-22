import React, { useState, useEffect } from 'react';
import { collection, addDoc, query, where, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { auth, db } from '../firebase/firebaseConfig';

const GoalsSystem = ({ tasks }) => {
  const [goals, setGoals] = useState([]);
  const [newGoal, setNewGoal] = useState({ title: '', target: '', deadline: '', type: 'daily' });
  const [showAddGoal, setShowAddGoal] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'goals'),
      where('userId', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const goalsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        deadline: doc.data().deadline?.toDate()
      }));
      setGoals(goalsData);
    });

    return () => unsubscribe();
  }, []);

  const addGoal = async (e) => {
    e.preventDefault();
    if (!newGoal.title || !newGoal.target) return;

    await addDoc(collection(db, 'goals'), {
      ...newGoal,
      target: parseInt(newGoal.target),
      progress: 0,
      completed: false,
      deadline: newGoal.deadline ? new Date(newGoal.deadline) : null,
      userId: auth.currentUser.uid,
      createdAt: new Date()
    });

    setNewGoal({ title: '', target: '', deadline: '', type: 'daily' });
    setShowAddGoal(false);
  };

  const calculateProgress = (goal) => {
    const now = new Date();
    let completed = 0;

    switch (goal.type) {
      case 'daily':
        const today = new Date().toDateString();
        completed = tasks.filter(task => 
          task.completed && 
          task.date && 
          task.date.toDateString() === today
        ).length;
        break;
      case 'weekly':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        completed = tasks.filter(task => 
          task.completed && 
          task.date && 
          task.date >= weekAgo
        ).length;
        break;
      case 'monthly':
        const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1);
        completed = tasks.filter(task => 
          task.completed && 
          task.date && 
          task.date >= monthAgo
        ).length;
        break;
      default:
        completed = tasks.filter(task => task.completed).length;
    }

    return Math.min(completed, goal.target);
  };

  const getAchievements = () => {
    const achievements = [];
    const completedTasks = tasks.filter(task => task.completed).length;
    
    if (completedTasks >= 1) achievements.push({ name: 'Primera Tarea', icon: '🎯', desc: 'Completaste tu primera tarea' });
    if (completedTasks >= 10) achievements.push({ name: 'Productivo', icon: '⚡', desc: '10 tareas completadas' });
    if (completedTasks >= 50) achievements.push({ name: 'Imparable', icon: '🚀', desc: '50 tareas completadas' });
    if (completedTasks >= 100) achievements.push({ name: 'Maestro', icon: '👑', desc: '100 tareas completadas' });
    
    // Racha de días
    const streak = calculateStreak();
    if (streak >= 3) achievements.push({ name: 'Constante', icon: '🔥', desc: '3 días consecutivos' });
    if (streak >= 7) achievements.push({ name: 'Dedicado', icon: '💪', desc: '7 días consecutivos' });
    if (streak >= 30) achievements.push({ name: 'Leyenda', icon: '🏆', desc: '30 días consecutivos' });

    return achievements;
  };

  const calculateStreak = () => {
    // Lógica simplificada para calcular racha
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const dayTasks = tasks.filter(task => 
        task.completed && 
        task.date && 
        task.date.toDateString() === checkDate.toDateString()
      );
      
      if (dayTasks.length > 0) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    
    return streak;
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          🎯 Metas y Logros
        </h3>
        <button 
          className="btn btn-secondary"
          onClick={() => setShowAddGoal(!showAddGoal)}
        >
          + Nueva Meta
        </button>
      </div>

      {showAddGoal && (
        <form onSubmit={addGoal} style={{ marginBottom: '2rem', padding: '1rem', background: 'var(--surface-alt)', borderRadius: '0.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <input
              type="text"
              placeholder="Título de la meta"
              value={newGoal.title}
              onChange={(e) => setNewGoal({...newGoal, title: e.target.value})}
              style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}
            />
            <input
              type="number"
              placeholder="Objetivo (número)"
              value={newGoal.target}
              onChange={(e) => setNewGoal({...newGoal, target: e.target.value})}
              style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <select
              value={newGoal.type}
              onChange={(e) => setNewGoal({...newGoal, type: e.target.value})}
              style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}
            >
              <option value="daily">Diario</option>
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensual</option>
            </select>
            <input
              type="date"
              value={newGoal.deadline}
              onChange={(e) => setNewGoal({...newGoal, deadline: e.target.value})}
              style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}
            />
          </div>
          <button type="submit" className="btn btn-primary">Crear Meta</button>
        </form>
      )}

      <div style={{ marginBottom: '2rem' }}>
        <h4 style={{ marginBottom: '1rem', color: 'var(--text-light)' }}>Metas Activas</h4>
        {goals.length === 0 ? (
          <p style={{ color: 'var(--text-light)', textAlign: 'center', padding: '2rem' }}>
            No tienes metas activas. ¡Crea tu primera meta!
          </p>
        ) : (
          goals.map(goal => {
            const progress = calculateProgress(goal);
            const percentage = Math.round((progress / goal.target) * 100);
            
            return (
              <div key={goal.id} style={{ 
                padding: '1rem', 
                border: '1px solid var(--border)', 
                borderRadius: '0.5rem', 
                marginBottom: '1rem' 
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h5>{goal.title}</h5>
                  <span style={{ 
                    padding: '0.25rem 0.5rem', 
                    background: goal.type === 'daily' ? 'var(--success-light)' : goal.type === 'weekly' ? 'var(--secondary-light)' : 'var(--primary-light)',
                    borderRadius: '0.25rem',
                    fontSize: '0.8rem'
                  }}>
                    {goal.type === 'daily' ? 'Diario' : goal.type === 'weekly' ? 'Semanal' : 'Mensual'}
                  </span>
                </div>
                <div style={{ marginBottom: '0.5rem' }}>
                  <span>{progress} / {goal.target}</span>
                  <span style={{ float: 'right', color: 'var(--primary)', fontWeight: '600' }}>
                    {percentage}%
                  </span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${percentage}%` }}></div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div>
        <h4 style={{ marginBottom: '1rem', color: 'var(--text-light)' }}>Logros Desbloqueados</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
          {getAchievements().map((achievement, index) => (
            <div key={index} style={{ 
              padding: '1rem', 
              background: 'var(--gradient-alt)', 
              color: 'white',
              borderRadius: '0.5rem',
              textAlign: 'center',
              animation: 'bounce 1s'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{achievement.icon}</div>
              <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{achievement.name}</div>
              <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>{achievement.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GoalsSystem;