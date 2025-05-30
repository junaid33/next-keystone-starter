#!/usr/bin/env node
/**
 * Standalone script to analyze field types in any Keystone project
 * Usage: tsx analyze-field-types.ts [path-to-models-folder]
 */

import { writeFileSync, readFileSync, readdirSync, existsSync } from 'fs';
import { join, resolve } from 'path';

/**
 * Get available field types by scanning the views directory
 */
function getAvailableFieldTypes(viewsDir: string): string[] {
  if (!existsSync(viewsDir)) {
    console.error(`❌ Views directory not found: ${viewsDir}`);
    return [];
  }

  const fieldTypes = readdirSync(viewsDir)
    .filter(item => {
      // Skip system files and TypeScript files
      if (item.startsWith('.') || item.endsWith('.ts')) return false;
      
      const itemPath = join(viewsDir, item);
      try {
        // Check if it's a directory and has contents
        const stats = require('fs').statSync(itemPath);
        return stats.isDirectory() && readdirSync(itemPath).length > 0;
      } catch (error) {
        return false;
      }
    });

  console.log(`📁 Found field types in views directory: ${fieldTypes.join(', ')}`);
  return fieldTypes;
}

/**
 * Resolve spread imports and extract field types from imported objects
 */
function resolveSpreadImports(content: string, modelsDir: string, fieldTypes: string[]): Map<string, string[]> {
  const spreadFieldTypes = new Map<string, string[]>();
  
  // Find spread imports like: ...trackingFields
  const spreadPattern = /\.\.\.([\w]+)/g;
  let match;
  
  while ((match = spreadPattern.exec(content)) !== null) {
    const spreadName = match[1];
    
    // Find the import for this spread
    const importPattern = new RegExp(`import\\s*{[^}]*\\b${spreadName}\\b[^}]*}\\s*from\\s*["']([^"']+)["']`);
    const importMatch = content.match(importPattern);
    
    if (importMatch) {
      const importPath = importMatch[1];
      let resolvedPath: string;
      
      // Handle relative imports
      if (importPath.startsWith('./') || importPath.startsWith('../')) {
        resolvedPath = resolve(modelsDir, importPath + '.ts');
      } else {
        // Handle absolute imports within the project
        resolvedPath = join(modelsDir, importPath + '.ts');
      }
      
      if (existsSync(resolvedPath)) {
        const importedContent = readFileSync(resolvedPath, 'utf-8');
        console.log(`  📦 Resolving spread import: ${spreadName} from ${importPath}`);
        
        // Extract field types from the imported object
        const extractedFieldTypes = extractFieldTypesFromObject(importedContent, spreadName, fieldTypes);
        if (extractedFieldTypes.length > 0) {
          spreadFieldTypes.set(spreadName, extractedFieldTypes);
          console.log(`    Found spread fields: ${extractedFieldTypes.join(', ')}`);
        }
      }
    }
  }
  
  return spreadFieldTypes;
}

/**
 * Extract field types from an exported object
 */
function extractFieldTypesFromObject(content: string, objectName: string, availableFieldTypes: string[]): string[] {
  const foundFieldTypes: string[] = [];
  
  // Find the object definition
  const objectPattern = new RegExp(`export\\s+const\\s+${objectName}\\s*=\\s*{([^}]+)}`, 's');
  const objectMatch = content.match(objectPattern);
  
  if (objectMatch) {
    const objectBody = objectMatch[1];
    
    // Create dynamic field pattern from available field types
    const fieldTypePattern = availableFieldTypes.join('|');
    const fieldPattern = new RegExp(`(\\w+):\\s*(${fieldTypePattern})\\s*\\(`, 'g');
    let match;
    
    while ((match = fieldPattern.exec(objectBody)) !== null) {
      const [, , fieldType] = match;
      foundFieldTypes.push(fieldType);
    }
  }
  
  return foundFieldTypes;
}

/**
 * Analyze model files to extract field types in order
 */
function analyzeModels(modelsDir: string, availableFieldTypes: string[]): string[] {
  const fieldTypes = new Set<string>();
  const orderedFieldTypes: string[] = [];
  
  // ID is always first
  orderedFieldTypes.push('id');
  fieldTypes.add('id');

  if (!existsSync(modelsDir)) {
    console.error(`❌ Models directory not found: ${modelsDir}`);
    return orderedFieldTypes;
  }

  // Read all model files
  const modelFiles = readdirSync(modelsDir)
    .filter(file => file.endsWith('.ts') && file !== 'index.ts');

  console.log(`\n📁 Found ${modelFiles.length} model files in ${modelsDir}:`);
  console.log(modelFiles.map(f => `  - ${f}`).join('\n'));

  // Process each model file in order
  for (const modelFile of modelFiles.sort()) {
    const content = readFileSync(join(modelsDir, modelFile), 'utf-8');
    console.log(`\n📄 Processing ${modelFile}...`);
    
    // First, resolve any spread imports
    const spreadFieldTypes = resolveSpreadImports(content, modelsDir, availableFieldTypes);
    
    // Extract direct field definitions using regex
    // Create dynamic field pattern from available field types
    const fieldTypePattern = availableFieldTypes.join('|');
    const fieldPattern = new RegExp(`(\\w+):\\s*(${fieldTypePattern})\\s*\\(`, 'g');
    let match;
    const fieldsInFile: string[] = [];
    
    while ((match = fieldPattern.exec(content)) !== null) {
      const [, fieldName, fieldType] = match;
      
      // Skip if it's not a field definition (e.g., could be in a comment)
      if (fieldName === 'fields' || fieldName === 'access') continue;
      
      fieldsInFile.push(`    ${fieldName}: ${fieldType}`);
      
      if (!fieldTypes.has(fieldType)) {
        orderedFieldTypes.push(fieldType);
        fieldTypes.add(fieldType);
        console.log(`  ✨ New field type discovered: ${fieldType}`);
      }
    }
    
    // Add field types from spread imports in order they appear
    const spreadPattern = /\.\.\.([\w]+)/g;
    let spreadMatch;
    
    while ((spreadMatch = spreadPattern.exec(content)) !== null) {
      const spreadName = spreadMatch[1];
      const spreadTypes = spreadFieldTypes.get(spreadName);
      
      if (spreadTypes) {
        for (const fieldType of spreadTypes) {
          if (!fieldTypes.has(fieldType)) {
            orderedFieldTypes.push(fieldType);
            fieldTypes.add(fieldType);
            console.log(`  ✨ New field type discovered from ${spreadName}: ${fieldType}`);
          }
        }
      }
    }
    
    if (fieldsInFile.length > 0) {
      console.log(`  Fields found:\n${fieldsInFile.join('\n')}`);
    }
  }

  return orderedFieldTypes;
}


/**
 * Main function
 */
function main() {
  // Get models directory from command line or use default
  const args = process.argv.slice(2);
  let modelsDir: string;
  
  if (args[0]) {
    modelsDir = resolve(args[0]);
  } else {
    // Try common locations
    const possiblePaths = [
      'features/keystone/models',
      'keystone/models',
      'src/models',
      'models'
    ];
    
    const found = possiblePaths.find(p => existsSync(p));
    if (found) {
      modelsDir = resolve(found);
    } else {
      console.error('❌ Could not find models directory. Please provide path as argument.');
      console.log('Usage: tsx analyze-field-types.ts [path-to-models-folder]');
      process.exit(1);
    }
  }

  // Find views directory
  let viewsDir: string;
  const possibleViewsPaths = [
    'features/dashboard/views',
    'dashboard/views',
    'src/views',
    'views'
  ];
  
  const foundViews = possibleViewsPaths.find(p => existsSync(p));
  if (foundViews) {
    viewsDir = resolve(foundViews);
  } else {
    console.error('❌ Could not find views directory. Trying relative to models directory...');
    viewsDir = resolve(modelsDir, '../../dashboard/views');
    if (!existsSync(viewsDir)) {
      console.error('❌ Views directory not found. Please ensure views directory exists.');
      process.exit(1);
    }
  }

  console.log(`🔍 Analyzing Keystone models in: ${modelsDir}`);
  console.log(`📁 Using views directory: ${viewsDir}`);
  
  // Get available field types from views directory
  const availableFieldTypes = getAvailableFieldTypes(viewsDir);
  if (availableFieldTypes.length === 0) {
    console.error('❌ No field types found in views directory.');
    process.exit(1);
  }
  
  // Analyze models to get field types in order
  const fieldTypes = analyzeModels(modelsDir, availableFieldTypes);
  
  // Create the mapping object
  const viewsIndexToType: Record<number, string> = {};
  fieldTypes.forEach((fieldType, index) => {
    viewsIndexToType[index] = fieldType;
  });

  console.log('\n✅ Generated views index mapping:');
  console.log(JSON.stringify(viewsIndexToType, null, 2));
  
  console.log('\n📊 Summary:');
  console.log(`  Total field types: ${fieldTypes.length}`);
  console.log(`  Field types in order: ${fieldTypes.join(' → ')}`);
  
  // Generate the getFieldTypeFromViewsIndex.ts file
  const outputPath = join(viewsDir, 'getFieldTypeFromViewsIndex.ts');
  const fileContent = `/**
 * Auto-generated field type mapping from views index
 * This file is generated by index-to-view.ts during migration generation
 * DO NOT EDIT THIS FILE MANUALLY
 */

/**
 * Get the field type from a field's viewsIndex
 * @param viewsIndex The views index of the field
 * @returns The field type name
 */
export function getFieldTypeFromViewsIndex(viewsIndex: number): string {
  const viewsIndexToType: Record<number, string> = {
${Object.entries(viewsIndexToType).map(([key, value]) => `    ${key}: "${value}"`).join(',\n')}
  };

  const fieldType = viewsIndexToType[viewsIndex];
  if (!fieldType) {
    throw new Error(\`Invalid views index: \${viewsIndex}\`);
  }

  return fieldType;
}`;

  writeFileSync(outputPath, fileContent);
  console.log(`\n✅ Generated ${outputPath}`);
  
  // Generate the function code
  console.log('\n📝 Generated function:');
  console.log('```typescript');
  console.log(`export function getFieldTypeFromViewsIndex(viewsIndex: number): string {
  const viewsIndexToType: Record<number, string> = {
${Object.entries(viewsIndexToType).map(([key, value]) => `    ${key}: "${value}"`).join(',\n')}
  };

  const fieldType = viewsIndexToType[viewsIndex];
  if (!fieldType) {
    throw new Error(\`Invalid views index: \${viewsIndex}\`);
  }

  return fieldType;
}`);
  console.log('```');
}

// Run
main();