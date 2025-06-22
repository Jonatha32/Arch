import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase/firebaseConfig';
import { format, subDays, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

const ProductivityAnalytics = ({ tasks }) => {
  const [analytics, setAnalytics] = useState({
    weeklyCompletion: 0,
    dailyAverage: 0,
    streak: 0,
    mostProductiveDay: '',
    weeklyTrend: 0
  });

  useEffect(() => {
    calculateAnalytics();
  }, [tasks]);

  const calculateAnalytics = async () => {
    if (!tasks.length) return;

    const now = new Date();
    const weekAgo = subDays(now, 7);
    const twoWeeksAgo = subDays(now, 14);

    // Tareas de esta semana
    const thisWeekTasks = tasks.filter(task => 
      task.date && isAfter(task.date, weekAgo)
    );
    
    // Tareas de la semana pasada
    const lastWeekTasks = tasks.filter(task => 
      task.date && isAfter(task.date, twoWeeksAgo) && isBefore(task.date, weekAgo)
    );

    // Cálculo de completitud semanal
    const completedThisWeek = thisWeekTasks.filter(task => task.completed).length;
    const weeklyCompletion = thisWeekTasks.length > 0 
      ? Math.round((completedThisWeek / thisWeekTasks.length) * 100) 
      : 0;

    // Promedio diario
    const dailyAverage = Math.round(thisWeekTasks.length / 7);

    // Tendencia semanal
    const lastWeekCompleted = lastWeekTasks.filter(task => task.completed).length;
    const weeklyTrend = lastWeekCompleted > 0 
      ? Math.round(((completedThisWeek - lastWeekCompleted) / lastWeekCompleted) * 100)
      : completedThisWeek > 0 ? 100 : 0;

    // Día más productivo
    const dayStats = {};
    thisWeekTasks.forEach(task => {
      if (task.completed && task.date) {
        const day = format(task.date, 'EEEE', { locale: es });
        dayStats[day] = (dayStats[day] || 0) + 1;
      }
    });
    
    const mostProductiveDay = Object.keys(dayStats).reduce((a, b) => 
      dayStats[a] > dayStats[b] ? a : b, 'Ninguno'
    );

    // Racha de días consecutivos
    let streak = 0;
    let currentDate = new Date();
    
    while (streak < 30) { // Máximo 30 días hacia atrás
      const dayTasks = tasks.filter(task => 
        task.date && 
        task.completed &&
        task.date >= startOfDay(currentDate) && 
        task.date <= endOfDay(currentDate)
      );
      
      if (dayTasks.length > 0) {
        streak++;
        currentDate = subDays(currentDate, 1);
      } else {
        break;
      }
    }

    setAnalytics({
      weeklyCompletion,
      dailyAverage,
      streak,
      mostProductiveDay,
      weeklyTrend
    });
  };

  return (
    <div className="card">
      <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        📊 Análisis de Productividad
      </h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary)' }}>
            {analytics.weeklyCompletion}%
          </div>
          <div style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>
            Completitud Semanal
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${analytics.weeklyCompletion}%` }}
            ></div>
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--secondary)' }}>
            {analytics.dailyAverage}
          </div>
          <div style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>
            Promedio Diario
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--success)' }}>
            {analytics.streak}
          </div>
          <div style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>
            Días Consecutivos
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.2rem', fontWeight: '600', color: 'var(--info)' }}>
            {analytics.mostProductiveDay}
          </div>
          <div style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>
            Día Más Productivo
          </div>
        </div>
      </div>

      <div style={{ 
        marginTop: '1.5rem', 
        padding: '1rem', 
        background: 'var(--surface-alt)', 
        borderRadius: '0.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <span style={{ fontSize: '1.2rem' }}>
          {analytics.weeklyTrend >= 0 ? '📈' : '📉'}
        </span>
        <span style={{ color: analytics.weeklyTrend >= 0 ? 'var(--success)' : 'var(--danger)' }}>
          {analytics.weeklyTrend >= 0 ? '+' : ''}{analytics.weeklyTrend}% vs semana pasada
        </span>
      </div>
    </div>
  );
};

export default ProductivityAnalytics;