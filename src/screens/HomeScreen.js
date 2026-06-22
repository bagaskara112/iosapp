import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import LottieView from 'lottie-react-native';
import UpdateMoodModal from '../components/UpdateMoodModal';
import { supabase } from '../lib/supabase';

export default function HomeScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [userName, setUserName] = useState('...');

  const [partnerMood, setPartnerMood] = useState(null);

  useEffect(() => {
    let subscription;

    async function fetchUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Query users table
        let { data: myData, error } = await supabase
          .from('users')
          .select('name, partner_id')
          .eq('id', user.id)
          .single();
          
        if (!myData && error?.code === 'PGRST116') {
          // Jika tidak ditemukan (PGRST116), insert otomatis
          const { data: inserted } = await supabase
            .from('users')
            .insert([{ id: user.id, name: user.email.split('@')[0] }])
            .select('name, partner_id')
            .single();
          myData = inserted || { name: user.email.split('@')[0], partner_id: null };
        }
          
        if (myData && myData.name) {
          setUserName(myData.name);
          
          if (myData.partner_id) {
            // fetch latest mood of partner
            const { data: moodData } = await supabase.from('moods')
              .select('*')
              .eq('user_id', myData.partner_id)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();
              
            if (moodData) {
              setPartnerMood(moodData);
            }
            
            // subscribe to moods
            subscription = supabase.channel('public:moods')
              .on(
                'postgres_changes', 
                { event: 'INSERT', schema: 'public', table: 'moods', filter: `user_id=eq.${myData.partner_id}` }, 
                payload => {
                  setPartnerMood(payload.new);
                }
              )
              .subscribe();
          }
        } else {
          // Fallback to part of email if not found in users table
          setUserName(user.email.split('@')[0]);
        }
      }
    }
    fetchUser();

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, []);

  const getMoodEmoji = (type) => {
    switch(type) {
      case 'senang': return '😊';
      case 'sedih': return '😭';
      case 'capek': return '😴';
      case 'marah': return '😡';
      case 'santai': return '😎';
      default: return '🤔';
    }
  };
  
  const isNegativeMood = partnerMood && ['sedih', 'capek', 'marah'].includes(partnerMood.mood_type);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleKirimPelukan = () => {
    // Haptic feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Pelukan Terkirim!', 'Kamu baru saja mengirim pelukan hangat untuk pasanganmu.');
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header Section */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Halo, {userName}! 👋</Text>
            <Text style={styles.subtitle}>Semoga harimu menyenangkan.</Text>
            <TouchableOpacity onPress={handleLogout} style={{marginTop: 5}}>
              <Text style={{color: '#FF6B6B', fontSize: 12}}>Logout</Text>
            </TouchableOpacity>
          </View>
          <Image 
            source={require('../../assets/panda.png')} 
            style={styles.avatarMini} 
          />
        </View>

        {/* Partner Card Section */}
        <View style={styles.partnerCard}>
          <Text style={styles.partnerTitle}>Mood Pasanganmu Saat Ini</Text>
          
          <View style={styles.partnerContent}>
            {/* 
              TUGAS MANUAL:
              Jika Anda sudah memiliki file animasi Lottie (misalnya 'mascot.json') di folder assets,
              silakan hapus komponen Image di bawah dan gunakan komponen LottieView ini:
              
              <LottieView
                autoPlay
                loop
                source={require('../../assets/mascot.json')}
                style={styles.partnerAvatar}
              />
            */}
            <Image 
              source={require('../../assets/fox.png')} 
              style={styles.partnerAvatar} 
            />
            <View style={styles.partnerStatusInfo}>
              {partnerMood ? (
                <>
                  <Text style={styles.partnerMoodText}>Lagi {partnerMood.mood_type} {getMoodEmoji(partnerMood.mood_type)}</Text>
                  {partnerMood.note && <Text style={styles.partnerNote}>"{partnerMood.note}"</Text>}
                </>
              ) : (
                <Text style={styles.partnerNote}>Belum ada update mood hari ini.</Text>
              )}
            </View>
          </View>
          
          {partnerMood && (
             <Text style={styles.timestamp}>Diperbarui baru saja</Text>
          )}
        </View>

        {/* Action Area Section */}
        <View style={styles.actionArea}>
          {/* Tombol Kirim Pelukan (muncul karena mood pasangan negatif) */}
          {isNegativeMood && (
            <TouchableOpacity style={styles.hugButton} onPress={handleKirimPelukan}>
              <Text style={styles.hugButtonText}>Kirim Pelukan 🤗</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={styles.updateMoodButton} 
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.updateMoodButtonText}>Update Mood Saya ✍️</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Modal Update Mood */}
      <UpdateMoodModal 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  avatarMini: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E0F7FA',
  },
  partnerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 30,
  },
  partnerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 15,
  },
  partnerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  partnerAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFE0B2',
    marginRight: 15,
  },
  partnerStatusInfo: {
    flex: 1,
  },
  partnerMoodText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  partnerNote: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  timestamp: {
    fontSize: 12,
    color: '#aaa',
    textAlign: 'right',
    marginTop: 15,
  },
  actionArea: {
    marginTop: 10,
  },
  hugButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 18,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  hugButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  updateMoodButton: {
    backgroundColor: '#4ECDC4',
    paddingVertical: 18,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#4ECDC4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  updateMoodButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
