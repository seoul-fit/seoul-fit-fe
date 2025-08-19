#!/bin/bash

echo "Import 경로 업데이트 시작..."

# Find all TypeScript files
find . -type f \( -name "*.ts" -o -name "*.tsx" \) \
  -not -path "./node_modules/*" \
  -not -path "./.next/*" \
  -not -path "./dist/*" | while read -r file; do
  
  # Backup original file
  cp "$file" "$file.bak"
  
  # Update imports
  sed -i \
    -e "s|from '@/components/ui|from '@/shared/ui|g" \
    -e "s|from '@/components/auth|from '@/shared/ui/auth|g" \
    -e "s|from '@/components/layout|from '@/shared/ui/layout|g" \
    -e "s|from '@/components/map|from '@/widgets/map-container/ui|g" \
    -e "s|from '@/hooks|from '@/shared/lib/hooks|g" \
    -e "s|from '@/services|from '@/shared/api|g" \
    -e "s|from '@/utils|from '@/shared/lib/utils|g" \
    -e "s|from '@/store|from '@/shared/model|g" \
    -e "s|from '\.\./\.\./\.\./components|from '@/shared/ui|g" \
    -e "s|from '\.\./\.\./\.\./hooks|from '@/shared/lib/hooks|g" \
    -e "s|from '\.\./\.\./\.\./services|from '@/shared/api|g" \
    -e "s|from '\.\./\.\./\.\./utils|from '@/shared/lib/utils|g" \
    -e "s|from '\.\./\.\./\.\./store|from '@/shared/model|g" \
    -e "s|from '\.\./\.\./components|from '@/shared/ui|g" \
    -e "s|from '\.\./\.\./hooks|from '@/shared/lib/hooks|g" \
    -e "s|from '\.\./\.\./services|from '@/shared/api|g" \
    -e "s|from '\.\./\.\./utils|from '@/shared/lib/utils|g" \
    -e "s|from '\.\./\.\./store|from '@/shared/model|g" \
    -e "s|from '\.\./components|from '@/shared/ui|g" \
    -e "s|from '\.\./hooks|from '@/shared/lib/hooks|g" \
    -e "s|from '\.\./services|from '@/shared/api|g" \
    -e "s|from '\.\./utils|from '@/shared/lib/utils|g" \
    -e "s|from '\.\./store|from '@/shared/model|g" \
    "$file"
  
  # Check if file changed
  if diff -q "$file" "$file.bak" > /dev/null; then
    # No changes, remove backup
    rm "$file.bak"
  else
    # Changes made, keep backup and report
    echo "Updated: $file"
    rm "$file.bak"
  fi
done

echo "Import 경로 업데이트 완료!"