# Valores para el portal de {{cliente}}

- Caso: {{caso}}
- Fecha de ejecución: {{fecha_ejecucion}}
- Aviso: {{aviso}}

Este cliente pide el registro en su propio portal, así que el agente no genera un formulario ({{aviso}}). La analista copia estos valores en el portal a mano, escribe ella misma las credenciales y hace clic en "Enviar". El agente no inicia sesión ni envía nada.

## Valores

| Etiqueta | Valor | Estado | Nota |
| --- | --- | --- | --- |
{{#campos}}| {{etiqueta}} | {{valor}} | {{estado}} | {{nota}} |
{{/campos}}
## Pendientes

{{#pendientes}}- {{etiqueta}} ({{estado}}). {{nota}}
{{/pendientes}}{{^pendientes}}Ninguno: todos los campos tienen valor del maestro.
{{/pendientes}}