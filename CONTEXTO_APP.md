# Contexto actual de la app

## Qué hace

Gestor de Gastos para Poliestudiantes permite registrar gastos personales de estudiantes y consultar cuánto se ha gastado durante el mes actual.

## Qué tiene actualmente

- Una pantalla principal con el nombre de la app, el mes actual y el total gastado en ese mes, expresado en dólares estadounidenses (USD).
- Una lista de los gastos del mes actual, con la categoría, el monto, la fecha y, si se agregó, una descripción. Los gastos más recientes aparecen primero.
- Orden predeterminado por fecha, con una opción para ordenar por monto de mayor a menor.
- Un formulario para agregar gastos con monto, fecha obligatoria seleccionable, categoría, descripción opcional y comprobante opcional.
- Adjuntar comprobantes tomando una fotografía con la cámara o seleccionando una imagen de la galería.
- Editar los datos de un gasto, incluida la fecha y la imagen adjunta, y eliminarlo después de confirmar la acción.
- Seis categorías disponibles: Transporte, Alimentación, Material académico, Entretenimiento, Salud y Otros.
- Validación del monto (mayor que cero y hasta dos decimales), fecha y categoría antes de guardar.
- Un estado inicial de carga y un mensaje cuando todavía no hay gastos registrados en el mes.
- Guardado local en el dispositivo: los gastos y las imágenes adjuntas se conservan al cerrar y volver a abrir la app.
- Interfaz en español con una presentación visual basada en colores suaves, tarjetas translúcidas y animaciones.

## Uso actual

1. En la pantalla principal se revisan el total y los gastos del mes en curso.
2. Se toca el botón `+` para abrir el formulario.
3. Se ingresa el monto, se selecciona una fecha y una categoría; opcionalmente se escribe una descripción o se adjunta un comprobante.
4. Al agregar el gasto, queda guardado y aparece en la lista; el total mensual se actualiza.
5. En cada gasto se puede editar la información o solicitar su eliminación con confirmación.

## Alcance y límites actuales

- La pantalla muestra únicamente los gastos del mes actual; no hay navegación para consultar otros meses.
- No incluye presupuestos, registro de ingresos, gráficos, reportes ni exportación.
- No incluye cuentas de usuario ni sincronización entre dispositivos.
- Los montos se presentan en USD.

Este documento describe el comportamiento disponible actualmente, no una propuesta de funcionalidades futuras.
