import React, { useRef, useState } from 'react';
import {
  Image,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
  CATEGORIES,
  CATEGORY_ICONS,
  type Category,
  type Expense,
} from '@/types/expense';
import { LiquidGlassColors, Spacing } from '@/constants/theme';
import { useExpenses } from '@/context/ExpenseContext';
import {
  getAmountValidationError,
  getCategoryValidationError,
  getDescriptionValidationError,
  getExpenseDateValidationError,
} from '@/utils/expenseValidation';

interface AddExpenseModalProps {
  visible: boolean;
  onClose: () => void;
  initialExpense?: Expense;
}

// Modal que sube desde abajo para registrar un gasto.
// Para poder agregarlo hacen falta el monto y la categoria; la descripcion es opcional.
export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  visible,
  onClose,
  initialExpense,
}) => {
  const { addExpense, updateExpense } = useExpenses();
  // El monto es string porque asi trabaja el TextInput; se pasa a numero al guardar
  const [amount, setAmount] = useState(
    initialExpense ? String(initialExpense.amount) : ''
  );
  const [category, setCategory] = useState<Category | null>(
    initialExpense?.category ?? null
  );
  const [description, setDescription] = useState(initialExpense?.description ?? '');
  const [date, setDate] = useState(
    initialExpense ? new Date(initialExpense.date) : new Date()
  );
  const [invoiceUri, setInvoiceUri] = useState<string | undefined>(
    initialExpense?.invoiceUri
  );
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    amount?: string;
    category?: string;
    date?: string;
    description?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const clearForm = () => {
    setAmount('');
    setCategory(null);
    setDescription('');
    setDate(new Date());
    setInvoiceUri(undefined);
    setDatePickerVisible(false);
    setValidationErrors({});
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (event.type === 'dismissed') {
      setDatePickerVisible(false);
      return;
    }
    if (selectedDate && Number.isFinite(selectedDate.getTime())) {
      setDate(selectedDate);
      setValidationErrors((current) => ({
        ...current,
        date: getExpenseDateValidationError(selectedDate),
      }));
    }
    if (Platform.OS !== 'ios') setDatePickerVisible(false);
  };

  const chooseInvoice = async (source: 'camera' | 'gallery') => {
    try {
      const permission =
        source === 'camera'
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permiso requerido',
          source === 'camera'
            ? 'Permite el acceso a la cámara para tomar una foto del comprobante.'
            : 'Permite el acceso a tus fotos para adjuntar un comprobante.'
        );
        return;
      }

      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync({
              mediaTypes: ['images'],
              allowsEditing: true,
              quality: 0.85,
            })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images'],
              allowsEditing: true,
              quality: 0.85,
            });
      if (result.canceled || !result.assets[0]) return;

      const asset = result.assets[0];
      const extension =
        asset.mimeType?.split('/')[1]?.replace(/[^a-zA-Z0-9]/g, '') || 'jpg';
      const fileName = `invoice-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}.${extension}`;
      const sourceFile = new File(asset.uri);
      const destinationFile = new File(Paths.document, fileName);
      await sourceFile.copy(destinationFile);
      if (!destinationFile.exists) {
        throw new Error('The copied invoice image is not available in app storage');
      }
      setInvoiceUri(destinationFile.uri);
    } catch (error) {
      console.error('No se pudo adjuntar el comprobante', error);
      Alert.alert('Error', 'No se pudo adjuntar la imagen. Intenta de nuevo.');
    }
  };

  const handleSubmit = async () => {
    if (submittingRef.current) return;
    const errors: typeof validationErrors = {};
    const amountError = getAmountValidationError(amount);
    const categoryError = getCategoryValidationError(category, CATEGORIES);
    const descriptionError = getDescriptionValidationError(description);
    if (amountError) errors.amount = amountError;
    if (categoryError) errors.category = categoryError;
    const dateError =
      date instanceof Date
        ? getExpenseDateValidationError(date)
        : 'Selecciona una fecha válida.';
    if (dateError) errors.date = dateError;
    if (descriptionError) errors.description = descriptionError;
    setValidationErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    const numericAmount = Number(amount);
    if (!category) return;

    submittingRef.current = true;
    setIsSubmitting(true);
    try {
      const expenseData = {
        amount: numericAmount,
        category,
        date,
        description: description.trim() || undefined,
        invoiceUri,
      };
      if (initialExpense) {
        await updateExpense({ ...initialExpense, ...expenseData });
      } else {
        await addExpense(expenseData);
      }
    } catch (error) {
      console.error('Error al guardar el gasto', error);
      Alert.alert('Error', 'No se pudo guardar el gasto. Intenta de nuevo.');
      return;
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
    clearForm();
    onClose();
  };

  const handleClose = () => {
    if (submittingRef.current) return;
    clearForm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
        keyboardVerticalOffset={0}
      >
        {/* Tocar el fondo tambien cierra el modal */}
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        >
          <Animated.View entering={FadeIn} style={styles.backdropBlur}>
            <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
          </Animated.View>
        </TouchableOpacity>

        <Animated.View
          entering={SlideInDown.springify()}
          style={styles.modalContent}
        >
          <View style={styles.modalBackground}>
            <BlurView intensity={100} tint="light" style={styles.modalBlur}>
              <View style={styles.handleBar} />

              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.scrollContent}
              >
                <Text style={styles.title}>
                  {initialExpense ? 'Editar Gasto' : 'Agregar Gasto'}
                </Text>

                <View style={styles.inputSection}>
                  <Text style={styles.label}>Monto (USD)</Text>
                  <View style={styles.inputContainer}>
                    <Text style={styles.currencySymbol}>$</Text>
                    <TextInput
                      style={styles.input}
                      value={amount}
                      onChangeText={(value) => {
                        setAmount(value);
                        setValidationErrors((current) => ({
                          ...current,
                          amount: getAmountValidationError(value),
                        }));
                      }}
                      placeholder="0.00"
                      keyboardType="decimal-pad"
                      placeholderTextColor={LiquidGlassColors.glassTextSecondary}
                    />
                  </View>
                  {validationErrors.amount ? (
                    <Text accessibilityRole="alert" style={styles.validationError}>
                      {validationErrors.amount}
                    </Text>
                  ) : null}
                </View>

                <View style={styles.inputSection}>
                  <Text style={styles.label}>Fecha</Text>
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => setDatePickerVisible(true)}
                    accessibilityRole="button"
                    accessibilityLabel="Seleccionar fecha del gasto"
                  >
                    <Text style={styles.dateButtonText}>
                      {date.toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </Text>
                    <Text style={styles.dateButtonIcon}>📅</Text>
                  </TouchableOpacity>
                  {datePickerVisible && (
                    <View style={styles.datePickerContainer}>
                      <DateTimePicker
                        value={date}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={handleDateChange}
                        themeVariant="light"
                      />
                      {Platform.OS === 'ios' && (
                        <TouchableOpacity
                          style={styles.dateDoneButton}
                          onPress={() => setDatePickerVisible(false)}
                        >
                          <Text style={styles.dateDoneText}>Listo</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>

                <View style={styles.inputSection}>
                  <Text style={styles.label}>Categoría</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.categoriesScroll}
                    contentContainerStyle={styles.categoriesContent}
                  >
                    {/* La elegida se pinta con el gradiente */}
                    {CATEGORIES.map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        onPress={() => {
                          setCategory(cat);
                          setValidationErrors((current) => ({
                            ...current,
                            category: undefined,
                          }));
                        }}
                        style={[
                          styles.categoryButton,
                          category === cat && styles.categoryButtonActive,
                        ]}
                      >
                        {category === cat ? (
                          <LinearGradient
                            colors={[
                              LiquidGlassColors.primary,
                              LiquidGlassColors.secondary,
                            ]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.categoryGradient}
                          >
                            <Text style={styles.categoryIcon}>
                              {CATEGORY_ICONS[cat]}
                            </Text>
                            <Text style={styles.categoryTextActive}>{cat}</Text>
                          </LinearGradient>
                        ) : (
                          <>
                            <Text style={styles.categoryIcon}>
                              {CATEGORY_ICONS[cat]}
                            </Text>
                            <Text style={styles.categoryText}>{cat}</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  {validationErrors.category ? (
                    <Text accessibilityRole="alert" style={styles.validationError}>
                      {validationErrors.category}
                    </Text>
                  ) : null}
                </View>

                <View style={styles.inputSection}>
                  <Text style={styles.label}>Descripción (opcional)</Text>
                  <TextInput
                    style={[styles.input, styles.descriptionInput]}
                    value={description}
                    onChangeText={(value) => {
                      setDescription(value);
                      setValidationErrors((current) => ({
                        ...current,
                        description: getDescriptionValidationError(value),
                      }));
                    }}
                    placeholder="Ej: Almuerzo, transporte a la universidad..."
                    placeholderTextColor={LiquidGlassColors.glassTextSecondary}
                    multiline
                  />
                  <Text style={styles.characterCount}>
                    {description.length}/400
                  </Text>
                  {validationErrors.description ? (
                    <Text accessibilityRole="alert" style={styles.validationError}>
                      {validationErrors.description}
                    </Text>
                  ) : null}
                </View>

                <View style={styles.inputSection}>
                  <Text style={styles.label}>Factura o comprobante (opcional)</Text>
                  {invoiceUri ? (
                    <View style={styles.invoicePreviewContainer}>
                      <Image
                        source={{ uri: invoiceUri }}
                        style={styles.invoicePreview}
                        resizeMode="cover"
                        accessibilityLabel="Vista previa del comprobante adjunto"
                      />
                      <TouchableOpacity
                        style={styles.removeInvoiceButton}
                        onPress={() => setInvoiceUri(undefined)}
                        accessibilityRole="button"
                        accessibilityLabel="Quitar comprobante adjunto"
                      >
                        <Text style={styles.removeInvoiceText}>Quitar</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.invoiceActions}>
                      <TouchableOpacity
                        style={styles.invoiceButton}
                        onPress={() => void chooseInvoice('camera')}
                      >
                        <Text style={styles.invoiceButtonText}>📷  Cámara</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.invoiceButton}
                        onPress={() => void chooseInvoice('gallery')}
                      >
                        <Text style={styles.invoiceButtonText}>🖼️  Galería</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                {validationErrors.date ? (
                  <Text accessibilityRole="alert" style={styles.validationError}>
                    {validationErrors.date}
                  </Text>
                ) : null}

                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={handleClose}
                    disabled={isSubmitting}
                  >
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                    onPress={() => void handleSubmit()}
                    disabled={isSubmitting}
                  >
                    <LinearGradient
                      colors={[LiquidGlassColors.primary, LiquidGlassColors.secondary]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.submitGradient}
                    >
                      <Text style={styles.submitButtonText}>
                        {isSubmitting ? 'Guardando...' : initialExpense ? 'Guardar cambios' : 'Agregar'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </BlurView>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  backdropBlur: {
    flex: 1,
  },
  modalContent: {
    borderTopLeftRadius: Spacing.four,
    borderTopRightRadius: Spacing.four,
    overflow: 'hidden',
    maxHeight: '80%',
  },
  modalBackground: {
    // Bajito a proposito: si es casi opaco no se ve el blur del fondo
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderTopLeftRadius: Spacing.four,
    borderTopRightRadius: Spacing.four,
  },
  modalBlur: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.four,
    maxHeight: '100%',
  },
  scrollContent: {
    paddingBottom: Spacing.four,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: LiquidGlassColors.glassTextSecondary,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.three,
    marginTop: Spacing.two,
    opacity: 0.3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: LiquidGlassColors.glassText,
    marginBottom: Spacing.four,
  },
  inputSection: {
    marginBottom: Spacing.four,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: LiquidGlassColors.glassText,
    marginBottom: Spacing.two,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: LiquidGlassColors.glassBorder,
    paddingHorizontal: Spacing.three,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: 'bold',
    color: LiquidGlassColors.primary,
    marginRight: Spacing.one,
  },
  input: {
    flex: 1,
    fontSize: 18,
    color: LiquidGlassColors.glassText,
    paddingVertical: Spacing.three,
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: LiquidGlassColors.glassBorder,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  dateButtonText: {
    fontSize: 16,
    color: LiquidGlassColors.glassText,
  },
  dateButtonIcon: {
    fontSize: 20,
  },
  datePickerContainer: {
    marginTop: Spacing.two,
    borderRadius: Spacing.two,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
  },
  dateDoneButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  dateDoneText: {
    fontSize: 16,
    fontWeight: '600',
    color: LiquidGlassColors.secondary,
  },
  descriptionInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: LiquidGlassColors.glassBorder,
    paddingHorizontal: Spacing.three,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  invoiceActions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  invoiceButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: LiquidGlassColors.glassBorder,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  invoiceButtonText: {
    color: LiquidGlassColors.glassText,
    fontWeight: '600',
  },
  invoicePreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.two,
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: LiquidGlassColors.glassBorder,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  invoicePreview: {
    width: 80,
    height: 80,
    borderRadius: Spacing.two,
  },
  removeInvoiceButton: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
    backgroundColor: 'rgba(196, 69, 105, 0.12)',
  },
  removeInvoiceText: {
    color: LiquidGlassColors.secondary,
    fontWeight: '600',
  },
  validationError: {
    color: LiquidGlassColors.secondary,
    fontSize: 14,
    marginTop: Spacing.one,
    marginBottom: Spacing.two,
  },
  characterCount: {
    alignSelf: 'flex-end',
    color: LiquidGlassColors.glassTextSecondary,
    fontSize: 12,
    marginTop: Spacing.one,
  },
  categoriesScroll: {
    marginHorizontal: -Spacing.two,
  },
  categoriesContent: {
    paddingHorizontal: Spacing.two,
    gap: Spacing.two,
  },
  categoryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: LiquidGlassColors.glassBorder,
    padding: Spacing.two,
    minWidth: 100,
    alignItems: 'center',
  },
  categoryButtonActive: {
    borderColor: 'transparent',
  },
  categoryGradient: {
    padding: Spacing.two,
    borderRadius: Spacing.two,
    alignItems: 'center',
    width: '100%',
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: Spacing.one,
  },
  categoryText: {
    fontSize: 12,
    color: LiquidGlassColors.glassText,
    textAlign: 'center',
  },
  categoryTextActive: {
    fontSize: 12,
    color: LiquidGlassColors.glassTextLight,
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: LiquidGlassColors.glassBorder,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: LiquidGlassColors.glassText,
  },
  submitButton: {
    flex: 1,
    borderRadius: Spacing.two,
    overflow: 'hidden',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitGradient: {
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: LiquidGlassColors.glassTextLight,
  },
});
