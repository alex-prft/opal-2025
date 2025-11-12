#!/usr/bin/env npx tsx

/**
 * OPAL Discovery Endpoint Validator
 *
 * Validates OPAL discovery endpoints to prevent the "'str' object has no attribute 'get'" error
 *
 * Usage:
 *   npm run validate:opal                           # Validate all tools
 *   npm run validate:opal -- --tool=workflow       # Validate specific tool
 *   npm run validate:opal -- --url=https://...     # Validate external URL
 */

interface OPALParameter {
  name: string;
  type: string;
  description: string;
  required: boolean;
}

interface OPALFunction {
  name: string;
  description: string;
  parameters: OPALParameter[];
  endpoint: string;
  http_method: string;
}

interface OPALDiscoveryResponse {
  functions: OPALFunction[];
  name?: string;
  description?: string;
  version?: string;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  url: string;
}

class OPALDiscoveryValidator {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }

  async validateTool(toolName: string): Promise<ValidationResult> {
    const url = `${this.baseUrl}/api/tools/${toolName}/discovery`;
    return this.validateUrl(url);
  }

  async validateUrl(url: string): Promise<ValidationResult> {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      url
    };

    try {
      console.log(`🔍 Validating: ${url}`);

      // Test HTTP response
      const response = await fetch(url);

      if (!response.ok) {
        result.errors.push(`HTTP ${response.status}: ${response.statusText}`);
        result.valid = false;
        return result;
      }

      // Validate Content-Type
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        result.errors.push(`Invalid Content-Type: ${contentType} (expected: application/json)`);
        result.valid = false;
      }

      // Check caching headers
      const cacheControl = response.headers.get('cache-control');
      if (cacheControl?.includes('max-age') && !cacheControl.includes('no-cache')) {
        result.warnings.push(`Caching enabled: ${cacheControl} (may cause stale responses)`);
      }

      // Parse JSON response
      let data: any;
      try {
        data = await response.json();
      } catch (e) {
        result.errors.push(`Invalid JSON response: ${e.message}`);
        result.valid = false;
        return result;
      }

      // Validate structure
      this.validateDiscoveryResponse(data, result);

      return result;

    } catch (error) {
      result.errors.push(`Network error: ${error.message}`);
      result.valid = false;
      return result;
    }
  }

  private validateDiscoveryResponse(data: any, result: ValidationResult): void {
    // Check top-level structure
    if (typeof data !== 'object' || data === null) {
      result.errors.push('Response must be a JSON object');
      result.valid = false;
      return;
    }

    // Check for OPAL SDK format (tools object) vs legacy format (functions array)
    if (data.tools && typeof data.tools === 'object') {
      // OPAL SDK format: { tools: { toolName: {...} }, metadata: {...} }
      this.validateOpalSdkFormat(data, result);
    } else if (Array.isArray(data.functions)) {
      // Legacy format: { functions: [...] }
      this.validateLegacyFormat(data, result);
    } else {
      result.errors.push('Missing or invalid "functions" array or "tools" object');
      result.valid = false;
      return;
    }
  }

  private validateOpalSdkFormat(data: any, result: ValidationResult): void {
    // Validate tools object
    const tools = data.tools;
    const toolNames = Object.keys(tools);

    if (toolNames.length === 0) {
      result.warnings.push('Tools object is empty');
    }

    // Validate each tool
    toolNames.forEach((toolName: string) => {
      this.validateOpalTool(tools[toolName], toolName, result);
    });

    // Validate optional metadata
    if (data.metadata) {
      if (typeof data.metadata !== 'object') {
        result.warnings.push('Metadata should be an object');
      } else {
        // Validate metadata structure
        if (data.metadata.service_name && typeof data.metadata.service_name !== 'string') {
          result.warnings.push('Service name should be a string');
        }
        if (data.metadata.version && typeof data.metadata.version !== 'string') {
          result.warnings.push('Service version should be a string');
        }
      }
    }
  }

  private validateLegacyFormat(data: any, result: ValidationResult): void {
    if (data.functions.length === 0) {
      result.warnings.push('Functions array is empty');
    }

    // Validate each function
    data.functions.forEach((func: any, index: number) => {
      this.validateFunction(func, index, result);
    });

    // Validate optional metadata
    if (data.name && typeof data.name !== 'string') {
      result.warnings.push('Tool name should be a string');
    }

    if (data.description && typeof data.description !== 'string') {
      result.warnings.push('Tool description should be a string');
    }

    if (data.version && typeof data.version !== 'string') {
      result.warnings.push('Tool version should be a string');
    }
  }

  private validateOpalTool(tool: any, toolName: string, result: ValidationResult): void {
    const prefix = `Tool ${toolName}`;

    // Required fields validation for OPAL SDK tools
    const requiredFields = ['name', 'description', 'function', 'endpoint'];

    for (const field of requiredFields) {
      if (!tool.hasOwnProperty(field)) {
        result.errors.push(`${prefix}: Missing required field "${field}"`);
        result.valid = false;
      }
    }

    // Name validation
    if (typeof tool.name !== 'string' || tool.name.trim() === '') {
      result.errors.push(`${prefix}: "name" must be a non-empty string`);
      result.valid = false;
    }

    // Description validation
    if (typeof tool.description !== 'string' || tool.description.trim() === '') {
      result.errors.push(`${prefix}: "description" must be a non-empty string`);
      result.valid = false;
    }

    // Function definition validation
    if (tool.function && typeof tool.function === 'object') {
      this.validateOpalFunction(tool.function, `${prefix}.function`, result);
    } else {
      result.errors.push(`${prefix}: "function" must be an object`);
      result.valid = false;
    }

    // Endpoint validation
    if (tool.endpoint && typeof tool.endpoint === 'object') {
      this.validateOpalEndpoint(tool.endpoint, `${prefix}.endpoint`, result);
    } else {
      result.errors.push(`${prefix}: "endpoint" must be an object`);
      result.valid = false;
    }
  }

  private validateOpalFunction(func: any, prefix: string, result: ValidationResult): void {
    // Required fields for OPAL function
    const requiredFields = ['name', 'parameters'];

    for (const field of requiredFields) {
      if (!func.hasOwnProperty(field)) {
        result.errors.push(`${prefix}: Missing required field "${field}"`);
        result.valid = false;
      }
    }

    // Name validation
    if (typeof func.name !== 'string' || func.name.trim() === '') {
      result.errors.push(`${prefix}: "name" must be a non-empty string`);
      result.valid = false;
    }

    // Parameters validation (JSON Schema format is expected for OPAL SDK)
    if (func.parameters && typeof func.parameters === 'object') {
      // This is the JSON Schema format which is correct for OPAL SDK
      if (!func.parameters.type) {
        result.warnings.push(`${prefix}.parameters: Missing "type" field in parameter schema`);
      }
      if (func.parameters.type === 'object' && !func.parameters.properties) {
        result.warnings.push(`${prefix}.parameters: Object type should have "properties" field`);
      }
    } else {
      result.errors.push(`${prefix}: "parameters" must be an object (JSON Schema format)`);
      result.valid = false;
    }

    // Returns validation (optional but recommended)
    if (func.returns && typeof func.returns !== 'object') {
      result.warnings.push(`${prefix}: "returns" should be an object (JSON Schema format)`);
    }
  }

  private validateOpalEndpoint(endpoint: any, prefix: string, result: ValidationResult): void {
    // Required fields for OPAL endpoint
    const requiredFields = ['url', 'method'];

    for (const field of requiredFields) {
      if (!endpoint.hasOwnProperty(field)) {
        result.errors.push(`${prefix}: Missing required field "${field}"`);
        result.valid = false;
      }
    }

    // URL validation
    if (typeof endpoint.url !== 'string' || endpoint.url.trim() === '') {
      result.errors.push(`${prefix}: "url" must be a non-empty string`);
      result.valid = false;
    } else {
      // Check URL format
      try {
        new URL(endpoint.url);
      } catch (e) {
        result.errors.push(`${prefix}: "url" must be a valid URL: ${endpoint.url}`);
        result.valid = false;
      }
    }

    // Method validation
    if (typeof endpoint.method !== 'string') {
      result.errors.push(`${prefix}: "method" must be a string`);
      result.valid = false;
    } else {
      const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
      if (!validMethods.includes(endpoint.method.toUpperCase())) {
        result.warnings.push(`${prefix}: Unusual HTTP method "${endpoint.method}" (common: POST)`);
      }
    }

    // Headers validation (optional)
    if (endpoint.headers && typeof endpoint.headers !== 'object') {
      result.warnings.push(`${prefix}: "headers" should be an object`);
    }
  }

  private validateFunction(func: any, index: number, result: ValidationResult): void {
    const prefix = `Function ${index}`;

    // Required fields validation
    const requiredFields = ['name', 'description', 'parameters', 'endpoint', 'http_method'];

    for (const field of requiredFields) {
      if (!func.hasOwnProperty(field)) {
        result.errors.push(`${prefix}: Missing required field "${field}"`);
        result.valid = false;
      }
    }

    // Name validation
    if (typeof func.name !== 'string' || func.name.trim() === '') {
      result.errors.push(`${prefix}: "name" must be a non-empty string`);
      result.valid = false;
    }

    // Description validation
    if (typeof func.description !== 'string' || func.description.trim() === '') {
      result.errors.push(`${prefix}: "description" must be a non-empty string`);
      result.valid = false;
    }

    // Parameters validation (CRITICAL - this causes the 'str' object error)
    if (!Array.isArray(func.parameters)) {
      result.errors.push(`${prefix}: "parameters" must be an array, not ${typeof func.parameters}`);
      result.errors.push(`${prefix}: ❌ CRITICAL: Using JSON Schema format instead of OPAL parameter array format`);
      result.valid = false;
    } else {
      func.parameters.forEach((param: any, paramIndex: number) => {
        this.validateParameter(param, `${prefix}.parameters[${paramIndex}]`, result);
      });
    }

    // Endpoint validation
    if (typeof func.endpoint !== 'string') {
      result.errors.push(`${prefix}: "endpoint" must be a string`);
      result.valid = false;
    } else {
      // Check for relative vs absolute paths
      if (func.endpoint.startsWith('/api/')) {
        result.warnings.push(`${prefix}: Endpoint "${func.endpoint}" uses absolute path - consider relative path like "/tools/${func.name}"`);
      }

      if (!func.endpoint.startsWith('/')) {
        result.errors.push(`${prefix}: Endpoint "${func.endpoint}" must start with "/"`);
        result.valid = false;
      }
    }

    // HTTP method validation
    if (typeof func.http_method !== 'string') {
      result.errors.push(`${prefix}: "http_method" must be a string`);
      result.valid = false;
    } else {
      const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
      if (!validMethods.includes(func.http_method.toUpperCase())) {
        result.warnings.push(`${prefix}: Unusual HTTP method "${func.http_method}" (common: POST)`);
      }
    }
  }

  private validateParameter(param: any, prefix: string, result: ValidationResult): void {
    // Check if it's the old JSON Schema format
    if (param.hasOwnProperty('type') && param.type === 'object' && param.hasOwnProperty('properties')) {
      result.errors.push(`${prefix}: ❌ CRITICAL: Found JSON Schema format - this causes 'str' object has no attribute 'get' error`);
      result.errors.push(`${prefix}: Convert to OPAL parameter array format: {name, type, description, required}`);
      result.valid = false;
      return;
    }

    // Required parameter fields
    const requiredFields = ['name', 'type', 'description', 'required'];

    for (const field of requiredFields) {
      if (!param.hasOwnProperty(field)) {
        result.errors.push(`${prefix}: Missing required field "${field}"`);
        result.valid = false;
      }
    }

    // Name validation
    if (typeof param.name !== 'string' || param.name.trim() === '') {
      result.errors.push(`${prefix}: "name" must be a non-empty string`);
      result.valid = false;
    }

    // Type validation
    const validTypes = ['string', 'number', 'integer', 'boolean', 'array', 'object'];
    if (!validTypes.includes(param.type)) {
      result.warnings.push(`${prefix}: Unusual parameter type "${param.type}"`);
    }

    // Description validation
    if (typeof param.description !== 'string' || param.description.trim() === '') {
      result.errors.push(`${prefix}: "description" must be a non-empty string`);
      result.valid = false;
    }

    // Required validation
    if (typeof param.required !== 'boolean') {
      result.errors.push(`${prefix}: "required" must be a boolean, not ${typeof param.required}`);
      result.valid = false;
    }

    // Check for problematic properties that cause OPAL issues
    const problematicProps = ['default', 'enum', 'examples', 'items', 'properties', 'additionalProperties'];
    for (const prop of problematicProps) {
      if (param.hasOwnProperty(prop)) {
        result.warnings.push(`${prefix}: Property "${prop}" may cause OPAL parsing issues - consider removing`);
      }
    }
  }

  async validateAllTools(): Promise<ValidationResult[]> {
    const tools = ['workflow', 'odp', 'contentrecs', 'webx', 'cmp', 'cmspaas'];
    const results: ValidationResult[] = [];

    for (const tool of tools) {
      try {
        const result = await this.validateTool(tool);
        results.push(result);
      } catch (error) {
        results.push({
          valid: false,
          errors: [`Failed to validate ${tool}: ${error.message}`],
          warnings: [],
          url: `${this.baseUrl}/api/tools/${tool}/discovery`
        });
      }
    }

    return results;
  }

  printResults(results: ValidationResult[]): void {
    let hasErrors = false;
    let hasWarnings = false;
    let hasCriticalFormatErrors = false;

    console.log('\n📊 OPAL Discovery Validation Results\n');

    results.forEach((result, index) => {
      const toolName = result.url.split('/').slice(-2, -1)[0] || `Tool ${index + 1}`;

      if (result.valid) {
        console.log(`✅ ${toolName}: VALID`);
      } else {
        console.log(`❌ ${toolName}: INVALID`);
        hasErrors = true;

        // Check for the specific "Discovery URL does not return valid functions data" error
        const hasFunctionsFormatError = result.errors.some(error =>
          error.includes('Missing or invalid "functions" array') ||
          error.includes('CRITICAL: Found JSON Schema format') ||
          error.includes('tools object')
        );

        if (hasFunctionsFormatError) {
          hasCriticalFormatErrors = true;
        }
      }

      if (result.errors.length > 0) {
        console.log(`   Errors (${result.errors.length}):`);
        result.errors.forEach(error => {
          if (error.includes('Missing or invalid "functions" array')) {
            console.log(`     🚨 ${error} (This causes "Discovery URL does not return valid functions data")`);
          } else if (error.includes('CRITICAL: Found JSON Schema format')) {
            console.log(`     💥 ${error}`);
          } else {
            console.log(`     • ${error}`);
          }
        });
      }

      if (result.warnings.length > 0) {
        console.log(`   Warnings (${result.warnings.length}):`);
        result.warnings.forEach(warning => console.log(`     • ${warning}`));
        hasWarnings = true;
      }

      console.log(`   URL: ${result.url}\n`);
    });

    // Summary
    const validCount = results.filter(r => r.valid).length;
    console.log(`📈 Summary: ${validCount}/${results.length} tools valid`);

    if (hasErrors) {
      console.log('\n🚨 CRITICAL ERRORS FOUND - These will cause OPAL registration to fail!');

      if (hasCriticalFormatErrors) {
        console.log('\n💥 DETECTED: "Discovery URL does not return valid functions data" ERROR');
        console.log('   🔧 QUICK FIX:');
        console.log('      1. Change response from "tools" object to "functions" array');
        console.log('      2. Convert parameters from JSON Schema to OPAL parameter array format');
        console.log('      3. See: docs/OPAL-Discovery-Fix-Documentation.md');
        console.log('      4. Use template: docs/OPAL-Custom-Tool-Development-Guide.md');
      } else {
        console.log('   Most common fix: Convert JSON Schema format to OPAL parameter array format');
      }

      console.log('   📚 Resources:');
      console.log('      • docs/OPAL-Discovery-Fix-Documentation.md');
      console.log('      • docs/OPAL-Custom-Tool-Development-Guide.md');
      console.log('      • tests/unit/opal-discovery-fix.test.ts\n');
      process.exit(1);
    }

    if (hasWarnings) {
      console.log('\n⚠️  Warnings found - Consider addressing these for better reliability\n');
    } else {
      console.log('\n🎉 All validations passed! Discovery endpoints are OPAL-compatible.\n');
      console.log('✅ No "Discovery URL does not return valid functions data" errors detected!');
      console.log('✅ All endpoints use proper functions array format!');
      console.log('✅ All parameters use OPAL parameter array format!\n');
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const toolArg = args.find(arg => arg.startsWith('--tool='))?.split('=')[1];
  const urlArg = args.find(arg => arg.startsWith('--url='))?.split('=')[1];
  const baseUrlArg = args.find(arg => arg.startsWith('--base-url='))?.split('=')[1];

  const baseUrl = baseUrlArg || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const validator = new OPALDiscoveryValidator(baseUrl);

  let results: ValidationResult[];

  if (urlArg) {
    // Validate specific URL
    const result = await validator.validateUrl(urlArg);
    results = [result];
  } else if (toolArg) {
    // Validate specific tool
    const result = await validator.validateTool(toolArg);
    results = [result];
  } else {
    // Validate all tools
    results = await validator.validateAllTools();
  }

  validator.printResults(results);
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Validation failed:', error.message);
    process.exit(1);
  });
}

export { OPALDiscoveryValidator, ValidationResult, OPALDiscoveryResponse };