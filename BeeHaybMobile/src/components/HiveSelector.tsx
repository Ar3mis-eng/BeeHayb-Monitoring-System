import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Hive } from '../types';

interface HiveSelectorProps {
  hives: Hive[];
  selectedHiveId: number | null;
  onSelectHive: (hiveId: number) => void;
}

const HiveSelector: React.FC<HiveSelectorProps> = ({ hives, selectedHiveId, onSelectHive }) => {
  if (hives.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Select Hive</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.list}>
        {hives.map((hive) => {
          const selected = hive.id === selectedHiveId;

          return (
            <TouchableOpacity
              key={hive.id}
              style={[styles.pill, selected && styles.pillSelected]}
              onPress={() => onSelectHive(hive.id)}
            >
              <Text style={[styles.pillText, selected && styles.pillTextSelected]}>{hive.hive_name}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 6,
    backgroundColor: 'rgba(248, 245, 240, 0.6)',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7C7468',
    marginBottom: 8,
  },
  list: {
    paddingRight: 12,
  },
  pill: {
    borderWidth: 1,
    borderColor: '#E1D8CA',
    backgroundColor: '#FFFDFC',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
  },
  pillSelected: {
    backgroundColor: '#D9A25F',
    borderColor: '#D9A25F',
  },
  pillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#5F574B',
  },
  pillTextSelected: {
    color: '#FFFFFF',
  },
});

export default HiveSelector;