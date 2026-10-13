# Checklist del paquete para firma: {{caso}}

Cliente: {{cliente}}
Fecha de ejecución: {{fecha_ejecucion}}
Estado: {{estado}}
{{#motivos}}- {{motivo}}
{{/motivos}}
## Soportes

| Tipo | Archivo | Vigencia | Estado | Aviso | País emisor | Aviso de emisor |
|------|---------|----------|--------|-------|-------------|-----------------|
{{#soportes}}| {{tipo}} | {{archivo}} | {{vigencia}} | {{estado}} | {{aviso}} | {{pais_emisor}} | {{aviso_emisor}} |
{{/soportes}}
## Campos faltantes

{{#faltantes}}- {{etiqueta}}: no existe en el maestro
{{/faltantes}}{{^faltantes}}Ninguno.
{{/faltantes}}
## Campos por confirmar

{{#por_confirmar}}- {{etiqueta}}: {{nota}}
{{/por_confirmar}}{{^por_confirmar}}Ninguno.
{{/por_confirmar}}
## Acciones

{{#ausentes}}- [ ] Conseguir el soporte {{tipo}} y agregarlo al paquete
{{/ausentes}}{{#vencidos}}- [ ] Renovar el soporte {{tipo}}, vencido desde {{vigencia}}
{{/vencidos}}{{#faltantes}}- [ ] Conseguir el dato "{{etiqueta}}" y completarlo en el formulario
{{/faltantes}}{{#por_confirmar}}- [ ] Confirmar con el cliente el campo "{{etiqueta}}"
{{/por_confirmar}}- [ ] Revisar el formulario y pasarlo a firma del representante legal
