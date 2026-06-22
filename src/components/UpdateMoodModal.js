import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, StyleSheet, Alert, ActivityIndicator, Keyboard, TouchableWithoutFeedback, KeyboardAvoidingView, Platform } from 'react-native';
import { supabase } from '../lib/supabase';

const MOODS = [
  { id: 'senang', icon: '😊', label: 'Senang' },
  { id: 'sedih', icon: '😭', label: 'Sedih' },
  { id: 'capek', icon: '😴', label: 'Capek' },
  { id: 'marah', icon: '😡', label: 'Marah' },
  { id: 'santai', icon: '😎', label: 'Santai' },
];

export default function UpdateMoodModal({ visible, onClose }) {
  const [selectedMood, setSelectedMood] = useState(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const handleKirim = async () => {
    if (!selectedMood) return;
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase.from('moods').insert([
      { 
        user_id: user.id, 
        mood_type: selectedMood, 
        note: note 
      }
    ]);

    setLoading(false);

    if (error) {
      Alert.alert('Gagal', 'Gagal menyimpan mood: ' + error.message);
    } else {
      Alert.alert('Berhasil', 'Mood kamu berhasil diupdate!');
      setNote('');
      setSelectedMood(null);
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ width: '100%', alignItems: 'center' }}
          >
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.modalContent}>
                <Text style={styles.title}>Update Moodku</Text>
          
          <View style={styles.moodContainer}>
            {MOODS.map(mood => (
              <TouchableOpacity
                key={mood.id}
                style={[
                  styles.moodButton,
                  selectedMood === mood.id && styles.moodButtonSelected
                ]}
                onPress={() => setSelectedMood(mood.id)}
              >
                <Text style={styles.moodIcon}>{mood.icon}</Text>
                <Text style={styles.moodLabel}>{mood.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={styles.input}
            placeholder="Ada yang mau diceritain? (Max 100 char)"
            placeholderTextColor="#888"
            maxLength={100}
            multiline
            value={note}
            onChangeText={setNote}
          />

          <View style={styles.actionContainer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose} disabled={loading}>
              <Text style={styles.cancelButtonText}>Batal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitButton, (!selectedMood || loading) && styles.submitButtonDisabled]}
              onPress={handleKirim}
              disabled={!selectedMood || loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.submitButtonText}>Kirim ke Pasangan</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    minHeight: 300,
    width: '90%',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  moodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  moodButton: {
    alignItems: 'center',
    padding: 10,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  moodButtonSelected: {
    borderColor: '#FFB6C1', // Pastel pink
    backgroundColor: '#FFF0F5',
  },
  moodIcon: {
    fontSize: 30,
    marginBottom: 5,
  },
  moodLabel: {
    fontSize: 12,
    color: '#555',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 15,
    height: 80,
    textAlignVertical: 'top',
    marginBottom: 20,
    fontSize: 14,
    color: '#333',
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    marginRight: 10,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: 'bold',
  },
  submitButton: {
    flex: 2,
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
