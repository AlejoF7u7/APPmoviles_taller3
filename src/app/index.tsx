import { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { MonthlyHeader } from '@/components/MonthlyHeader';
import { ExpenseItem } from '@/components/ExpenseItem';
import { AddExpenseModal } from '@/components/AddExpenseModal';
import { useExpenses } from '@/context/ExpenseContext';
import { LiquidGlassColors, Spacing } from '@/constants/theme';
import { Expense, ExpenseSortOrder } from '@/types/expense';

// Pantalla principal: total del mes, lista de gastos y el boton + para agregar
export default function HomeScreen() {
  const { getCurrentMonthExpenses, isLoading, deleteExpense } = useExpenses();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense>();
  const [sortOrder, setSortOrder] = useState<ExpenseSortOrder>('date');
  const expenses = getCurrentMonthExpenses(sortOrder);

  const openAddExpense = () => {
    setEditingExpense(undefined);
    setModalVisible(true);
  };

  const openEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setModalVisible(true);
  };

  const confirmDeleteExpense = (expense: Expense) => {
    Alert.alert(
      'Eliminar gasto',
      '¿Seguro que quieres eliminar este gasto? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            void deleteExpense(expense.id).catch((error: unknown) => {
              console.error('Error al eliminar el gasto', error);
              Alert.alert('Error', 'No se pudo eliminar el gasto. Intenta de nuevo.');
            });
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <LinearGradient
        colors={['#FFF5F9', '#FFE8F0', '#FFF9FC']}
        style={styles.gradient}
      >
        {/* Circulos de color detras: dan algo que desenfocar a las tarjetas */}
        <View pointerEvents="none" style={[styles.orb, styles.orbPink]} />
        <View pointerEvents="none" style={[styles.orb, styles.orbOrange]} />
        <View pointerEvents="none" style={[styles.orb, styles.orbPurple]} />

        <SafeAreaView style={styles.safeArea}>
          <View style={styles.content}>
            <Text style={styles.appTitle}>Gastos Poliestudiante</Text>

            <MonthlyHeader />
            <View style={styles.sortRow}>
              <Text style={styles.sortLabel}>Ordenar:</Text>
              <TouchableOpacity
                style={[styles.sortOption, sortOrder === 'date' && styles.sortOptionActive]}
                onPress={() => setSortOrder('date')}
                accessibilityRole="button"
                accessibilityState={{ selected: sortOrder === 'date' }}
              >
                <Text style={[styles.sortOptionText, sortOrder === 'date' && styles.sortOptionTextActive]}>
                  Fecha
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sortOption, sortOrder === 'amount' && styles.sortOptionActive]}
                onPress={() => setSortOrder('amount')}
                accessibilityRole="button"
                accessibilityState={{ selected: sortOrder === 'amount' }}
              >
                <Text style={[styles.sortOptionText, sortOrder === 'amount' && styles.sortOptionTextActive]}>
                  Mayor monto
                </Text>
              </TouchableOpacity>
            </View>
            {isLoading ? (
              <View style={styles.emptyState}>
                <ActivityIndicator size="large" color={LiquidGlassColors.primary} />
              </View>
            ) : expenses.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>💸</Text>
                <Text style={styles.emptyTitle}>No hay gastos registrados</Text>
                <Text style={styles.emptyText}>
                  Presiona el botón + para agregar tu primer gasto
                </Text>
              </View>
            ) : (
              <FlatList
                data={expenses}
                keyExtractor={(item) => item.id}
                renderItem={({ item, index }) => (
                  <ExpenseItem
                    expense={item}
                    index={index}
                    onEdit={() => openEditExpense(item)}
                    onDelete={() => confirmDeleteExpense(item)}
                  />
                )}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>

          {/* Boton + de la esquina */}
          <TouchableOpacity
            style={styles.fab}
            onPress={openAddExpense}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[LiquidGlassColors.primary, LiquidGlassColors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.fabGradient}
            >
              <Text style={styles.fabIcon}>+</Text>
            </LinearGradient>
          </TouchableOpacity>

          <AddExpenseModal
            key={editingExpense?.id ?? 'new-expense'}
            visible={modalVisible}
            initialExpense={editingExpense}
            onClose={() => {
              setModalVisible(false);
              setEditingExpense(undefined);
            }}
          />
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
  },
  orbPink: {
    width: 220,
    height: 220,
    top: 60,
    left: -60,
    backgroundColor: 'rgba(255, 107, 157, 0.55)',
  },
  orbOrange: {
    width: 180,
    height: 180,
    top: 260,
    right: -50,
    backgroundColor: 'rgba(255, 159, 94, 0.5)',
  },
  orbPurple: {
    width: 200,
    height: 200,
    bottom: 120,
    left: 20,
    backgroundColor: 'rgba(168, 120, 220, 0.4)',
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: LiquidGlassColors.glassText,
    marginBottom: Spacing.three,
    textAlign: 'center',
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  sortLabel: {
    color: LiquidGlassColors.glassTextSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  sortOption: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: LiquidGlassColors.glassBorder,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  sortOptionActive: {
    backgroundColor: LiquidGlassColors.primary,
    borderColor: LiquidGlassColors.primary,
  },
  sortOptionText: {
    color: LiquidGlassColors.glassText,
    fontSize: 13,
    fontWeight: '600',
  },
  sortOptionTextActive: {
    color: LiquidGlassColors.glassTextLight,
  },
  listContent: {
    paddingBottom: 100,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: Spacing.three,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: LiquidGlassColors.glassText,
    marginBottom: Spacing.two,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: LiquidGlassColors.glassTextSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    bottom: Spacing.four,
    right: Spacing.four,
    borderRadius: 32,
    overflow: 'hidden',
    shadowColor: LiquidGlassColors.shadowDark,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  fabGradient: {
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabIcon: {
    fontSize: 32,
    color: LiquidGlassColors.glassTextLight,
    fontWeight: '300',
  },
});
