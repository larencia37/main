#!/bin/bash

echo "==========================================="
echo "BACKUP AUTOMÁTICO SISTEMA HOSPITALARIO"
echo "==========================================="

BACKUP_DIR="/backups/clinica_venezuela"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$DATE.tar.gz"

# Crear directorio de backups si no existe
mkdir -p "$BACKUP_DIR"

echo "1. Backup de base de datos PostgreSQL..."
PGPASSWORD="$DB_PASSWORD"
pg_dump -U postgres -h localhost -d clinica_venezuela > "$BACKUP_DIR/db_backup_$DATE.sql"
if [ $? -ne 0 ]; then
    echo "Error en backup de base de datos"
    exit 1
fi

echo "2. Backup de archivos del sistema..."
tar -czf "$BACKUP_FILE" \
    backend/ \
    frontend/ \
    database/ \
    docs/ \
    config.env \
    "$BACKUP_DIR/db_backup_$DATE.sql"

echo "3. Verificar backup..."
if [ -f "$BACKUP_FILE" ]; then
    echo "Backup creado: $BACKUP_FILE"
    echo "Size: $(du -h "$BACKUP_FILE" | cut -f1)"
else
    echo "Error: Backup no creado"
    exit 1
fi

echo "4. Limpiar backups antiguos (más de 30 días)..."
find "$BACKUP_DIR" -name "backup_*.tar.gz" -mtime +30 -delete
find "$BACKUP_DIR" -name "db_backup_*.sql" -mtime +30 -delete

echo "==========================================="
echo "BACKUP COMPLETADO EXITOSAMENTE"
echo "==========================================="

# Enviar email de confirmación (opcional)
# mail -s "Backup Sistema Hospitalario $DATE" admin@clinica.com
