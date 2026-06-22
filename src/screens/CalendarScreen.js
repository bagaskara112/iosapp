import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { supabase } from '../lib/supabase';

export default function CalendarScreen() {
  const [moodHistory, setMoodHistory] = useState({});

  useEffect(() => {
    async function loadMoods() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('moods')
        .select('created_at, mood_type')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (data) {
        const history = {};
        data.forEach(mood => {
          const date = new Date(mood.created_at);
          // Hanya peduli tanggal hari ini saja untuk simplifikasi
          const day = date.getDate();
          history[day] = mood.mood_type;
        });
        setMoodHistory(history);
      }
    }
    loadMoods();
  }, []);

  // Mendapatkan jumlah hari di bulan ini
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const monthName = today.toLocaleString('id-ID', { month: 'long' });
  const year = today.getFullYear();
  
  const getMoodColor = (day) => {
    const mood = moodHistory[day];
    if (['marah', 'sedih', 'capek'].includes(mood)) return '#FF6B6B'; // Red (negatif)
    if (mood === 'santai') return '#4ECDC4'; // Teal (santai)
    if (mood === 'senang') return '#FFD93D'; // Yellow (senang)
    return '#E0E0E0'; // Grey (belum diisi)
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Riwayat Mood Kita</Text>
      
      <View style={styles.card}>
        <Text style={styles.monthTitle}>{monthName} {year}</Text>
        
        <View style={styles.calendarGrid}>
          {days.map(day => (
            <View key={day} style={styles.dayCell}>
              <Text style={styles.dayText}>{day}</Text>
              <View style={[styles.moodDot, { backgroundColor: getMoodColor(day) }]} />
            </View>
          ))}
        </View>
      </View>

      <View style={styles.legendContainer}>
        <Text style={styles.legendTitle}>Keterangan:</Text>
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: '#FFD93D' }]} /><Text style={styles.legendText}>Senang</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: '#4ECDC4' }]} /><Text style={styles.legendText}>Santai</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: '#FF6B6B' }]} /><Text style={styles.legendText}>Negatif (Marah/Sedih/Capek)</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    padding: 20,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 15,
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dayCell: {
    width: '13%', // Approx 7 columns
    aspectRatio: 0.8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  dayText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  moodDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendContainer: {
    marginTop: 30,
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 15,
  },
  legendTitle: {
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#555',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  legendText: {
    color: '#666',
    fontSize: 14,
  },
});
