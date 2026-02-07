import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants';

interface SwipeButtonsProps {
  onDelete: () => void;
  onKeep: () => void;
  onUndo?: () => void;
  canUndo?: boolean;
  disabled?: boolean;
}

export const SwipeButtons: React.FC<SwipeButtonsProps> = ({
  onDelete,
  onKeep,
  onUndo,
  canUndo = false,
  disabled = false,
}) => {
  return (
    <View style={styles.container}>
      {/* Undo Button */}
      <TouchableOpacity
        style={[styles.undoButton, !canUndo && styles.buttonDisabled]}
        onPress={onUndo}
        disabled={!canUndo || disabled}
      >
        <Text style={styles.undoText}>↶</Text>
      </TouchableOpacity>

      {/* Delete Button */}
      <TouchableOpacity
        style={[styles.button, styles.deleteButton, disabled && styles.buttonDisabled]}
        onPress={onDelete}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Text style={styles.buttonIcon}>✕</Text>
        <Text style={styles.buttonText}>Delete</Text>
      </TouchableOpacity>

      {/* Keep Button */}
      <TouchableOpacity
        style={[styles.button, styles.keepButton, disabled && styles.buttonDisabled]}
        onPress={onKeep}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Text style={styles.buttonIcon}>✓</Text>
        <Text style={styles.buttonText}>Keep</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    paddingVertical: 20,
  },
  button: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    height: 80,
    borderRadius: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  deleteButton: {
    backgroundColor: COLORS.danger,
  },
  keepButton: {
    backgroundColor: COLORS.success,
  },
  undoButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.3,
  },
  buttonIcon: {
    fontSize: 32,
    color: '#fff',
    fontWeight: 'bold',
  },
  buttonText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
    marginTop: 4,
  },
  undoText: {
    fontSize: 28,
    color: '#fff',
    fontWeight: 'bold',
  },
});
