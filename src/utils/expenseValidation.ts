export const MAX_EXPENSE_DESCRIPTION_LENGTH = 400;

const AMOUNT_PATTERN = /^\d+(?:\.\d{1,2})?$/;
const DESCRIPTION_PATTERN = /^[\p{L}\p{N} ]*$/u;

export function getAmountValidationError(value: string): string | undefined {
  const amount = value;
  if (!amount) return 'El monto es obligatorio.';
  if (amount.startsWith('-')) return 'El monto no puede ser negativo.';
  if (!AMOUNT_PATTERN.test(amount)) {
    return 'Ingresa solo números y usa máximo dos decimales, por ejemplo: 12.50.';
  }
  if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
    return 'El monto debe ser mayor que cero.';
  }
  return undefined;
}

export function getCategoryValidationError(
  category: string | null,
  validCategories: readonly string[]
): string | undefined {
  return category && validCategories.includes(category)
    ? undefined
    : 'Debes elegir una categoría para guardar el gasto.';
}

export function getExpenseDateValidationError(
  date: Date,
  today: Date = new Date()
): string | undefined {
  if (!Number.isFinite(date.getTime())) return 'Selecciona una fecha válida.';

  const selectedDay = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  ).getTime();
  const currentDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  ).getTime();

  if (selectedDay > currentDay) {
    return 'No se permiten gastos con fecha futura. En futuras versiones se podrán registrar gastos programados.';
  }
  return undefined;
}

export function getDescriptionValidationError(
  description: string
): string | undefined {
  if (description.length > MAX_EXPENSE_DESCRIPTION_LENGTH) {
    return 'La descripción no puede superar los 400 caracteres.';
  }
  if (!DESCRIPTION_PATTERN.test(description)) {
    return 'La descripción solo puede contener letras, números y espacios.';
  }
  return undefined;
}

export function isValidExpenseDescription(
  description: string | undefined
): boolean {
  return (
    description === undefined ||
    getDescriptionValidationError(description) === undefined
  );
}
